import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

// GET responses for a survey
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const surveyId = searchParams.get('surveyId');

    if (!surveyId) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
    }

    const responses = await kv.get(`responses:${surveyId}`) || [];
    return NextResponse.json(responses);
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json({ error: 'Failed to fetch responses' }, { status: 500 });
  }
}

// POST save a response
export async function POST(request) {
  try {
    const { surveyId, response } = await request.json();

    if (!surveyId || !response) {
      return NextResponse.json({ error: 'Survey ID and response required' }, { status: 400 });
    }

    // Get existing responses
    const responses = await kv.get(`responses:${surveyId}`) || [];

    // Add new response
    responses.push(response);

    // Save back to KV
    await kv.set(`responses:${surveyId}`, responses);

    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error('Error saving response:', error);
    return NextResponse.json({ error: 'Failed to save response' }, { status: 500 });
  }
}
