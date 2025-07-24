import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function migratePasswords() {
  console.log('Starting password migration...');
  
  try {
    const allUsers = await db.select().from(users);
    let migratedCount = 0;
    let skippedCount = 0;
    
    console.log(`Found ${allUsers.length} users to check`);
    
    for (const user of allUsers) {
      if (user.password) {
        // Check if password is already encrypted (bcrypt hash starts with $2b$, $2a$, or $2y$)
        if (user.password.match(/^\$2[aby]\$/)) {
          console.log(`Skipping user ${user.email} - password already encrypted`);
          skippedCount++;
          continue;
        }
        
        // Encrypt the plain text password
        const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        // Update the user's password in the database
        await db.update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        
        migratedCount++;
        console.log(`✅ Migrated password for user: ${user.email}`);
      } else {
        console.log(`⚠️  User ${user.email} has no password - skipping`);
        skippedCount++;
      }
    }
    
    console.log('\n=== Migration Summary ===');
    console.log(`Total users checked: ${allUsers.length}`);
    console.log(`Passwords migrated: ${migratedCount}`);
    console.log(`Users skipped: ${skippedCount}`);
    console.log('Migration completed successfully! 🎉');
    
    return { migrated: migratedCount, skipped: skippedCount, total: allUsers.length };
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Function to check password status without migrating
export async function checkPasswordStatus() {
  console.log('Checking password encryption status...\n');
  
  try {
    const allUsers = await db.select().from(users).orderBy(users.email);
    let encryptedCount = 0;
    let plainTextCount = 0;
    let noPasswordCount = 0;
    
    for (const user of allUsers) {
      if (!user.password) {
        console.log(`❌ ${user.email} - No password`);
        noPasswordCount++;
      } else if (user.password.match(/^\$2[aby]\$/)) {
        console.log(`🔒 ${user.email} - Encrypted`);
        encryptedCount++;
      } else {
        console.log(`⚠️  ${user.email} - Plain text`);
        plainTextCount++;
      }
    }
    
    console.log('\n=== Password Status Summary ===');
    console.log(`Encrypted passwords: ${encryptedCount}`);
    console.log(`Plain text passwords: ${plainTextCount}`);
    console.log(`No password set: ${noPasswordCount}`);
    console.log(`Total users: ${allUsers.length}`);
    
    return { encrypted: encryptedCount, plainText: plainTextCount, noPassword: noPasswordCount, total: allUsers.length };
  } catch (error) {
    console.error('❌ Failed to check password status:', error);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'check') {
    checkPasswordStatus()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else if (command === 'migrate') {
    migratePasswords()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    console.log('Usage:');
    console.log('  npm run password-migration check   - Check password encryption status');
    console.log('  npm run password-migration migrate - Migrate plain text passwords to encrypted');
  }
} 