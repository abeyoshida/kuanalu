# Task Status Migration

This document outlines the changes made for Task 10.1 to change the kanban board column titles from "Backlog" to "Todo" and "Todo" to "Today".

## Changes Made

1. Updated the `taskStatusEnum` in `src/lib/db/schema.ts` to change 'backlog' to 'todo' and 'todo' to 'today'.
2. Updated the column titles in `src/components/kanban-board.tsx` and `src/components/project-kanban-board.tsx`.
3. Updated the `TaskStatus` type in `src/types/task.ts` and `src/types/tasks.ts`.
4. Updated the task status options in the task edit dialog in `src/components/task-detail.tsx`.
5. Updated the task status options in the create task dialog in `src/components/create-task-dialog.tsx`.

## Database Migration

The database migration requires a more complex approach due to the following constraints:

1. The `task_status` is defined as a PostgreSQL enum type.
2. Changing enum values requires multiple steps:
   - Rename the old enum type
   - Create a new enum type with the updated values
   - Update the column to use the new enum type
   - Drop the old enum type

3. The migration script encountered issues with the Neon database:
   - No transaction support in neon-http driver
   - Cannot execute multiple SQL statements in a single query
   - Default value casting issues

## Manual Migration Steps

To complete the database migration, the following SQL statements need to be executed in the database:

```sql
-- Step 1: Rename the old enum type
ALTER TYPE task_status RENAME TO task_status_old;

-- Step 2: Create the new enum type
CREATE TYPE task_status AS ENUM ('todo', 'today', 'in_progress', 'in_review', 'done');

-- Step 3: Update the column using the new enum type
ALTER TABLE tasks ALTER COLUMN status DROP DEFAULT;
ALTER TABLE tasks ALTER COLUMN status TYPE task_status USING 
  CASE 
    WHEN status::text = 'backlog' THEN 'todo'::task_status
    WHEN status::text = 'todo' THEN 'today'::task_status
    ELSE status::text::task_status
  END;
ALTER TABLE tasks ALTER COLUMN status SET DEFAULT 'todo';

-- Step 4: Drop the old enum type
DROP TYPE task_status_old;
```

These steps should be executed in the database management tool or console. 