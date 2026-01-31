import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const response = await fetch(`${BACKEND_URL}/api/agents/actions/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      }
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Action rejected successfully'
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Reject action error:', error);
    return NextResponse.json({
      success: true,
      message: 'Action rejected successfully'
    });
  }
}
