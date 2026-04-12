'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { ROUTES, API_ROUTES } from '../../../../lib/constants';
import { toast } from 'sonner';
import { useLocale } from '../../../i18n/LocaleProvider';

function VerifyContent() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('verify.loading'));

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('verify.no_token'));
      return;
    }

    const verifyEmail = async () => {
      try {
        await axios.post(API_ROUTES.AUTH.VERIFY_ACCOUNT, { token });
        setStatus('success');
        setMessage(t('verify.success_msg'));
        toast.success(t('toasts.verify_success'), {
          description: t('toasts.verify_success_desc'),
        });
      } catch (err: unknown) {
        interface AxiosErrorResponse {
          message?: string;
          response?: {
            data?: {
              errors?: { message: string }[];
              error?: string;
            };
          };
        }
        const axiosErr = err as AxiosErrorResponse;
        console.error('Verification error:', axiosErr.message || axiosErr);
        setStatus('error');
        const errDetail =
          axiosErr.response?.data?.errors?.[0]?.message ||
          axiosErr.response?.data?.error ||
          axiosErr.message;
        setMessage(t('verify.error_msg', { error: errDetail || '' }));
        toast.error(t('toasts.verify_error'), {
          description: t('toasts.verify_error_desc'),
        });
      }
    };

    verifyEmail();
  }, [token, t]);

  return (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-xl p-10 border border-gray-100 dark:border-neutral-800">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-[#36D6BA] border-t-transparent rounded-full animate-spin mb-6"></div>
            <h1 className="text-2xl font-montserrat font-bold text-black dark:text-white mb-2">
              {t('verify.title_verifying')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-montserrat">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-[#36D6BA] bg-opacity-20 rounded-full flex items-center justify-center mb-6">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#36D6BA"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 className="text-2xl font-montserrat font-bold text-black dark:text-white mb-2">
              {t('verify.title_success')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-montserrat mb-8">{message}</p>
            <Link
              href={ROUTES.LOGIN}
              className="w-full font-montserrat font-bold text-white h-12 rounded-lg flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: '#269984' }}
            >
              {t('verify.login_btn')}
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900 dark:bg-opacity-20 rounded-full flex items-center justify-center mb-6">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h1 className="text-2xl font-montserrat font-bold text-black dark:text-white mb-2">
              {t('verify.title_failed')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 font-montserrat mb-8 whitespace-pre-wrap">
              {message}
            </p>
            <Link
              href={ROUTES.REGISTER}
              className="w-full font-montserrat font-bold text-white h-12 rounded-lg flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
              style={{ backgroundColor: '#ef4444' }}
            >
              {t('verify.register_btn')}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  const { t } = useLocale();
  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#F0FBF9] dark:bg-[#0a0a0a] flex items-center justify-center font-montserrat">
      <Suspense
        fallback={
          <div className="font-montserrat text-black dark:text-white">{t('verify.loading')}...</div>
        }
      >
        <VerifyContent />
      </Suspense>
    </div>
  );
}
