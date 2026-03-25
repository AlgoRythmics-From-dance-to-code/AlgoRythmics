// Client Component
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { signIn } from 'next-auth/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const socialLogin = (provider: string) => {
    signIn(provider, { callbackUrl: '/api/auth/social-callback' });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    if (!password.trim()) newErrors.password = 'Password is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    setErrors({});

    try {
      await axios.post('/api/auth/login', { email, password });
      router.push('/');
      router.refresh();
    } catch (error: any) {
      setErrors({
        email: error.response?.data?.error || 'Login failed. Please check your credentials.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-[calc(100vh-85px)]">
      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-85px)]">
        {/* Left Side: Illustration */}
        <div className="hidden lg:flex flex-col items-center justify-center relative overflow-hidden lg:w-[40%] xl:w-[45%] bg-[#F0FBF9] dark:bg-[#112220]">
          <div className="w-3/4 max-w-[500px]">
            <Image
              src="/assets/algo_group_109.svg"
              alt="Login illustration"
              width={600}
              height={600}
              className="w-full h-auto opacity-90"
              style={{ width: 'auto', height: 'auto' }}
            />
          </div>
          {/* Decorative circles */}
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
          <div
            className="absolute rounded-full"
            style={{
              right: '30%',
              top: '5%',
              width: '80px',
              height: '80px',
              backgroundColor: '#36D6BA',
              opacity: 0.2,
            }}
          />
        </div>

        {/* Right Side: Login Form */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 sm:px-10">
          <div className="w-full max-w-[500px]">
            <h1 className="font-montserrat font-bold text-3xl sm:text-4xl lg:text-5xl text-black dark:text-white mb-3">
              Login
            </h1>
            <p className="font-montserrat text-base sm:text-lg mb-10 text-[#666] dark:text-gray-400">
              Welcome back! Please login to your account.
            </p>

            <form onSubmit={handleSubmit}>
              {/* Email field */}
              <div className="mb-6">
                <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm sm:text-base">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full font-montserrat h-12 sm:h-14 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 sm:px-5 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.email ? 'border-red-500' : ''}`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {/* Password field */}
              <div className="mb-6">
                <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm sm:text-base">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full font-montserrat h-12 sm:h-14 border-2 border-[#E0E0E0] dark:border-neutral-700 bg-white dark:bg-[#2a2a2a] dark:text-white rounded-lg px-4 sm:px-5 text-base outline-none focus:border-[#36D6BA] transition-colors ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Enter your password"
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              {/* Remember me + Forgot password */}
              <div className="flex items-center justify-between mb-10">
                <label className="flex items-center gap-2 cursor-pointer font-montserrat text-sm">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="w-5 h-5 accent-[#36D6BA]"
                  />
                  <span className="text-black dark:text-white">Remember me</span>
                </label>
                <Link
                  href="#"
                  className="font-montserrat font-bold text-sm hover:underline"
                  style={{ color: '#36D6BA' }}
                >
                  Forgot password?
                </Link>
              </div>

              {/* Login button */}
              <button
                className="w-full font-montserrat font-bold text-white h-12 sm:h-14 rounded-lg text-lg sm:text-xl hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#269984', border: 'none' }}
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-[#E0E0E0] dark:bg-neutral-700" />
              <span className="font-montserrat text-sm text-[#999] dark:text-gray-500">or</span>
              <div className="flex-1 h-px bg-[#E0E0E0] dark:bg-neutral-700" />
            </div>

            {/* Social login */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {/* Google */}
              <button
                type="button"
                onClick={() => socialLogin('google')}
                className="flex items-center justify-center gap-2 font-montserrat font-medium h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 rounded-lg text-sm text-[#333] dark:text-white bg-white dark:bg-[#2a2a2a] cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path
                    fill="#FFC107"
                    d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                  <path
                    fill="#FF3D00"
                    d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
                  />
                  <path
                    fill="#4CAF50"
                    d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
                  />
                  <path
                    fill="#1976D2"
                    d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
                  />
                </svg>
                Google
              </button>

              {/* Facebook */}
              <button
                type="button"
                onClick={() => socialLogin('facebook')}
                className="flex items-center justify-center gap-2 font-montserrat font-medium h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 rounded-lg text-sm text-[#333] dark:text-white bg-white dark:bg-[#2a2a2a] cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                Facebook
              </button>

              {/* Discord */}
              <button
                type="button"
                onClick={() => socialLogin('discord')}
                className="flex items-center justify-center gap-2 font-montserrat font-medium h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 rounded-lg text-sm text-[#333] dark:text-white bg-white dark:bg-[#2a2a2a] cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#5865F2">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                </svg>
                Discord
              </button>

              {/* GitHub */}
              <button
                type="button"
                onClick={() => socialLogin('github')}
                className="flex items-center justify-center gap-2 font-montserrat font-medium h-12 sm:h-13 border-2 border-[#E0E0E0] dark:border-neutral-700 rounded-lg text-sm text-[#333] dark:text-white bg-white dark:bg-[#2a2a2a] cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                GitHub
              </button>
            </div>

            {/* Register link */}
            <p className="text-center font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-bold hover:underline"
                style={{ color: '#36D6BA' }}
              >
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
