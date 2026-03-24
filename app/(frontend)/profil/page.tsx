'use client';

import { useState } from 'react';

const sidebarLinks = [
  { key: 'public', label: 'Public Profile' },
  { key: 'edit', label: 'Edit Profile' },
  { key: 'password', label: 'Password' },
  { key: 'external', label: 'External Logins' },
  { key: 'auth', label: 'Two-Factor Auth' },
  { key: 'delete', label: 'Delete Account' },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('public');
  const [firstName, setFirstName] = useState('John');
  const [lastName, setLastName] = useState('Doe');
  const email = 'john@example.com';
  const [bio, setBio] = useState(
    'Computer science enthusiast learning algorithms through dance and music.',
  );
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-screen">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 py-12 md:py-16 bg-[#F0FBF9] dark:bg-[#112220]">
        <h1 className="font-montserrat font-bold text-black dark:text-white text-3xl sm:text-4xl">
          Profile Settings
        </h1>
      </div>

      {/* Content */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 md:py-16">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Sidebar */}
          <div className="md:w-64 lg:w-72 flex-shrink-0">
            {/* Mobile: horizontal scroll tabs */}
            <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">
              {sidebarLinks.map((link) => (
                <button
                  key={link.key}
                  onClick={() => setActiveTab(link.key)}
                  className={`font-montserrat font-bold transition-all rounded-lg text-left whitespace-nowrap px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base cursor-pointer ${
                    activeTab === link.key
                      ? 'bg-[#269984] text-white'
                      : 'bg-transparent text-[#333] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1 min-w-0">
            {activeTab === 'public' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6 md:mb-8">
                  Public Profile
                </h2>
                <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 mb-8 p-6 sm:p-8 rounded-2xl bg-[#FAFAFA] dark:bg-[#1a1a1a]">
                  <div
                    className="flex items-center justify-center rounded-full font-montserrat font-bold text-white w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-4xl flex-shrink-0"
                    style={{ backgroundColor: '#269984' }}
                  >
                    JD
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-montserrat font-bold text-xl sm:text-2xl text-black dark:text-white">
                      John Doe
                    </h3>
                    <p className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400">
                      {email}
                    </p>
                    <p className="font-montserrat mt-2 text-xs sm:text-sm text-[#999] dark:text-gray-500">
                      Member since January 2024
                    </p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 rounded-xl border-2 border-[#F0F0F0] dark:border-white/10">
                  <h4 className="font-montserrat font-bold text-base sm:text-lg text-black dark:text-white mb-3">
                    Bio
                  </h4>
                  <p className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400 leading-relaxed">
                    {bio}
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'edit' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6 md:mb-8">
                  Edit Profile
                </h2>
                <div className="space-y-5 max-w-lg">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">
                        First name
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full font-montserrat h-12 border-2 border-[#E0E0E0] dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">
                        Last name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full font-montserrat h-12 border-2 border-[#E0E0E0] dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">
                      Bio
                    </label>
                    <textarea
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full font-montserrat h-28 border-2 border-[#E0E0E0] dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white rounded-lg p-4 text-base outline-none resize-none focus:border-[#36D6BA] transition-colors"
                    />
                  </div>
                  <button className="font-montserrat font-bold text-white h-12 px-8 rounded-lg text-base hover:opacity-90 transition-all cursor-pointer bg-[#269984]">
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6 md:mb-8">
                  Change Password
                </h2>
                <div className="space-y-5 max-w-md">
                  <div>
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">
                      Current password
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full font-montserrat h-12 border-2 border-[#E0E0E0] dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">
                      New password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full font-montserrat h-12 border-2 border-[#E0E0E0] dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors"
                    />
                  </div>
                  <div>
                    <label className="font-montserrat font-bold text-black dark:text-white block mb-2 text-sm">
                      Confirm new password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full font-montserrat h-12 border-2 border-[#E0E0E0] dark:border-white/20 dark:bg-[#1a1a1a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-[#36D6BA] transition-colors"
                    />
                  </div>
                  <button className="font-montserrat font-bold text-white h-12 px-8 rounded-lg text-base hover:opacity-90 transition-all cursor-pointer bg-[#269984]">
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'external' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6 md:mb-8">
                  External Logins
                </h2>
                <div className="space-y-4 max-w-lg">
                  <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 border-[#E0E0E0] dark:border-white/20 bg-white dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <svg width="24" height="24" viewBox="0 0 48 48">
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
                      <span className="font-montserrat font-bold text-sm sm:text-base text-black dark:text-white">
                        Google
                      </span>
                    </div>
                    <button className="font-montserrat font-bold text-sm border-2 border-[#269984] text-[#269984] bg-transparent rounded-lg px-4 sm:px-5 py-2 cursor-pointer hover:bg-[#269984] hover:text-white transition-all">
                      Connect
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 sm:p-5 rounded-xl border-2 border-[#E0E0E0] dark:border-white/20 bg-white dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="#1877F2">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                      <span className="font-montserrat font-bold text-sm sm:text-base text-black dark:text-white">
                        Facebook
                      </span>
                    </div>
                    <button className="font-montserrat font-bold text-sm border-2 border-[#269984] text-[#269984] bg-transparent rounded-lg px-4 sm:px-5 py-2 cursor-pointer hover:bg-[#269984] hover:text-white transition-all">
                      Connect
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'auth' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-4 md:mb-6">
                  Two-Factor Authentication
                </h2>
                <p
                  className="font-montserrat text-sm sm:text-base mb-6 text-[#666] dark:text-gray-400"
                  style={{ lineHeight: '1.8em' }}
                >
                  Add an extra layer of security to your account by enabling two-factor
                  authentication.
                </p>
                <div className="p-5 sm:p-6 rounded-xl border-2 border-[#E0E0E0] dark:border-white/20 max-w-lg bg-white dark:bg-[#1a1a1a]">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <span className="font-montserrat font-bold text-sm sm:text-base text-black dark:text-white">
                      Two-Factor Authentication
                    </span>
                    <span
                      className="font-montserrat font-bold text-xs px-3 py-1 rounded-full"
                      style={{ color: '#E74C3C', backgroundColor: '#FDEDEC' }}
                    >
                      Disabled
                    </span>
                  </div>
                  <button className="font-montserrat font-bold text-white mt-4 h-10 px-6 rounded-lg text-sm cursor-pointer hover:opacity-90 transition-all bg-[#269984]">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'delete' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl mb-4 md:mb-6 text-[#E74C3C]">
                  Delete Account
                </h2>
                <div className="p-6 sm:p-8 rounded-xl max-w-xl bg-[#FFF5F5] dark:bg-[#330000] border-2 border-[#FDEDEC] dark:border-[#E74C3C]/30">
                  <p
                    className="font-montserrat text-sm sm:text-base mb-4 text-[#333] dark:text-gray-200"
                    style={{ lineHeight: '1.8em' }}
                  >
                    Once you delete your account, all of your data will be permanently removed. This
                    action cannot be undone.
                  </p>
                  <button className="font-montserrat font-bold text-white h-10 px-6 rounded-lg text-sm cursor-pointer hover:opacity-90 transition-all bg-[#E74C3C]">
                    Delete My Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
