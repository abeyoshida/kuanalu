.
|--components-orig.json
|--components.json
|--docs
|--| schema-relationships.md
|--documentation
|--| drizzle-usage.md
|--drizzle
|--drizzle.config.ts
|--| 0000_violet_bruce_banner.sql
|--| meta
|--| | _journal.json
|--| | 0000_snapshot.json
|--eslint.config.mjs
|--next-env.d.ts
|--next.config.js
|--next.config.ts
|--package-lock.json
|--package.json
|--postcss.config.js
|--postcss.config.mjs
|--public
|--| file.svg
|--| globe.svg
|--| image-v0-landing-page.png
|--| image-v0-task-details-page.png
|--| next.svg
|--| placeholder.svg
|--| vercel.svg
|--| window.svg
|--README.md
|--src
|--| app
|--| | layout.tsx                    # Root layout (html, body, auth provider)
|--| | page.tsx                      # Landing page
|--| | (auth)                        # Route group for authenticated routes
|--| | | layout.tsx                  # Authenticated layout with sidebar and header
|--| | | dashboard
|--| | | | page.tsx                  # Dashboard page content only
|--| | | organizations
|--| | | | [id]
|--| | | | | page.tsx                # Organization detail page content
|--| | | | page.tsx                  # Organizations list page content
|--| | | profile
|--| | | | page.tsx                  # Profile page content
|--| | | projects
|--| | | | [id]
|--| | | | | page.tsx                # Project detail page content
|--| | | | page.tsx                  # Projects list page content
|--| | | task
|--| | | | [id]
|--| | | | | page.tsx                # Task detail page content
|--| | auth                          # Unauthenticated routes
|--| | | layout.tsx                  # Auth layout for login/register
|--| | | error
|--| | | | page.tsx
|--| | | login
|--| | | | page.tsx
|--| | | logout
|--| | | | page.tsx
|--| | | register
|--| | | | page.tsx
|--| | api                           # API routes (unchanged)
|--| | | auth
|--| | | | [...nextauth]
|--| | | | | route.ts
|--| | | | check
|--| | | | | route.ts
|--| | | | logout
|--| | | | | route.ts
|--| | | | register
|--| | | | | route.ts
|--| | | | session
|--| | | | | route.ts
|--| | | | verify-credentials
|--| | | | | route.ts
|--| | | comments
|--| | | | [id]
|--| | | | | replies
|--| | | | | | route.ts
|--| | | | | route.ts
|--| | | invitations
|--| | | | accept
|--| | | | | route.ts
|--| | | organizations
|--| | | | [id]
|--| | | | | members
|--| | | | | | [userId]
|--| | | | | | | route.ts
|--| | | | | | route.ts
|--| | | | | projects
|--| | | | | | route.ts
|--| | | | | route.ts
|--| | | | route.ts
|--| | | projects
|--| | | | [id]
|--| | | | | categories
|--| | | | | | [categoryId]
|--| | | | | | | route.ts
|--| | | | | | route.ts
|--| | | | | members
|--| | | | | | [userId]
|--| | | | | | | route.ts
|--| | | | | | route.ts
|--| | | | | route.ts
|--| | | | | tasks
|--| | | | | | route.ts
|--| | | | route.ts
|--| | | subtasks
|--| | | | [id]
|--| | | | | position
|--| | | | | | route.ts
|--| | | | | route.ts
|--| | | tasks
|--| | | | [id]
|--| | | | | comments
|--| | | | | | route.ts
|--| | | | | position
|--| | | | | | route.ts
|--| | | | | route.ts
|--| | | | | subtasks
|--| | | | | | route.ts
|--| | | | route.ts
|--| | | user
|--| | | | password
|--| | | | | route.ts
|--| | | | profile
|--| | | | | route.ts
|--| | globals.css
|--| | favicon.ico
|--| components
|--| | auth                          # Auth components (unchanged)
|--| | | auth-provider.tsx
|--| | | login-form.tsx
|--| | | register-form.tsx
|--| | | role-manager.tsx
|--| | | user-profile-form.tsx
|--| | | with-permission.tsx
|--| | layout                        # New layout components
|--| | | app-shell.tsx               # Main application shell with sidebar and header
|--| | | sidebar.tsx                 # Extracted from project-sidebar.tsx
|--| | | header.tsx                  # Extracted from client-dashboard-layout.tsx
|--| | dashboard
|--| | | dashboard-content.tsx       # Dashboard content component
|--| | organizations
|--| | | organization-content.tsx    # Organization content component
|--| | | create-organization-dialog.tsx
|--| | | create-project-dialog.tsx
|--| | | invite-user-dialog.tsx
|--| | | organization-members.tsx
|--| | | organization-projects.tsx
|--| | | organization-settings.tsx
|--| | | pending-invitations.tsx
|--| | profile
|--| | | profile-content.tsx         # Profile content component
|--| | projects
|--| | | project-content.tsx         # Project content component
|--| | tasks
|--| | | task-content.tsx            # Task content component
|--| | error-boundary.tsx
|--| | kanban-board.tsx
|--| | kanban-column.tsx
|--| | project-kanban-board.tsx
|--| | task-card.tsx
|--| | task-detail.tsx
|--| | ui                            # UI components (unchanged)
|--| | | alert-dialog.tsx
|--| | | alert.tsx
|--| | | avatar.tsx
|--| | | badge.tsx
|--| | | button.tsx
|--| | | card.tsx
|--| | | checkbox.tsx
|--| | | dialog.tsx
|--| | | dropdown-menu.tsx
|--| | | input.tsx
|--| | | label.tsx
|--| | | select.tsx
|--| | | separator.tsx
|--| | | switch.tsx
|--| | | tabs.tsx
|--| | | textarea.tsx
|--| | | toast.tsx
|--| | | toaster.tsx
|--| hooks
|--| | use-toast.ts
|--| | use-sidebar.ts               # New hook for sidebar state management
|--| lib                            # Lib directory (unchanged)
|--| | actions
|--| | | comment-actions.ts
|--| | | invitation-actions.ts
|--| | | organization-actions.ts
|--| | | project-actions.ts
|--| | | role-actions.ts
|--| | | subtask-actions.ts
|--| | | task-actions.ts
|--| | | user-actions.ts
|--| | auth
|--| | | auth.config.ts
|--| | | auth.ts
|--| | | client-permissions.ts
|--| | | client.ts
|--| | | permissions-data.ts
|--| | | permissions.ts
|--| | | server-permissions.ts
|--| | db
|--| | | add-bio-column.ts
|--| | | add-role-enum.ts
|--| | | check-tables.ts
|--| | | client.ts
|--| | | create-tables.ts
|--| | | create-users-table.ts
|--| | | index.ts
|--| | | migrate-rbac.js
|--| | | migrate-rbac.ts
|--| | | migrate.ts
|--| | | migrations
|--| | | | add-invitations-table.ts
|--| | | | enhance-comment-schema.ts
|--| | | | enhance-organization-schema.ts
|--| | | | enhance-project-schema.ts
|--| | | | enhance-relationships.ts
|--| | | | enhance-subtask-schema.ts
|--| | | | enhance-task-schema.ts
|--| | | | enhance-user-schema.ts
|--| | | README.md
|--| | | run-comment-migration.ts
|--| | | run-invitation-migration.ts
|--| | | run-organization-migration.ts
|--| | | run-project-migration.ts
|--| | | run-relationships-migration.ts
|--| | | run-subtask-migration.ts
|--| | | run-task-migration.ts
|--| | | run-user-migration.ts
|--| | | schema.ts
|--| | | seed.ts
|--| | utils.ts
|--| | validation
|--| | | api-validation.ts
|--| middleware.ts                  # Re-enabled middleware for auth protection
|--| scripts
|--| | clear-db.ts
|--| | seed.ts
|--| types
|--| | comment.ts
|--| | index.ts
|--| | organization.ts
|--| | project.ts
|--| | subtask.ts
|--| | task-details.ts
|--| | task.ts
|--| | tasks.ts
|--| | user.ts
|--tailwind.config-orig.ts
|--tailwind.config.ts
|--tasks
|--| prd-kuanalu.md
|--| tasks-prd-kuanalu.md
|--| tasks-structure-refactor.md
|--tsconfig.json
|--tsconfig.tsbuildinfo