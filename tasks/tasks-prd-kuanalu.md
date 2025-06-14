## Relevant Files

- `app/layout.tsx` - Main layout component for the application
- `app/page.tsx` - Homepage component
- `lib/db/schema.ts` - Database schema definitions using Drizzle ORM
- `lib/db/index.ts` - Database connection setup
- `components/auth/` - Authentication components
- `components/ui/` - Reusable UI components
- `components/kanban-board.tsx` - Kanban board component
- `components/task-card.tsx` - Task card component
- `components/task-detail.tsx` - Task detail page component
- `app/api/auth/[...nextauth]/route.ts` - Authentication API routes
- `app/api/tasks/route.ts` - Tasks API endpoints
- `app/api/projects/route.ts` - Projects API endpoints
- `app/api/organizations/route.ts` - Organizations API endpoints
- `app/task/[id]/page.tsx` - Task detail page
- `app/projects/[id]/page.tsx` - Project page with task board
- `app/projects/[id]/list/page.tsx` - List view for tasks
- `app/projects/[id]/calendar/page.tsx` - Calendar view for tasks

### Notes

- Unit tests should be placed alongside the code files they are testing
- Use `npx jest [optional/path/to/test/file]` to run tests
- For database migrations, use Drizzle's migration tools: `npx drizzle-kit push:pg`
- Use Shadcn UI components for consistent styling and accessibility

## Tasks

- [x] 1.0 Project Setup and Configuration
  - [x] 1.1 Initialize Next.js project with TypeScript and Tailwind CSS
  - [x] 1.2 Set up project folder structure (app, components, lib)
  - [x] 1.3 Configure Drizzle ORM with Neon Postgres
  - [x] 1.4 Set up environment variables (.env.local)
  - [x] 1.5 Install and configure required dependencies
  - [x] 1.6 Set up authentication provider (NextAuth.js)
  - [x] 1.7 Configure ESLint and Prettier
  - [x] 1.8 Set up base layout and theme with Tailwind
  - [x] 1.9 Create reusable UI components with Shadcn UI

- [ ] 2.0 Authentication and User Management
  - [ ] 2.1 Implement user registration flow
  - [ ] 2.2 Implement login functionality
  - [ ] 2.3 Create user profile page
  - [ ] 2.4 Implement role-based access control
  - [ ] 2.5 Create organization creation and management UI
  - [ ] 2.6 Implement user invitation system
  - [ ] 2.7 Create organization settings page
  - [ ] 2.8 Implement user role management within organizations
  - [ ] 2.9 Add protected routes and authentication middleware

- [ ] 3.0 Database Schema and API Development
  - [ ] 3.1 Define organization schema
  - [ ] 3.2 Define user schema with role information
  - [ ] 3.3 Define project schema
  - [ ] 3.4 Define task schema with status, priority fields
  - [ ] 3.5 Define subtask schema
  - [ ] 3.6 Define comment schema
  - [ ] 3.7 Create relationships between schemas
  - [ ] 3.8 Implement organization API endpoints
  - [ ] 3.9 Implement project API endpoints
  - [ ] 3.10 Implement task API endpoints
  - [ ] 3.11 Implement subtask API endpoints
  - [ ] 3.12 Implement comment API endpoints
  - [ ] 3.13 Add validation to all API endpoints
  - [ ] 3.14 Create database seed script for development

- [ ] 4.0 Kanban Board Implementation
  - [ ] 4.1 Create kanban board layout with 5 columns
  - [ ] 4.2 Implement task card component
  - [ ] 4.3 Add drag and drop functionality between columns
  - [ ] 4.4 Implement task status updates on drop
  - [ ] 4.5 Add visual feedback during dragging
  - [ ] 4.6 Create task filtering functionality
  - [ ] 4.7 Implement task sorting options
  - [ ] 4.8 Add create task button and modal
  - [ ] 4.9 Create project sidebar component
  - [ ] 4.10 Implement responsive design for kanban board

- [ ] 5.0 Task Management Features
  - [ ] 5.1 Create task detail page layout (2-column)
  - [ ] 5.2 Implement task information section
  - [ ] 5.3 Create subtask management UI
  - [ ] 5.4 Implement subtask creation, editing, and completion
  - [ ] 5.5 Create comments section
  - [ ] 5.6 Implement comment creation and display
  - [ ] 5.7 Add task details sidebar with metadata
  - [ ] 5.8 Implement task editing functionality
  - [ ] 5.9 Create task assignment dropdown
  - [ ] 5.10 Add priority selection UI
  - [ ] 5.11 Implement due date picker
  - [ ] 5.12 Create task history/activity log

- [ ] 6.0 Additional Views (List and Calendar)
  - [ ] 6.1 Create list view component for tasks
  - [ ] 6.2 Implement sorting and filtering in list view
  - [ ] 6.3 Add pagination to list view
  - [ ] 6.4 Create calendar view component
  - [ ] 6.5 Implement task display by due date in calendar
  - [ ] 6.6 Add month/week/day view options in calendar
  - [ ] 6.7 Create view switcher component
  - [ ] 6.8 Implement consistent task actions across views
  - [ ] 6.9 Ensure responsive design for all views

- [ ] 7.0 Email Notifications
  - [ ] 7.1 Set up email service provider
  - [ ] 7.2 Create email templates for notifications
  - [ ] 7.3 Implement task assignment notification
  - [ ] 7.4 Add task update notification logic
  - [ ] 7.5 Create comment notification system
  - [ ] 7.6 Implement notification preferences for users
  - [ ] 7.7 Add email queue for reliable delivery
  - [ ] 7.8 Create notification history page 