'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Download, ArrowLeft, Calendar } from 'lucide-react';
import Link from 'next/link';

interface UserType {
  id: string;
  email?: string;
}

interface StoredResume {
  id: string;
  fileName: string;
  createdAt: Date;
  jobDescription?: string;
  hasOptimizedVersion: boolean;
}

export default function DownloadHistory() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<StoredResume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchResumes = useCallback(async () => {
    setLoadingResumes(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.log('No session found');
        return;
      }

      const response = await fetch('/api/resumes', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setResumes(result.resumes || []);
      } else {
        console.error('Failed to fetch resumes:', result.error);
      }
    } catch (error) {
      console.error('Error fetching resumes:', error);
    } finally {
      setLoadingResumes(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (!user) {
        router.push('/auth/login');
      } else {
        await fetchResumes();
      }
    };

    getUser();
  }, [supabase.auth, router, fetchResumes]);

  const handleDownload = async (resumeId: string, fileName: string) => {
    try {
      // This is a placeholder - you can implement actual download logic
      console.log('Downloading resume:', resumeId, fileName);
      alert(`Download functionality for "${fileName}" will be implemented here`);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-emerald-400">Download History</h1>
            </div>
            <Button 
              onClick={fetchResumes}
              variant="outline" 
              size="sm"
              disabled={loadingResumes}
              className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
            >
              {loadingResumes ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-gray-900 border-emerald-800">
          <CardHeader>
            <CardTitle className="text-emerald-400">Your Resume History</CardTitle>
            <CardDescription className="text-gray-400">
              View and download all your created resumes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingResumes ? (
              <div className="text-center text-gray-400 py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600 animate-pulse" />
                <p>Loading your resumes...</p>
              </div>
            ) : resumes.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p>No resumes found. Create your first resume to see it here!</p>
                <Link href="/create" className="mt-4 inline-block">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Create Resume
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {resumes.map((resume) => (
                  <div 
                    key={resume.id} 
                    className="flex items-center justify-between p-6 bg-gray-800 rounded-lg border border-emerald-800/30 hover:border-emerald-600/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-emerald-900 rounded-lg">
                        <FileText className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-emerald-300">{resume.fileName}</h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center text-sm text-gray-400">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(resume.createdAt).toLocaleDateString()}
                          </div>
                          {resume.hasOptimizedVersion && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-900 text-emerald-300">
                              AI Optimized
                            </span>
                          )}
                          {resume.jobDescription && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-900 text-blue-300">
                              Job Tailored
                            </span>
                          )}
                        </div>
                        {resume.jobDescription && (
                          <p className="text-xs text-gray-500 mt-2 max-w-md truncate">
                            Tailored for: {resume.jobDescription}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        onClick={() => handleDownload(resume.id, resume.fileName)}
                        variant="outline" 
                        size="sm"
                        className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
