import { NextResponse } from 'next/server';
import { serverConfig } from '@/lib/config';

export async function POST(request: Request) {
  try {
    const { user_id, access_token } = await request.json();

    if (!user_id || !access_token) {
      console.error('Missing required fields:', { user_id: !!user_id, access_token: !!access_token });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Attempting to start email polling with:', { 
      url: `${serverConfig.services.email}/api/start-email-polling`,
      user_id: user_id 
    });

    const response = await fetch(`${serverConfig.services.email}/api/start-email-polling`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ user_id, access_token }),
    });

    const data = await response.json();
    console.log('Email service response:', { status: response.status, data });

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to start email polling', details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({ status: 'success', data });
  } catch (error) {
    console.error('Email polling error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 