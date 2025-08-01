import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { storeResumeData } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalText, fileName, jobDescription, tailoredText, extractedInfo } = body;

    // Get user from Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Verify the user token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Validate required fields
    if (!originalText || !fileName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Store resume in MongoDB
    const result = await storeResumeData(user.id, {
      originalText,
      fileName,
      jobDescription,
      tailoredText,
      processedDocument: extractedInfo
    });
    
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      resumeId: result.resumeId,
      message: result.message
    });

  } catch (error) {
    console.error('Error storing resume:', error);
    return NextResponse.json(
      { error: 'Failed to store resume', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
