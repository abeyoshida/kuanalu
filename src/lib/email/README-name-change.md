# FlowBoardAI Name Change

This document outlines the changes made for Task 10.2 to update the application name from "FlowBoard" to "FlowBoardAI".

## Changes Made

1. **UI Components**
   - Updated all instances of "FlowBoard" to "FlowBoardAI" in the dashboard, sidebar, and landing page
   - Changed the application title in the header and metadata
   - Updated the footer copyright text

2. **Email Templates**
   - Changed the email sender name from "Kuanalu" to "FlowBoardAI"
   - Updated the email template headers and footers
   - Updated test email scripts to use the new name

3. **Documentation**
   - Updated all documentation files to reference "FlowBoardAI" instead of "FlowBoard" or "Kuanalu"
   - Updated permission system documentation
   - Updated API documentation

4. **Page Metadata**
   - Updated all page titles to use "FlowBoardAI" instead of "FlowBoard" or "Kuanalu"
   - Updated metadata descriptions

5. **Package Configuration**
   - Updated the package name in package.json from "flowboard" to "flowboardai"

## Files Updated

- UI Components:
  - src/components/layout/sidebar.tsx
  - src/components/dashboard/dashboard-content.tsx
  - src/app/page.tsx
  - src/app/layout.tsx

- Email Templates:
  - src/components/email/base-layout.tsx
  - src/lib/email/client.ts
  - src/lib/email/queue.ts
  - src/lib/actions/email-actions.ts

- Documentation:
  - docs/permission-system.md
  - docs/api-permission-checks.md
  - documentation/drizzle-usage.md

- Page Metadata:
  - Multiple files in src/app/ directory
  - src/app/(auth)/layout.tsx
  - src/app/auth/layout.tsx

- Configuration:
  - package.json

## Note

The name change has been completed in the UI and email templates. The database schema and existing data remain unchanged as they don't directly reference the application name. 