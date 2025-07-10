# Using Drizzle ORM in FlowBoardAI

This guide explains how to use Drizzle ORM in the FlowBoardAI project to interact with the Neon Postgres database.

## Table of Contents

- [Basic Database Operations](#basic-database-operations)
- [Using in Server Actions](#using-in-server-actions)
- [Relations and Joins](#relations-and-joins)
- [Transactions](#transactions)
- [Using in API Routes](#using-in-api-routes)
- [Using in React Server Components](#using-in-react-server-components)

## Basic Database Operations

### Importing the Database Connection

```typescript
import { db } from '@/lib/db';
import { users, tasks, projects } from '@/lib/db/schema';
```

### SELECT Queries

```typescript
// Get all users
const allUsers = await db.select().from(users);

// Get specific user
const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

// Filter with conditions
import { eq, and, like, gt } from 'drizzle-orm';
const filteredTasks = await db.select()
  .from(tasks)
  .where(
    and(
      eq(tasks.projectId, projectId),
      eq(tasks.status, 'in_progress')
    )
  );

// Get specific columns
const userEmails = await db.select({ 
  email: users.email, 
  name: users.name 
}).from(users);
```

### INSERT Operations

```typescript
// Insert a single record
const newUser = await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com',
}).returning();

// Insert multiple records
const newTasks = await db.insert(tasks).values([
  { title: 'Task 1', projectId: 1, createdBy: 1, status: 'todo' },
  { title: 'Task 2', projectId: 1, createdBy: 1, status: 'todo' }
]).returning();
```

### UPDATE Operations

```typescript
// Update a record
await db.update(tasks)
  .set({ 
    status: 'done',
    updatedAt: new Date()
  })
  .where(eq(tasks.id, taskId));
```

### DELETE Operations

```typescript
// Delete a record
await db.delete(tasks).where(eq(tasks.id, taskId));
```

## Using in Server Actions

Server Actions are a perfect place to use Drizzle ORM in a Next.js application:

```typescript
'use server'

import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function updateTaskStatus(taskId: number, status: string) {
  try {
    const updatedTask = await db.update(tasks)
      .set({ status })
      .where(eq(tasks.id, taskId))
      .returning();
    
    return { success: true, task: updatedTask[0] };
  } catch (error) {
    return { success: false, error: 'Failed to update task' };
  }
}
```

## Relations and Joins

Drizzle ORM provides multiple ways to work with related data:

### Using SQL Joins

```typescript
// Get tasks with their projects
const tasksWithProjects = await db.select({
  taskId: tasks.id,
  taskTitle: tasks.title,
  projectName: projects.name
})
.from(tasks)
.leftJoin(projects, eq(tasks.projectId, projects.id));
```

### Using the Relations API

```typescript
// Using the relations API
const tasksWithRelations = await db.query.tasks.findMany({
  with: {
    project: true,
    subtasks: true,
    assignee: true
  },
  where: eq(tasks.projectId, projectId)
});
```

## Transactions

> **Important Note**: The Neon HTTP driver used in this project **does not support transactions**. 
> Instead, use the sequential operations utility described below.

In a traditional database setup, you would use transactions like this:

```typescript
// THIS WILL NOT WORK WITH NEON HTTP DRIVER
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'John' });
  await tx.insert(posts).values({ title: 'Hello', authorId: 1 });
});
```

### Sequential Operations Alternative

Since transactions are not supported, we've created utility functions in `src/lib/db/sequential-ops.ts` to handle operations that would normally require transactions:

```typescript
import { executeSequential, createWithRelations, updateMultipleEntities } from '@/lib/db/sequential-ops';

// Example 1: Execute operations sequentially
await executeSequential([
  async () => await db.insert(users).values({ name: 'John' }),
  async () => await db.insert(posts).values({ title: 'Hello', authorId: 1 })
]);

// Example 2: Create an entity with related entities
const result = await createWithRelations(
  // Create main entity
  async () => {
    const [user] = await db.insert(users).values({ name: 'John' }).returning();
    return user;
  },
  // Create related entities
  async (user) => {
    const [post] = await db.insert(posts).values({ 
      title: 'Hello', 
      authorId: user.id 
    }).returning();
    return post;
  }
);

// Example 3: Update multiple related entities
await updateMultipleEntities([
  async () => await db.update(users).set({ name: 'John Doe' }).where(eq(users.id, 1)),
  async () => await db.update(posts).set({ title: 'Updated Title' }).where(eq(posts.authorId, 1))
]);
```

### Error Handling

The sequential operations utility includes error handling, but it cannot provide true transaction guarantees:

- If an operation fails, subsequent operations will not be executed
- For `executeSequential`, you can provide rollback operations to be executed if an operation fails
- However, operations that have already completed cannot be truly rolled back

### Best Practices

1. Keep operations as simple as possible
2. Handle errors appropriately
3. Consider implementing application-level validation before performing database operations
4. For critical operations, implement compensating actions in case of failure

## Using in API Routes

Drizzle works great in Next.js API routes:

```typescript
// app/api/tasks/route.ts
import { db } from '@/lib/db';
import { tasks } from '@/lib/db/schema';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const allTasks = await db.select().from(tasks);
    return NextResponse.json(allTasks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch tasks' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newTask = await db.insert(tasks).values(body).returning();
    return NextResponse.json(newTask[0]);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create task' }, 
      { status: 500 }
    );
  }
}
```

## Using in React Server Components

Server Components can directly use Drizzle for data fetching:

```typescript
// app/projects/[id]/page.tsx
import { db } from '@/lib/db';
import { projects, tasks } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const projectId = parseInt(params.id);
  
  const project = await db.query.projects.findFirst({
    where: eq(projects.id, projectId),
    with: {
      tasks: true
    }
  });
  
  if (!project) {
    return <div>Project not found</div>;
  }
  
  return (
    <div>
      <h1>{project.name}</h1>
      <div>
        {project.tasks.map(task => (
          <div key={task.id}>{task.title}</div>
        ))}
      </div>
    </div>
  );
}
```

## Advanced Queries

### Filtering with Complex Conditions

```typescript
import { eq, and, or, not, like, gt, lt, between } from 'drizzle-orm';

const advancedFiltering = await db.select()
  .from(tasks)
  .where(
    and(
      eq(tasks.projectId, projectId),
      or(
        eq(tasks.status, 'todo'),
        eq(tasks.status, 'in_progress')
      ),
      not(eq(tasks.assigneeId, null)),
      like(tasks.title, '%important%'),
      gt(tasks.createdAt, new Date('2023-01-01'))
    )
  );
```

### Ordering Results

```typescript
import { desc, asc } from 'drizzle-orm';

const orderedTasks = await db.select()
  .from(tasks)
  .orderBy(desc(tasks.createdAt), asc(tasks.title));
```

### Pagination

```typescript
const pageSize = 10;
const pageNumber = 2;
const offset = (pageNumber - 1) * pageSize;

const paginatedResults = await db.select()
  .from(tasks)
  .limit(pageSize)
  .offset(offset);
```

## Benefits of Using Drizzle ORM

1. **Type Safety**: Full TypeScript support with autocompletion for tables and columns
2. **Performance**: Minimal overhead compared to raw SQL
3. **SQL-like Syntax**: Familiar query building that resembles SQL
4. **No Runtime Validation**: Schema is used for types only, no runtime overhead
5. **Prepared Statements**: Protection against SQL injection
6. **Migrations**: Built-in migration tools

## Best Practices

1. **Use Server Components/Actions**: Keep database queries on the server
2. **Leverage Relations**: Use the relations API for cleaner code
3. **Use Transactions**: For operations that need to be atomic
4. **Error Handling**: Always handle database errors gracefully
5. **Migrations**: Generate and apply migrations when schema changes 