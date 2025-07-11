import { NextRequest, NextResponse } from 'next/server';

// Redirect to database-analytics endpoint for backward compatibility
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Redirect to the database-analytics endpoint
    const baseUrl = request.url.replace('/api/admin/analytics', '/api/admin/database-analytics');
    const redirectUrl = queryString ? `${baseUrl}?${queryString}` : baseUrl;
    
    console.log('🔄 Redirecting analytics request to database-analytics');
    
    // Fetch from the database-analytics endpoint
    const response = await fetch(redirectUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Database analytics request failed: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('❌ Analytics redirect error:', error);
    return NextResponse.json({
      error: 'Failed to fetch analytics data',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
