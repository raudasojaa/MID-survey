import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SURVEYS_KEY = 'mid-surveys-v3';

// GET all surveys
export async function GET() {
  try {
    const surveys = await kv.get(SURVEYS_KEY) || [];
    return NextResponse.json(surveys);
  } catch (error) {
    console.error('Error fetching surveys:', error);
    return NextResponse.json({ error: 'Failed to fetch surveys' }, { status: 500 });
  }
}

// POST create/update survey
export async function POST(request) {
  try {
    console.log('POST /api/surveys - Starting');

    // Check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      console.error('KV_REST_API_URL is not set');
      return NextResponse.json({ error: 'KV database not configured. Please connect Vercel KV in project settings.' }, { status: 500 });
    }

    const survey = await request.json();
    console.log('Survey data received:', { id: survey.id, title: survey.title });

    // Get existing surveys
    console.log('Fetching existing surveys from KV...');
    const surveys = await kv.get(SURVEYS_KEY) || [];
    console.log('Existing surveys count:', surveys.length);

    // Find if survey exists
    const existingIndex = surveys.findIndex(s => s.id === survey.id);

    if (existingIndex >= 0) {
      // Update existing survey
      surveys[existingIndex] = survey;
      console.log('Updating existing survey at index:', existingIndex);
    } else {
      // Add new survey
      surveys.push(survey);
      console.log('Adding new survey');
    }

    // Save back to KV
    console.log('Saving to KV...');
    await kv.set(SURVEYS_KEY, surveys);
    console.log('Successfully saved to KV');

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error saving survey:', error);
    console.error('Error stack:', error.stack);
    console.error('Error message:', error.message);
    return NextResponse.json({
      error: 'Failed to save survey',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE survey
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 });
    }

    // Get existing surveys
    const surveys = await kv.get(SURVEYS_KEY) || [];

    // Filter out the survey to delete
    const updatedSurveys = surveys.filter(s => s.id !== id);

    // Save back to KV
    await kv.set(SURVEYS_KEY, updatedSurveys);

    // Also delete associated responses
    await kv.del(`responses:${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting survey:', error);
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 });
  }
}
