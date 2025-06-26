# Test Scripts

This directory contains test scripts for verifying the application's functionality after refactoring the route structure.

## Available Tests

### Authentication Routes Test

`test-auth-routes.ts` - Tests that authentication and route protection work correctly:
- Verifies unauthenticated users are redirected to login
- Verifies authenticated users can access protected routes
- Checks that redirects use the correct URL structure

To run:
```bash
npx tsx src/scripts/test-auth-routes.ts
```

### Layout Nesting Test

`test-layout-nesting.ts` - Tests that layouts are applied correctly:
- Verifies the layout hierarchy for each route
- Checks that layouts are not duplicated
- Verifies page titles are set correctly

To run:
```bash
npx tsx src/scripts/test-layout-nesting.ts
```

### Responsive Behavior Test

`test-responsive-behavior.ts` - Tests that components behave correctly at different screen sizes:
- Verifies sidebar behavior (visible/hidden)
- Checks header positioning and behavior
- Tests content area layout at different screen sizes

To run:
```bash
npx tsx src/scripts/test-responsive-behavior.ts
```

## Manual Testing Checklist

In addition to the automated tests, the following should be manually verified:

1. **Authentication**
   - [ ] Login works correctly
   - [ ] Registration works correctly
   - [ ] Logout works correctly
   - [ ] Protected routes redirect to login when not authenticated

2. **Navigation**
   - [ ] Sidebar links work correctly
   - [ ] Breadcrumbs (if any) show the correct path
   - [ ] Back buttons navigate to the correct page

3. **Layouts**
   - [ ] No duplicate headers or navigation elements
   - [ ] Page content is correctly positioned
   - [ ] Titles are displayed correctly

4. **Responsive Design**
   - [ ] Sidebar collapses on mobile
   - [ ] Menu button shows/hides sidebar
   - [ ] Content is readable on all screen sizes 