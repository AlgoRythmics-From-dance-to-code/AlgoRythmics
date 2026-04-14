'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { toast } from 'sonner';
import { useLocale } from '../../i18n/LocaleProvider';
import LoadingOverlay from '../../components/LoadingOverlay';

/**
 * Helper to clear all authentication related cookies manually
 */
const clearAuthCookies = () => {
  if (typeof document === 'undefined') return;
  const cookies = document.cookie.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
    if (name.includes('auth') || name.includes('token') || name.includes('session')) {
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax;`;
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict;`;
    }
  }
};

export default function RegisterPage() {
  const { t } = useLocale();

  useState(() => {
    // Proactively clear stale state when arrival at register page
    clearAuthCookies();
  });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!firstName.trim()) newErrors.firstName = t('register.errors.first_name_required');
    if (!lastName.trim()) newErrors.lastName = t('register.errors.last_name_required');
    if (!email.trim()) newErrors.email = t('register.errors.email_required');
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t('register.errors.email_invalid');

    if (!password) newErrors.password = t('register.errors.password_required');
    else if (password.length < 6) newErrors.password = t('register.errors.password_min');

    if (password && confirmPassword && password !== confirmPassword)
      newErrors.confirmPassword = t('register.errors.password_mismatch');

    if (!acceptTerms) newErrors.terms = t('register.errors.terms_required');

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await axios.post('/api/auth/register', { email, password, firstName, lastName });
      setIsSuccess(true);
      toast.success(t('toasts.register_success'), {
        description: t('toasts.register_success_desc'),
      });
    } catch (error: unknown) {
      interface AxiosErrorResponse {
        response?: {
          data?: {
            error?: string;
          };
        };
      }
      const errMsg =
        (error as AxiosErrorResponse).response?.data?.error || t('toasts.register_error');
      setErrors({
        email: errMsg,
      });
      toast.error(t('toasts.register_error'), {
        description: errMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-[calc(100vh-85px)]">
      <LoadingOverlay isVisible={isLoading} message={t('register.registering')} />
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-85px)]">
        {/* Left Side: Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden lg:w-[40%] xl:w-[45%] bg-[#F0FBF9] dark:bg-[#112220]">
          <div className="w-3/4 max-w-[500px]">
            <Image
              src="/assets/algo_group_119.svg"
              alt="Register illustration"
              width={600}
              height={600}
              priority
              className="opacity-90"
              style={{ width: '100%', height: 'auto' }}
            />
          </div>
          <div
            className="absolute rounded-full"
            style={{
              right: '5%',
              top: '8%',
              width: '140px',
              height: '140px',
              backgroundColor: '#36D6BA',
              opacity: 0.15,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              left: '5%',
              bottom: '8%',
              width: '200px',
              height: '200px',
              backgroundColor: '#269984',
              opacity: 0.1,
            }}
          />
        </div>

        {/* Right Side: Register Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-6 sm:px-10">
          <div className="w-full max-w-[500px]">
            {isSuccess ? (
              <div className="text-center animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 bg-[#36D6BA] bg-opacity-20 rounded-full flex items-center justify-center mb-6 mx-auto">
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
                <h1 className="font-montserrat font-bold text-3xl sm:text-4xl text-black dark:text-white mb-4">
                  {t('register.success_title')}
                </h1>
                <p className="font-montserrat text-lg mb-8 text-[#666] dark:text-gray-400">
                  {t('register.success_desc', { email })}
                </p>
                <Link
                  href="/login"
                  className="w-full font-montserrat font-bold text-white h-11 sm:h-12 rounded-lg text-lg flex items-center justify-center hover:opacity-90 transition-all cursor-pointer"
                  style={{ backgroundColor: '#269984' }}
                >
                  {t('register.success_btn')}
                </Link>
              </div>
            ) : (
              <>
                <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-4xl text-black dark:text-white mb-2">
                  {t('register.title')}
                </h1>
                <p className="font-montserrat text-sm sm:text-base mb-6 text-[#666] dark:text-gray-400">
                  {t('register.subtitle')}
                </p>

                <form onSubmit={handleSubmit}>
                  {/* Name fields */}
                  <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="flex-1">
                      <label className="font-montserrat font-bold text-black dark:text-white block mb-1 text-xs sm:text-sm">
                        {t('register.first_name_label')}
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full font-montserrat h-11 sm:h-12 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.firstName ? 'border-red-500' : ''}`}
                        placeholder={t('register.first_name_placeholder')}
                      />
                      {errors.firstName && (
                        <p className="text-red-500 text-[10px] mt-0.5">{errors.firstName}</p>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="font-montserrat font-bold text-black dark:text-white block mb-1 text-xs sm:text-sm">
                        {t('register.last_name_label')}
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className={`w-full font-montserrat h-11 sm:h-12 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.lastName ? 'border-red-500' : ''}`}
                        placeholder={t('register.last_name_placeholder')}
                      />
                      {errors.lastName && (
                        <p className="text-red-500 text-[10px] mt-0.5">{errors.lastName}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-4">
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-1 text-xs sm:text-sm">
                      {t('register.email_label')}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full font-montserrat h-11 sm:h-12 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.email ? 'border-red-500' : ''}`}
                      placeholder={t('register.email_placeholder')}
                    />
                    {errors.email && (
                      <p className="text-red-500 text-[10px] mt-0.5">{errors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="mb-4">
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-1 text-xs sm:text-sm">
                      {t('register.password_label')}
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full font-montserrat h-11 sm:h-12 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.password ? 'border-red-500' : ''}`}
                      placeholder={t('register.password_placeholder')}
                    />
                    {errors.password && (
                      <p className="text-red-500 text-[10px] mt-0.5">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-4">
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-1 text-xs sm:text-sm">
                      {t('register.confirm_password_label')}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full font-montserrat h-11 sm:h-12 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      placeholder={t('register.confirm_password_placeholder')}
                    />
                    {errors.confirmPassword && (
                      <p className="text-red-500 text-[10px] mt-0.5">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Terms */}
                  <div className="mb-6">
                    <label className="flex items-start gap-3 cursor-pointer font-montserrat text-xs sm:text-sm">
                      <input
                        type="checkbox"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-4 h-4 accent-[#36D6BA] mt-0.5"
                      />
                      <span className="text-black dark:text-white leading-relaxed">
                        {t('register.terms_accept')
                          .split(/(\{terms\}|\{privacy\})/)
                          .map((part, i) => {
                            if (part === '{terms}') {
                              return (
                                <Link
                                  key={i}
                                  href="/terms"
                                  className="font-bold underline md:no-underline md:hover:underline"
                                  style={{ color: '#36D6BA' }}
                                >
                                  {t('register.terms_link')}
                                </Link>
                              );
                            }
                            if (part === '{privacy}') {
                              return (
                                <Link
                                  key={i}
                                  href="/privacy"
                                  className="font-bold underline md:no-underline md:hover:underline"
                                  style={{ color: '#36D6BA' }}
                                >
                                  {t('register.privacy_link')}
                                </Link>
                              );
                            }
                            return part;
                          })}
                      </span>
                    </label>
                    {errors.terms && (
                      <p className="text-red-500 text-[10px] mt-0.5">{errors.terms}</p>
                    )}
                  </div>

                  {/* Register button */}
                  <button
                    className="w-full font-montserrat font-bold text-white h-11 sm:h-12 rounded-lg text-base sm:text-lg hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: '#269984', border: 'none' }}
                    disabled={isLoading}
                  >
                    {isLoading ? t('register.registering') : t('register.register_btn')}
                  </button>
                </form>

                {/* Login link */}
                <p className="text-center font-montserrat mt-6 text-sm sm:text-base text-[#666] dark:text-gray-400">
                  {t('register.already_have_account')}{' '}
                  <Link
                    href="/login"
                    className="font-bold hover:underline"
                    style={{ color: '#36D6BA' }}
                  >
                    {t('register.login_link')}
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
