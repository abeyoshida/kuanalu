import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";

export async function GET() {
  const session = await auth();
  
  return NextResponse.json({
    authenticated: !!session?.user,
    user: session?.user || null,
    timestamp: new Date().toISOString()
  });
} 