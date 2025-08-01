'use client';

import Link from 'next/link';
import { FileX, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md mx-auto text-center px-4">
        <div className="mb-8">
          <FileX className="w-24 h-24 text-emerald-400 mx-auto mb-4" />
        </div>
        
        <h1 className="text-4xl font-bold text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-emerald-400 mb-4">Page Not Found</h2>
        <p className="text-gray-400 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors w-full justify-center"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
          
          <button
            onClick={handleGoBack}
            className="inline-flex items-center px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium rounded-lg transition-colors w-full justify-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
