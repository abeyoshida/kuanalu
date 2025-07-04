import { NextRequest, NextResponse } from 'next/server';
import { processEmailQueue } from '@/lib/email/queue';

/**
 * API route handler for processing the email queue
 * This can be called by a cron job or serverless function
 * 
 * @param request The incoming request
 * @returns A JSON response with the number of emails processed
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key authorization
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.EMAIL_QUEUE_API_KEY;
    
    if (!apiKey || !authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get limit from query parameters
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;
    
    // Process the queue
    const processedCount = await processEmailQueue(limit);
    
    return NextResponse.json({ 
      success: true, 
      processedCount,
      message: `Processed ${processedCount} emails from the queue`
    });
  } catch (error) {
    console.error('Error processing email queue:', error);
    return NextResponse.json(
      { error: 'Failed to process email queue' },
      { status: 500 }
    );
  }
}

/**
 * API route handler for checking the status of the email queue
 * 
 * @param request The incoming request
 * @returns A JSON response with the status of the email queue
 */
export async function GET(request: NextRequest) {
  try {
    // Check for API key authorization
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.EMAIL_QUEUE_API_KEY;
    
    if (!apiKey || !authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // For now, just return a simple status
    return NextResponse.json({ 
      status: 'healthy',
      message: 'Email queue is operational'
    });
  } catch (error) {
    console.error('Error checking email queue status:', error);
    return NextResponse.json(
      { error: 'Failed to check email queue status' },
      { status: 500 }
    );
  }
} 