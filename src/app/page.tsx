'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Sparkles, FileText, Zap, Shield, Rocket, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface UserType {
  id: string;
  email?: string;
}

export default function LandingPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, [supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Sparkles className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading...</span>
        </div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard
  if (user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-emerald-400 mb-4">
            <Sparkles className="w-8 h-8" />
            <span className="text-2xl font-bold">Welcome back!</span>
          </div>
          <p className="text-gray-400 mb-6">Redirecting you to your dashboard...</p>
          <Link href="/dashboard">
            <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 text-lg">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="bg-gray-900 border-b border-emerald-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-900 flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-emerald-400">Resume Tailor</h1>
                <p className="text-xs text-gray-400">AI-Powered Resume Builder</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/login">
                <Button variant="outline" className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white px-6 py-2">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-gray-900/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 bg-emerald-900/30 px-4 py-2 rounded-full border border-emerald-800 mb-8">
              <Star className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-300 text-sm font-medium">AI-Powered Resume Tailoring</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              Create{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-emerald-300 bg-clip-text text-transparent">
                Perfect Resumes
              </span>
              <br />
              That Get You Hired
            </h1>
            
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Transform your resume with AI. Enter your current resume text, add any job description, 
              and get a professionally optimized, ATS-friendly resume with LaTeX formatting.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signup">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-emerald-600/25 transition-all duration-200">
                  Start Building Free
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button size="lg" variant="outline" className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white px-8 py-4 text-lg font-semibold rounded-lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-emerald-400 mb-4">
              Why Choose Resume Tailor?
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Leverage cutting-edge AI to create resumes that stand out and get results
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-900 border-emerald-800 hover:border-emerald-600 transition-colors group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-900 rounded-lg group-hover:bg-emerald-800 transition-colors">
                    <Zap className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-emerald-400">AI-Powered Analysis</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Our advanced AI analyzes job descriptions and optimizes your resume content 
                  to match exactly what employers are looking for.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-emerald-800 hover:border-emerald-600 transition-colors group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-900 rounded-lg group-hover:bg-emerald-800 transition-colors">
                    <Shield className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-emerald-400">ATS Optimized</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Every resume is optimized for Applicant Tracking Systems (ATS) to ensure 
                  your application gets past automated screening.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-emerald-800 hover:border-emerald-600 transition-colors group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-emerald-900 rounded-lg group-hover:bg-emerald-800 transition-colors">
                    <Rocket className="w-6 h-6 text-emerald-400" />
                  </div>
                  <CardTitle className="text-emerald-400">Instant Results</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">
                  Get your perfectly tailored resume in seconds, not hours. 
                  Multiple AI models ensure the highest quality output.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-emerald-900/30 to-gray-900/30 rounded-2xl border border-emerald-800 p-12">
            <FileText className="w-16 h-16 text-emerald-400 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Land Your Dream Job?
            </h2>
            <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
              Join thousands of job seekers who have successfully landed interviews 
              with AI-tailored resumes. Start building yours today!
            </p>
            <Link href="/auth/signup">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-4 text-lg font-semibold rounded-lg shadow-lg hover:shadow-emerald-600/25 transition-all duration-200">
                Create My Resume Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-emerald-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="h-8 w-8 rounded-lg bg-emerald-900 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-lg font-bold text-emerald-400">Resume Tailor</span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Resume Tailor. Crafted with AI for your success.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
