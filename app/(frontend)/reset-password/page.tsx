'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ROUTES, API_ROUTES } from '../../../lib/constants';
import { toast } from 'sonner';
import { useLocale } from '../../i18n/LocaleProvider';

function ResetPasswordForm() {
  const { t } = useLocale();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setError(t('login.errors.reset_token_invalid'));
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error(t('toasts.password_min'));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('register.errors.password_mismatch'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(API_ROUTES.AUTH.RESET_PASSWORD, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        toast.error(data.error);
        return;
      }

      setIsSubmitted(true);
      toast.success(data.title, { description: data.message });
    } catch {
      setError(t('toasts.unexpected_error_desc'));
      toast.error(t('toasts.unexpected_error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token && !isSubmitted) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">
          {t('login.errors.reset_token_invalid')}
        </h1>
        <Link href={ROUTES.LOGIN} className="text-[#269984] hover:underline">
          {t('login.forgot_password_back_to_login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[500px]">
      {!isSubmitted ? (
        <>
          <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-black dark:text-white mb-3">
            {t('login.reset_password_title')}
          </h1>
          <p className="font-montserrat text-base sm:text-lg mb-8 text-[#666] dark:text-gray-400">
            {t('login.reset_password_subtitle')}
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg mb-6 font-montserrat text-sm text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm sm:text-base">
                {t('login.reset_password_new_password_label')}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full font-montserrat h-12 sm:h-14 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 sm:px-5 text-base outline-none focus:border-[#36D6BA] transition-colors"
                placeholder={t('login.password_placeholder')}
              />
            </div>

            <div className="mb-8">
              <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm sm:text-base">
                {t('login.reset_password_confirm_password_label')}
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full font-montserrat h-12 sm:h-14 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 sm:px-5 text-base outline-none focus:border-[#36D6BA] transition-colors"
                placeholder={t('login.password_placeholder')}
              />
            </div>

            <button
              className="w-full font-montserrat font-bold text-white h-12 sm:h-14 rounded-lg text-lg sm:text-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              style={{ backgroundColor: '#269984', border: 'none' }}
              disabled={isLoading}
            >
              {isLoading
                ? t('login.reset_password_submit_btn') + '...'
                : t('login.reset_password_submit_btn')}
            </button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#F0FBF9] dark:bg-[#112220] rounded-full mb-6">
            <svg
              className="w-10 h-10 text-[#269984]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="font-montserrat font-bold text-3xl sm:text-4xl text-black dark:text-white mb-3">
            {t('login.reset_password_success_title')}
          </h1>
          <p className="font-montserrat text-base sm:text-lg mb-8 text-[#666] dark:text-gray-400">
            {t('login.reset_password_success_desc')}
          </p>
          <Link
            href={ROUTES.LOGIN}
            className="inline-block font-montserrat font-bold text-white bg-[#269984] px-8 py-3 rounded-lg hover:opacity-90 transition-all"
          >
            {t('login.login_btn')}
          </Link>
        </div>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useLocale();
  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-[calc(100vh-85px)]">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-85px)]">
        {/* Left Side: Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden lg:w-[40%] xl:w-[45%] bg-[#F0FBF9] dark:bg-[#112220]">
          <div className="w-3/4 max-w-[500px]">
            <Image
              src="/assets/Login_girl_phone_illu.svg"
              alt="Reset password illustration"
              width={420}
              height={420}
              className="opacity-90 lg:opacity-100 translate-x-[22px]"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          <div
            className="absolute rounded-full"
            style={{
              left: '8%',
              top: '12%',
              width: '120px',
              height: '120px',
              backgroundColor: '#36D6BA',
              opacity: 0.15,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              right: '5%',
              bottom: '10%',
              width: '180px',
              height: '180px',
              backgroundColor: '#269984',
              opacity: 0.1,
            }}
          />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">
          <Suspense
            fallback={<div className="font-montserrat text-[#666]">{t('verify.loading')}</div>}
          >
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
