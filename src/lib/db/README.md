# Database Management

This directory contains database-related files and utilities for the Kanban board application.

## Schema

The database schema is defined in `schema.ts` using Drizzle ORM. It includes tables for:

- Organizations
- Users
- Projects
- Tasks
- Subtasks
- Comments
- And various relationships between these entities

## Migrations

The application uses Drizzle Kit for database migrations. Migration scripts are available in the `migrations` directory.

To run all migrations:

```bash
npm run db:migrate
```

To run specific migrations:

```bash
npm run db:migrate:org     # Run organization schema migration
npm run db:migrate:user    # Run user schema migration
npm run db:migrate:project # Run project schema migration
npm run db:migrate:task    # Run task schema migration
npm run db:migrate:subtask # Run subtask schema migration
npm run db:migrate:comment # Run comment schema migration
npm run db:migrate:relationships # Run relationships migration
```

## Database Seeding

The application includes a seed script to populate the database with sample data for development purposes.

### Sample Data

The seed script creates:

- 4 users (admin, project manager, developer, designer)
- 2 organizations
- 3 projects
- Multiple tasks, subtasks, and comments

### Usage

To seed the database:

```bash
npm run db:seed
```

Note: The seed script will only run if the database is empty (no existing users). This prevents accidental data duplication.

### Development Credentials

After running the seed script, you can log in with the following credentials:

- Admin User:
  - Email: admin@example.com
  - Password: password123

- Project Manager:
  - Email: john@example.com
  - Password: password123

- Developer:
  - Email: jane@example.com
  - Password: password123

- Designer:
  - Email: bob@example.com
  - Password: password123

## Database Studio

To view and manage the database using Drizzle Studio:

```bash
npm run db:studio
```

This will start a local web interface for exploring and modifying the database. 