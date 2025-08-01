'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, User, LogOut } from 'lucide-react';
import Link from 'next/link';

interface UserType {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

interface StoredResume {
  id: string;
  fileName: string;
  createdAt: Date;
  jobDescription?: string;
  hasOptimizedVersion: boolean;
}

export default function Dashboard() {
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
        // Fetch user's resumes
        await fetchResumes();
      }
    };

    getUser();
  }, [supabase.auth, router, fetchResumes]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
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
            <h1 className="text-2xl font-bold text-emerald-400">Resume Tailor</h1>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-emerald-300">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-emerald-400 mb-4">
            Welcome to Your Resume Dashboard
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Upload your resume, tailor it to specific job descriptions, and create ATS-friendly versions
            that help you land your dream job.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Create Resume */}
          <Card className="bg-gray-900 border-emerald-800 hover:border-emerald-600 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-900 rounded-lg">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-emerald-400">Create Resume</CardTitle>
                  <CardDescription className="text-gray-400">
                    Create a new ATS-friendly resume with AI
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/create">
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Create New Resume
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* My Resumes */}
          <Card className="bg-gray-900 border-emerald-800 hover:border-emerald-600 transition-colors">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-900 rounded-lg">
                  <FileText className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <CardTitle className="text-emerald-400">My Resumes</CardTitle>
                  <CardDescription className="text-gray-400">
                    View and manage all your resume versions
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white">
                View All Resumes
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-gray-900 border-emerald-800 hover:border-emerald-600 transition-colors">
            <CardHeader>
              <CardTitle className="text-emerald-400">Quick Actions</CardTitle>
              <CardDescription className="text-gray-400">
                Common tasks and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/settings">
                <Button variant="outline" size="sm" className="w-full border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white">
                  Account Settings
                </Button>
              </Link>
              <Link href="/history">
                <Button variant="outline" size="sm" className="w-full border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white">
                  Download History
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="mt-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-emerald-400">Your Resumes</h3>
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
          <Card className="bg-gray-900 border-emerald-800">
            <CardContent className="p-6">
              {loadingResumes ? (
                <div className="text-center text-gray-400 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600 animate-pulse" />
                  <p>Loading your resumes...</p>
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center text-gray-400 py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p>No resumes created yet. Create your first resume to get started!</p>
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
                      className="flex items-center justify-between p-4 bg-gray-800 rounded-lg border border-emerald-800/30 hover:border-emerald-600/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-emerald-900 rounded">
                          <FileText className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-emerald-300">{resume.fileName}</h4>
                          <p className="text-sm text-gray-400">
                            Created: {new Date(resume.createdAt).toLocaleDateString()}
                          </p>
                          {resume.jobDescription && (
                            <p className="text-xs text-gray-500 mt-1">
                              Tailored for specific job
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {resume.hasOptimizedVersion && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-emerald-900 text-emerald-300">
                            AI Optimized
                          </span>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white"
                        >
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
