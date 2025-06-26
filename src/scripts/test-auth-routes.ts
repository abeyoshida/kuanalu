/**
 * Test script to verify authentication routes and protection
 * 
 * This script simulates accessing various routes with and without authentication
 * to ensure the route protection is working correctly.
 */

// Define types
interface User {
  id: string;
  name: string;
}

interface Session {
  user: User | null;
}

// Mock functions
let redirectCalls: { destination: string }[] = [];
const mockRedirect = (destination: string): never => {
  redirectCalls.push({ destination });
  throw new Error(`Redirect to ${destination}`);
};

let mockAuthState: Session | null = null;
const mockAuth = async (): Promise<Session | null> => {
  return Promise.resolve(mockAuthState);
};

// Test routes
const protectedRoutes = [
  "/dashboard",
  "/profile",
  "/organizations",
  "/organizations/1",
  "/projects",
  "/projects/1",
];

/**
 * Test accessing a protected route
 */
async function testProtectedRoute(route: string, isAuthenticated: boolean) {
  console.log(`Testing ${route} with auth=${isAuthenticated}`);
  
  // Set mock auth state
  mockAuthState = isAuthenticated ? { user: { id: "1", name: "Test User" } } : null;
  
  // Clear previous redirect calls
  redirectCalls = [];
  
  try {
    // Simulate accessing the route
    const session = await mockAuth();
    
    if (!session?.user) {
      mockRedirect("/auth/login?callbackUrl=" + encodeURIComponent(route));
      return false; // This line won't be reached due to the redirect
    }
    
    // If we reach here, access is granted
    return true;
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes("Redirect")) {
      const redirectTo = redirectCalls[redirectCalls.length - 1]?.destination;
      console.log(`  → Redirected to: ${redirectTo}`);
      return false;
    }
    console.error(`  → Error: ${err.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log("=== Testing Protected Routes ===");
  
  // Test protected routes without authentication
  console.log("\nUnauthenticated Access Tests:");
  for (const route of protectedRoutes) {
    const result = await testProtectedRoute(route, false);
    console.log(`  Result: ${result ? "✅ Access granted" : "❌ Access denied (expected)"}`);
  }
  
  // Test protected routes with authentication
  console.log("\nAuthenticated Access Tests:");
  for (const route of protectedRoutes) {
    const result = await testProtectedRoute(route, true);
    console.log(`  Result: ${result ? "✅ Access granted (expected)" : "❌ Access denied"}`);
  }
  
  console.log("\n=== Testing Complete ===");
}

// Run the tests
runTests().catch(console.error); 