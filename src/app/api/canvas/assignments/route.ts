import { NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { user_id, access_token } = await request.json();

    if (!user_id || !access_token) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const response = await fetch(`${serverConfig.services.canvas}/api/start-fetch-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, access_token }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to fetch Canvas assignments' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Canvas assignments error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 