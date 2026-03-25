'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found.');
      return;
    }

    const verifyEmail = async () => {
      try {
        await axios.post('/api/users/verify', { token });
        setStatus('success');
        setMessage('Your email has been successfully verified! You can now log in.');
      } catch (err: any) {
        console.error('Verification error:', err);
        setStatus('error');
        const errDetail = err.response?.data?.errors?.[0]?.message || err.response?.data?.error || err.message;
        setMessage(`Verification failed: ${errDetail}. The link may be expired or invalid.`);
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl p-10 border border-gray-100 dark:border-neutral-800">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#36D6BA] border-t-transparent rounded-full animate-spin mb-6"></div>
            <h1 className="text-2xl font-montserrat font-bold text-black dark:text-white mb-2">Verifying...</h1>
            <p className="text-gray-600 dark:text-gray-400 font-montserrat">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-[#36D6BA] bg-opacity-20 rounded-full flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#36D6BA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 className="text-2xl font-montserrat font-bold text-black dark:text-white mb-2">Success!</h1>
            <p className="text-gray-600 dark:text-gray-400 font-montserrat mb-8">{message}</p>
            <Link
              href="/login"
              className="w-full font-montserrat font-bold text-white h-12 rounded-lg flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: '#269984' }}
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 rounded-full flex items-center justify-center mb-6">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h1 className="text-2xl font-montserrat font-bold text-black dark:text-white mb-2">Verification Failed</h1>
            <p className="text-gray-600 dark:text-gray-400 font-montserrat mb-8">{message}</p>
            <Link
              href="/register"
              className="w-full font-montserrat font-bold text-white h-12 rounded-lg flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: '#ef4444' }}
            >
              Back to Register
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F0FBF9] dark:bg-[#0a0a0a] flex items-center justify-center font-montserrat">
      <Suspense fallback={<div>Loading...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
