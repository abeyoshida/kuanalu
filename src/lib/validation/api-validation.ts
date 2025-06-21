import { NextRequest, NextResponse } from "next/server";
import { ZodSchema } from "zod";
import { Session } from "next-auth";

/**
 * Validates that a user is authenticated
 */
export function validateAuthentication(session: Session | null): NextResponse | null {
  if (!session?.user) {
    return NextResponse.json(
      { error: "Unauthorized. You must be logged in to access this resource." },
      { status: 401 }
    );
  }
  return null;
}

/**
 * Validates that a string parameter can be parsed to a number
 */
export function validateNumericParam(param: string, paramName: string): NextResponse | number {
  const numericValue = parseInt(param);
  if (isNaN(numericValue)) {
    return NextResponse.json(
      { error: `Invalid ${paramName}. Must be a valid number.` },
      { status: 400 }
    );
  }
  return numericValue;
}

/**
 * Validates request body against a Zod schema
 */
export async function validateRequestBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json();
    const result = schema.safeParse(body);
    
    if (!result.success) {
      return {
        error: NextResponse.json(
          { 
            error: "Invalid input data",
            details: result.error.format()
          },
          { status: 400 }
        )
      };
    }
    
    return { data: result.data };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      )
    };
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { data: T } | { error: NextResponse } {
  try {
    const url = new URL(request.url);
    const queryParams: Record<string, string> = {};
    
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    const result = schema.safeParse(queryParams);
    
    if (!result.success) {
      return {
        error: NextResponse.json(
          { 
            error: "Invalid query parameters",
            details: result.error.format()
          },
          { status: 400 }
        )
      };
    }
    
    return { data: result.data };
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return {
      error: NextResponse.json(
        { error: "Error processing query parameters" },
        { status: 400 }
      )
    };
  }
}

/**
 * Handles common API errors and returns appropriate responses
 */
export function handleApiError(error: unknown, resourceName: string): NextResponse {
  console.error(`Error processing ${resourceName} request:`, error);
  
  if (error instanceof Error) {
    // Authentication errors
    if (error.message.includes("must be logged in") || error.message.includes("Unauthorized")) {
      return NextResponse.json(
        { error: `You must be logged in to access this ${resourceName}` },
        { status: 401 }
      );
    }
    
    // Permission errors
    if (error.message.includes("don't have permission") || error.message.includes("permission denied")) {
      return NextResponse.json(
        { error: `You don't have permission to access this ${resourceName}` },
        { status: 403 }
      );
    }
    
    // Not found errors
    if (error.message.includes("not found")) {
      return NextResponse.json(
        { error: `${resourceName} not found` },
        { status: 404 }
      );
    }
  }
  
  // Generic server error
  return NextResponse.json(
    { error: `Failed to process ${resourceName} request` },
    { status: 500 }
  );
}

/**
 * Validates pagination parameters
 */
export function validatePagination(
  request: NextRequest
): { page: number; limit: number } | { error: NextResponse } {
  const url = new URL(request.url);
  const pageParam = url.searchParams.get("page") || "1";
  const limitParam = url.searchParams.get("limit") || "10";
  
  const page = parseInt(pageParam);
  const limit = parseInt(limitParam);
  
  if (isNaN(page) || page < 1) {
    return {
      error: NextResponse.json(
        { error: "Invalid page parameter. Must be a positive integer." },
        { status: 400 }
      )
    };
  }
  
  if (isNaN(limit) || limit < 1 || limit > 100) {
    return {
      error: NextResponse.json(
        { error: "Invalid limit parameter. Must be between 1 and 100." },
        { status: 400 }
      )
    };
  }
  
  return { page, limit };
}

/**
 * Validates sorting parameters
 */
export function validateSorting<T extends string>(
  request: NextRequest,
  allowedFields: T[]
): { field: T; direction: 'asc' | 'desc' } | { error: NextResponse } {
  const url = new URL(request.url);
  const sortField = url.searchParams.get("sortBy") as T || allowedFields[0];
  const sortDir = url.searchParams.get("sortDir") || "desc";
  
  if (!allowedFields.includes(sortField)) {
    return {
      error: NextResponse.json(
        { 
          error: "Invalid sort field",
          allowedFields
        },
        { status: 400 }
      )
    };
  }
  
  if (sortDir !== "asc" && sortDir !== "desc") {
    return {
      error: NextResponse.json(
        { error: "Sort direction must be 'asc' or 'desc'" },
        { status: 400 }
      )
    };
  }
  
  return { field: sortField, direction: sortDir as 'asc' | 'desc' };
} 