# FlowBoardAI Role-Based Permission System

This document explains the role-based permission system implemented in FlowBoardAI.

## Overview

FlowBoardAI uses a comprehensive role-based access control (RBAC) system to manage permissions across the application. The system is designed to be flexible, easy to understand, and efficient.

## Roles and Hierarchy

The system defines four roles in descending order of authority:

1. **Owner** - Has complete control over an organization
2. **Admin** - Has administrative privileges within an organization
3. **Member** - Regular user with standard permissions
4. **Guest** - Limited access user

## Permission Structure

Each permission consists of:

- **Action** - What the user is trying to do (e.g., create, read, update, delete)
- **Subject** - What the user is trying to act upon (e.g., project, task, comment)

## Permission Checks

Permissions can be checked in several ways:

### Server-Side Checks

- `hasPermission(userId, organizationId, action, subject)` - Check if a user has a specific permission
- `hasMultiplePermissions(userId, organizationId, permissions)` - Check if a user has all specified permissions
- `hasAnyPermission(userId, organizationId, permissions)` - Check if a user has any of the specified permissions
- `getUserRole(userId, organizationId)` - Get a user's role in an organization

### Client-Side Checks

- `roleHasPermission(role, action, subject)` - Check if a role has a specific permission
- `roleHasMultiplePermissions(role, permissions)` - Check if a role has all specified permissions
- `roleHasAnyPermission(role, permissions)` - Check if a role has any of the specified permissions
- `isRoleHigherThan(role1, role2)` - Check if one role is higher than another in the hierarchy
- `canManageRole(managerRole, targetRole)` - Check if one role can manage another

### React Components

- `<WithPermission>` - Conditionally render based on a single permission
- `<WithMultiplePermissions>` - Conditionally render based on multiple permissions
- `<WithAsyncPermission>` - Conditionally render based on async permission check
- `<WithAsyncMultiplePermissions>` - Conditionally render based on async multiple permission checks

## Permission Definitions

Permissions for each role are defined in `src/lib/auth/permissions-data.ts`. This is the single source of truth for all permissions in the application.

## Usage Examples

### Server-Side Example

```typescript
import { hasPermission } from '@/lib/auth/permissions';

async function updateProject(userId: number, projectId: number, data: any) {
  // Get organization ID for the project
  const organizationId = await getOrganizationIdForProject(projectId);
  
  // Check if user has permission to update projects
  const canUpdate = await hasPermission(userId, organizationId, 'update', 'project');
  
  if (!canUpdate) {
    throw new Error("You don't have permission to update this project");
  }
  
  // Proceed with update
  return await db.update(projects).set(data).where(eq(projects.id, projectId));
}
```

### Client-Side Component Example

```tsx
import { WithPermission } from '@/components/auth/with-permission';

function ProjectActions({ userRole, projectId }) {
  return (
    <div>
      <WithPermission userRole={userRole} action="update" subject="project">
        <button>Edit Project</button>
      </WithPermission>
      
      <WithPermission userRole={userRole} action="delete" subject="project">
        <button>Delete Project</button>
      </WithPermission>
    </div>
  );
}
```

## Database Transactions and Sequential Operations

Since the Neon HTTP driver doesn't support transactions, we use sequential operations to maintain data integrity. The `sequential-ops.ts` utility provides functions to handle operations that would normally require transactions:

- `executeSequential(operations, rollbackOperations)` - Execute operations in sequence with optional rollback
- `createWithRelations(createMainEntity, createRelatedEntities)` - Create a main entity and its related entities
- `updateMultipleEntities(updateOperations)` - Update multiple entities sequentially

### Example

```typescript
import { createWithRelations } from '@/lib/db/sequential-ops';

// Create a user and their organization
const result = await createWithRelations(
  // Create user
  async () => {
    const [user] = await db.insert(users).values({...}).returning();
    return user;
  },
  // Create organization and add user as member
  async (user) => {
    const [org] = await db.insert(organizations).values({...}).returning();
    await db.insert(organizationMembers).values({
      userId: user.id,
      organizationId: org.id,
      role: 'owner'
    });
    return org;
  }
);
```

## Best Practices

1. Always check permissions before performing sensitive operations
2. Use the appropriate permission check function for your use case
3. Keep permission definitions in `permissions-data.ts` up to date
4. For complex operations that would normally use transactions, use the sequential operations utility 