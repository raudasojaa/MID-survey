import { kv } from '@vercel/kv';
import { NextResponse } from 'next/server';

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
    const survey = await request.json();

    // Get existing surveys
    const surveys = await kv.get(SURVEYS_KEY) || [];

    // Find if survey exists
    const existingIndex = surveys.findIndex(s => s.id === survey.id);

    if (existingIndex >= 0) {
      // Update existing survey
      surveys[existingIndex] = survey;
    } else {
      // Add new survey
      surveys.push(survey);
    }

    // Save back to KV
    await kv.set(SURVEYS_KEY, surveys);

    return NextResponse.json(survey);
  } catch (error) {
    console.error('Error saving survey:', error);
    return NextResponse.json({ error: 'Failed to save survey' }, { status: 500 });
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
