'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user) {
        setMessage('Account created successfully! Signing you in...');
        
        // Small delay for UX
        setTimeout(async () => {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (!signInError) {
            router.push('/dashboard');
          } else {
            setError('Failed to sign in automatically');
          }
        }, 1000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-900 border-emerald-800">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center text-emerald-400">
            Create Account
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            Join Resume Tailor to create perfect resumes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-gray-800 border-emerald-700 text-white placeholder-gray-500 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-gray-800 border-emerald-700 text-white placeholder-gray-500 focus:border-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-emerald-300">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-gray-800 border-emerald-700 text-white placeholder-gray-500 focus:border-emerald-500"
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">
                {error}
              </div>
            )}
            {message && (
              <div className="text-emerald-400 text-sm text-center bg-emerald-900/20 p-2 rounded">
                {message}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-gray-400 mt-4">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-emerald-400 hover:text-emerald-300 underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
