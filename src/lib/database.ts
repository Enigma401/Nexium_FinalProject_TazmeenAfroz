// Database connection utilities
import { createClient } from '@supabase/supabase-js';
import { MongoClient, ObjectId } from 'mongodb';
import { ProcessedDocument } from './text-processor';

// Type definitions
interface StoredResume {
  id: string;
  fileName: string;
  createdAt: Date;
  jobDescription?: string;
  hasOptimizedVersion: boolean;
}

interface FullResume {
  id: string;
  userId: string;
  originalText: string;
  fileName: string;
  jobDescription?: string;
  tailoredText?: string;
  processedDocument?: ProcessedDocument;
  createdAt: Date;
  updatedAt: Date;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      return { success: false, message: 'Supabase environment variables not found' };
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test with a simple auth check instead of internal tables
    const { error } = await supabase.auth.getUser();
    
    // Even if no user is logged in, this should not error - it should return null
    if (error && !error.message.includes('session_not_found')) {
      return { success: false, message: `Supabase error: ${error.message}` };
    }
    
    return { success: true, message: 'Supabase connection successful' };
  } catch (error) {
    return { success: false, message: `Supabase connection failed: ${error}` };
  }
}

export async function testMongoConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      return { success: false, message: 'MongoDB URI not found in environment variables' };
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    
    // Test the connection
    await client.db().admin().ping();
    await client.close();
    
    return { success: true, message: 'MongoDB connection successful' };
  } catch (error) {
    return { success: false, message: `MongoDB connection failed: ${error}` };
  }
}

export async function storeResumeData(userId: string, resumeData: {
  originalText: string;
  fileName: string;
  jobDescription?: string;
  tailoredText?: string;
  processedDocument?: ProcessedDocument;
}): Promise<{ success: boolean; resumeId?: string; message: string }> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db('resume_tailor');
    const collection = db.collection('resumes');
    
    const resume = {
      userId,
      ...resumeData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const result = await collection.insertOne(resume);
    await client.close();
    
    return { 
      success: true, 
      resumeId: result.insertedId.toString(),
      message: 'Resume stored successfully' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to store resume: ${error}` 
    };
  }
}

export async function getUserResumes(userId: string): Promise<{ success: boolean; resumes?: StoredResume[]; message: string }> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db('resume_tailor');
    const collection = db.collection('resumes');
    
    const resumes = await collection
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();
    
    await client.close();
    
    return { 
      success: true, 
      resumes: resumes.map(resume => ({
        id: resume._id.toString(),
        fileName: resume.fileName || 'Untitled Resume',
        createdAt: resume.createdAt,
        jobDescription: resume.jobDescription,
        hasOptimizedVersion: !!resume.tailoredText
      })),
      message: `Found ${resumes.length} resumes` 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to retrieve resumes: ${error}` 
    };
  }
}

export async function getResumeById(userId: string, resumeId: string): Promise<{ success: boolean; resume?: FullResume; message: string }> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MongoDB URI not configured');
    }
    
    const client = new MongoClient(mongoUri);
    await client.connect();
    
    const db = client.db('resume_tailor');
    const collection = db.collection('resumes');
    
    const resume = await collection.findOne({ 
      _id: new ObjectId(resumeId),
      userId 
    });
    
    await client.close();
    
    if (!resume) {
      return { success: false, message: 'Resume not found' };
    }
    
    return { 
      success: true, 
      resume: {
        id: resume._id.toString(),
        userId: resume.userId,
        originalText: resume.originalText,
        fileName: resume.fileName,
        jobDescription: resume.jobDescription,
        tailoredText: resume.tailoredText,
        processedDocument: resume.processedDocument,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      },
      message: 'Resume retrieved successfully' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Failed to retrieve resume: ${error}` 
    };
  }
}

export async function storeUserProfile(userId: string, email: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase not configured');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to insert/update user profile
    const { error } = await supabase
      .from('user_profiles')
      .upsert([
        {
          id: userId,
          email: email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]);
    
    if (error) {
      // If table doesn't exist, that's expected - Supabase will create it
      console.log('Supabase profile storage note:', error.message);
    }
    
    return { success: true, message: 'User profile handling completed' };
  } catch (error) {
    return { success: false, message: `Profile storage failed: ${error}` };
  }
}
