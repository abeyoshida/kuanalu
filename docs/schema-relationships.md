# Database Schema Relationships

This document outlines the relationships between the different tables in the database schema.

## Core Entities

### Users

- **One-to-Many**:
  - User → Projects (as owner)
  - User → Tasks (as assignee)
  - User → Tasks (as reporter)
  - User → Tasks (as creator)
  - User → Subtasks (as assignee)
  - User → Subtasks (as creator)
  - User → Comments
  - User → Edited Comments
  - User → Resolved Comments
  - User → Invitations (as inviter)
  - User → Sessions

- **Many-to-Many** (through junction tables):
  - User ↔ Organizations (through organization_members)
  - User ↔ Projects (through project_members)

### Organizations

- **One-to-Many**:
  - Organization → Projects
  - Organization → Invitations
  - Organization → Project Categories

- **Many-to-Many** (through junction tables):
  - Organization ↔ Users (through organization_members)

### Projects

- **One-to-Many**:
  - Project → Tasks

- **Many-to-Many** (through junction tables):
  - Project ↔ Users (through project_members)
  - Project ↔ Categories (through project_category_assignments)

- **Belongs To**:
  - Project → Organization
  - Project → User (as owner)

### Tasks

- **One-to-Many**:
  - Task → Subtasks
  - Task → Comments
  - Task → Child Tasks (self-referential)

- **Belongs To**:
  - Task → Project
  - Task → User (as assignee)
  - Task → User (as reporter)
  - Task → User (as creator)
  - Task → Task (as parent task, self-referential)

### Subtasks

- **Belongs To**:
  - Subtask → Task
  - Subtask → User (as assignee)
  - Subtask → User (as creator)

### Comments

- **One-to-Many**:
  - Comment → Child Comments (self-referential)

- **Belongs To**:
  - Comment → Task
  - Comment → User (author)
  - Comment → User (editor)
  - Comment → User (resolver)
  - Comment → Comment (as parent comment, self-referential)

## Relationship Diagram

```
┌─────────────┐       ┌───────────────┐       ┌────────────┐
│    Users    │◄──────┤Organization   │◄──────┤  Projects  │
└─────┬───────┘       │   Members     │       └──────┬─────┘
      │               └───────────────┘              │
      │                                              │
      │               ┌───────────────┐              │
      └──────────────►│Project Members│◄─────────────┘
                      └───────────────┘
                              │
                              │
┌─────────────┐       ┌──────┴─────┐       ┌────────────┐
│  Comments   │◄──────┤    Tasks   │◄──────┤  Subtasks  │
└─────────────┘       └────────────┘       └────────────┘
```

## Foreign Key Constraints

All relationships are enforced with appropriate foreign key constraints:

- Most child records are deleted when their parent is deleted (CASCADE)
- For optional relationships, the foreign key is set to NULL when the parent is deleted (SET NULL)
- Self-referential relationships (like task parent-child) use SET NULL to avoid circular dependencies

## Performance Optimizations

Indexes have been created for all foreign keys to ensure efficient querying:

- All primary keys are indexed by default
- Foreign keys like task_id, user_id, project_id, etc. have dedicated indexes
- Commonly filtered fields like status, is_resolved, etc. have indexes

## Query Patterns

Common query patterns are optimized:

1. Fetching all tasks for a project
2. Fetching all comments for a task
3. Fetching all subtasks for a task
4. Fetching all tasks assigned to a user
5. Fetching all members of an organization or project 