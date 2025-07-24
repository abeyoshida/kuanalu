# Password Encryption Guide

## Current Implementation

The system now supports **both encrypted and plain text passwords** for maximum flexibility during development:

### How it works:
1. **Registration**: Always encrypts passwords using bcrypt
2. **Login**: Automatically detects password format and validates accordingly
   - If password starts with `$2b$`, `$2a$`, or `$2y$` → Uses bcrypt comparison
   - Otherwise → Uses plain text comparison (dev only)

## Production Recommendations

### Option 1: Full Encryption (Recommended for Production)

**Steps to implement:**

1. **Update Registration** (Already implemented):
   ```javascript
   const hashedPassword = await bcrypt.hash(password, 10);
   ```

2. **Update Login** (Already implemented):
   ```javascript
   const passwordsMatch = await bcrypt.compare(inputPassword, storedPassword);
   ```

3. **Migrate Existing Users**:
   ```javascript
   // Script to encrypt all plain text passwords
   const users = await db.select().from(users);
   for (const user of users) {
     if (user.password && !user.password.match(/^\$2[aby]\$/)) {
       const hashedPassword = await bcrypt.hash(user.password, 10);
       await db.update(users)
         .set({ password: hashedPassword })
         .where(eq(users.id, user.id));
     }
   }
   ```

### Option 2: Environment-Based Encryption

Add encryption toggle based on environment:

```javascript
// In registration
const password = process.env.NODE_ENV === 'production' 
  ? await bcrypt.hash(rawPassword, 10)
  : rawPassword;

// In login
const passwordsMatch = process.env.NODE_ENV === 'production'
  ? await bcrypt.compare(inputPassword, storedPassword)
  : storedPassword === inputPassword;
```

### Option 3: Hybrid Approach (Current Implementation)

Keep the current auto-detection system that handles both formats.

## Security Considerations

### For Production:
- ✅ Use bcrypt with salt rounds 10-12
- ✅ Never store plain text passwords
- ✅ Use environment variables for bcrypt rounds
- ✅ Implement rate limiting on login attempts
- ✅ Add password strength requirements

### For Development:
- ⚠️ Plain text passwords acceptable for local development only
- ⚠️ Never deploy plain text passwords to production
- ⚠️ Use separate databases for dev/prod

## Implementation Steps

### Step 1: New User Registration with Encrypted Password

```javascript
// In registration API
export async function POST(request: NextRequest) {
  const { password, ...otherData } = await request.json();
  
  // Hash password (salt rounds: 10 for dev, 12 for prod)
  const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  // Save to database
  await db.insert(users).values({
    ...otherData,
    password: hashedPassword
  });
}
```

### Step 2: Returning User Login with Password Validation

```javascript
// In auth config
async function validatePassword(inputPassword: string, storedPassword: string): Promise<boolean> {
  // Check if stored password is bcrypt hashed
  if (storedPassword.match(/^\$2[aby]\$/)) {
    return await bcrypt.compare(inputPassword, storedPassword);
  } else {
    // Dev only: plain text comparison
    return storedPassword === inputPassword;
  }
}
```

### Step 3: Password Migration Script

Create `src/scripts/migrate-passwords.ts`:

```javascript
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function migratePasswords() {
  console.log('Starting password migration...');
  
  const allUsers = await db.select().from(users);
  let migratedCount = 0;
  
  for (const user of allUsers) {
    if (user.password && !user.password.match(/^\$2[aby]\$/)) {
      const hashedPassword = await bcrypt.hash(user.password, 12);
      
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));
      
      migratedCount++;
      console.log(`Migrated password for user: ${user.email}`);
    }
  }
  
  console.log(`Migration complete. ${migratedCount} passwords encrypted.`);
}
```

## Testing

### Test Encrypted Password Flow:
1. Register new user → Password should be bcrypt hash in DB
2. Login with same user → Should authenticate successfully
3. Try wrong password → Should fail authentication

### Test Plain Text Compatibility (Dev only):
1. Manually insert user with plain text password in dev DB
2. Login should work with plain text comparison
3. Registration should still create encrypted passwords

## Environment Variables

Add to `.env.local`:
```bash
# Password encryption settings
BCRYPT_SALT_ROUNDS=12
FORCE_PASSWORD_ENCRYPTION=true  # For production
```

## Deployment Checklist

Before deploying to production:
- [ ] All passwords in production DB are encrypted
- [ ] Environment variables set correctly
- [ ] Rate limiting implemented on auth endpoints
- [ ] Password strength validation in place
- [ ] Session security configured properly
- [ ] HTTPS enforced 