'use client';

// This file provides safe client-side imports for database-related functionality
// It doesn't directly import the database but uses server actions

// Re-export types that might be needed on the client side
export type { Role } from '@/lib/auth/permissions-data';

// This file is intentionally minimal and should only contain
// client-safe exports and type definitions 