# API Permission Checks

This document outlines the implementation of permission checks in the API routes of the FlowBoard application.

## Overview

The API permission system ensures that users can only access resources they have permission to, based on their role in the organization. The permission checks are implemented at both the API route level and in the server actions.

## Permission Validation Utilities

We've created a set of utilities in `src/lib/validation/permission-validation.ts` to make it easy to implement consistent permission checks across all API routes:

### Core Functions

- `validatePermission`: Checks if a user has permission to perform an action on a subject in an organization
- `getOrganizationIdFromProject`: Gets the organization ID for a project
- `getOrganizationIdFromTask`: Gets the organization ID for a task
- `getOrganizationIdFromSubtask`: Gets the organization ID for a subtask
- `getOrganizationIdFromComment`: Gets the organization ID for a comment

### Resource-Specific Permission Validators

These functions combine authentication validation, parameter validation, and permission validation:

- `validateProjectPermission`: Validates permissions for project operations
- `validateTaskPermission`: Validates permissions for task operations
- `validateSubtaskPermission`: Validates permissions for subtask operations
- `validateCommentPermission`: Validates permissions for comment operations
- `validateOrganizationPermission`: Validates permissions for organization operations

## Implementation in API Routes

All API routes follow a consistent pattern for permission checks:

1. Authenticate the user with `validateAuthentication`
2. Validate the resource ID with `validateNumericParam`
3. Validate the permission with the appropriate resource validator
4. Perform the requested operation
5. Handle errors with `handleApiError`

Example:

```typescript
// GET /api/tasks/[id] - Get a specific task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Validate authentication
    const authError = validateAuthentication(session);
    if (authError) return authError;
    
    // Validate task ID
    const taskIdResult = validateNumericParam(params.id, "task ID");
    if (typeof taskIdResult !== 'number') {
      return taskIdResult;
    }
    
    // Validate permission
    const permissionError = await validateTaskPermission(session, taskIdResult, 'read');
    if (permissionError) return permissionError;
    
    // Get the task
    const task = await getTaskById(taskIdResult);
    
    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(task);
  } catch (error) {
    return handleApiError(error, "task");
  }
}
```

## Permission Flow

1. The API route receives a request
2. The route validates authentication and parameters
3. The route calls the appropriate permission validator
4. The validator gets the organization ID for the resource
5. The validator calls `hasPermission` to check if the user has the required permission
6. If the user has permission, the operation proceeds; otherwise, a 403 error is returned

## Benefits

- **Consistency**: All API routes follow the same pattern for permission checks
- **Reusability**: Permission validation functions can be reused across multiple routes
- **Maintainability**: Permission logic is centralized in one place
- **Security**: All API routes have proper permission checks

## Future Improvements

- Add caching for permission checks to improve performance
- Implement more granular permissions for specific operations
- Add audit logging for permission checks 