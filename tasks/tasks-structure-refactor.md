## Relevant Files

- `app/layout.tsx` - Root layout containing HTML structure and authentication provider
- `app/(auth)/layout.tsx` - Authenticated routes layout with sidebar and header
- `app/(auth)/dashboard/page.tsx` - Dashboard page content
- `app/(auth)/profile/page.tsx` - Profile page content
- `app/(auth)/projects/page.tsx` - Projects list page
- `app/(auth)/projects/[id]/page.tsx` - Individual project page
- `app/(auth)/organizations/page.tsx` - Organizations list page
- `app/(auth)/organizations/[id]/page.tsx` - Individual organization page
- `app/auth/layout.tsx` - Unauthenticated routes layout
- `app/auth/login/page.tsx` - Login page
- `app/auth/register/page.tsx` - Registration page
- `app/auth/logout/page.tsx` - Logout page
- `components/layout/app-shell.tsx` - Main application shell component with sidebar and header
- `components/layout/sidebar.tsx` - Sidebar component
- `components/layout/header.tsx` - Header component
- `components/dashboard/dashboard-content.tsx` - Dashboard content component
- `components/profile/profile-content.tsx` - Profile content component
- `components/projects/project-content.tsx` - Project content component

### Notes

- The structure uses Next.js 15's route groups (parentheses in folder names) to organize routes without affecting the URL structure
- Route groups allow for different layouts for authenticated and unauthenticated routes
- Components are organized by feature to improve maintainability

## Tasks

- [x] 1.0 Create Route Group Structure
  - [x] 1.1 Create `(auth)` route group folder for authenticated routes
  - [x] 1.2 Create `auth` folder for unauthenticated routes
  - [x] 1.3 Move existing authenticated pages to the `(auth)` route group
  - [x] 1.4 Update imports and paths in moved files

- [x] 2.0 Create Layout Components
  - [x] 2.1 Create `components/layout/app-shell.tsx` component
  - [x] 2.2 Extract sidebar functionality from `project-sidebar.tsx` to `components/layout/sidebar.tsx`
  - [x] 2.3 Extract header functionality from `client-dashboard-layout.tsx` to `components/layout/header.tsx`
  - [x] 2.4 Implement context provider for managing sidebar state

- [x] 3.0 Implement Root Layout
  - [x] 3.1 Update `app/layout.tsx` to include only HTML structure and authentication provider
  - [x] 3.2 Remove any page-specific content from the root layout

- [x] 4.0 Implement Authenticated Layout
  - [x] 4.1 Create `app/(auth)/layout.tsx` using the app-shell component
  - [x] 4.2 Configure layout to handle authentication check and redirect if needed
  - [x] 4.3 Set up title handling through metadata or context

- [x] 5.0 Implement Unauthenticated Layout
  - [x] 5.1 Create `app/auth/layout.tsx` for login/register pages
  - [x] 5.2 Style the unauthenticated layout appropriately

- [ ] 6.0 Refactor Page Components
  - [ ] 6.1 Update `dashboard/page.tsx` to contain only dashboard-specific content
  - [ ] 6.2 Update `profile/page.tsx` to contain only profile-specific content
  - [ ] 6.3 Update `projects/page.tsx` to contain only projects list content
  - [ ] 6.4 Update `projects/[id]/page.tsx` to contain only project detail content
  - [ ] 6.5 Update `organizations/page.tsx` to contain only organizations list content
  - [ ] 6.6 Update `organizations/[id]/page.tsx` to contain only organization detail content

- [ ] 7.0 Implement Content Components
  - [ ] 7.1 Create `components/dashboard/dashboard-content.tsx`
  - [ ] 7.2 Create `components/profile/profile-content.tsx`
  - [ ] 7.3 Create `components/projects/project-content.tsx`
  - [ ] 7.4 Create `components/organizations/organization-content.tsx`

- [ ] 8.0 Update Navigation and Routing
  - [ ] 8.1 Update navigation links in sidebar to use the new route structure
  - [ ] 8.2 Update any hardcoded routes throughout the application
  - [ ] 8.3 Update authentication redirects to use the new route structure

- [ ] 9.0 Test and Debug
  - [ ] 9.1 Test authenticated route access and protection
  - [ ] 9.2 Test navigation between different sections
  - [ ] 9.3 Test that layouts are not duplicated or nested incorrectly
  - [ ] 9.4 Verify that page titles are displayed correctly
  - [ ] 9.5 Test responsive behavior of the sidebar and header

- [ ] 10.0 Clean Up Legacy Components
  - [ ] 10.1 Remove `client-dashboard-layout.tsx` after migration
  - [ ] 10.2 Remove or refactor `project-sidebar.tsx` after migration
  - [ ] 10.3 Remove any unused imports or components
  - [ ] 10.4 Update documentation to reflect the new structure 