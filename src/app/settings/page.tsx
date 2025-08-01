'use client';

import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

interface UserType {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}

export default function AccountSettings() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
      
      if (!user) {
        router.push('/auth/login');
      } else {
        setEmail(user.email || '');
        setName(user.user_metadata?.name || '');
      }
    };

    getUser();
  }, [supabase.auth, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) {
        setError(error.message);
      } else {
        setMessage('Profile updated successfully!');
      }
    } catch {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="border-emerald-700 text-emerald-300 hover:bg-emerald-800 hover:text-white">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-emerald-400">Account Settings</h1>
            </div>
            <div className="flex items-center space-x-2 text-emerald-300">
              <User className="w-4 h-4" />
              <span className="text-sm">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="bg-gray-900 border-emerald-800">
          <CardHeader>
            <CardTitle className="text-emerald-400">Profile Information</CardTitle>
            <CardDescription className="text-gray-400">
              Update your account information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-emerald-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-gray-800 border-emerald-700 text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name" className="text-emerald-300">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-gray-800 border-emerald-700 text-white placeholder-gray-500 focus:border-emerald-500"
                />
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded">
                  {error}
                </div>
              )}

              {message && (
                <div className="text-emerald-400 text-sm bg-emerald-900/20 p-3 rounded">
                  {message}
                </div>
              )}

              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-emerald-800">
              <h3 className="text-lg font-medium text-emerald-400 mb-4">Account Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={handleSignOut}
                  variant="outline"
                  className="w-full border-red-600 text-red-400 hover:bg-red-700 hover:text-white"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
