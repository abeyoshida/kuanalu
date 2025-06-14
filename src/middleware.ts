import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get authentication status from cookie
  const isAuthenticated = request.cookies.has("next-auth.session-token") || 
                         request.cookies.has("__Secure-next-auth.session-token");

  // Define protected routes
  const isProtectedRoute = 
    pathname.startsWith("/dashboard") || 
    pathname.startsWith("/projects") || 
    pathname.startsWith("/task");

  // Define auth routes
  const isAuthRoute = 
    pathname.startsWith("/auth/login") || 
    pathname.startsWith("/auth/register");

  // Redirect logged in users away from auth pages
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Allow access to protected routes for authenticated users
  if (isProtectedRoute && !isAuthenticated) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/auth/login?callbackUrl=${callbackUrl}`, request.url));
  }

  return NextResponse.next();
}

// Ensure middleware runs on specific paths
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/task/:path*",
    "/auth/:path*",
  ],
}; 