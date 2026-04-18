'use client';

import { BaseUser } from '../../../lib/types/auth';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import axios, { AxiosError } from 'axios';
import {
  AlertTriangle,
  User,
  Settings,
  Lock,
  Trash2,
  Mail,
  Calendar,
  CheckCircle2,
  ShieldCheck,
  ExternalLink,
  Download,
  Smartphone,
  Flame,
  Clock,
  Trophy,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, Locale } from '../../i18n/LocaleProvider';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import LoadingOverlay from '../../components/LoadingOverlay';

const formatDate = (dateString: string, locale: Locale, t: (key: string) => string) => {
  if (!dateString) return t('common.not_available');
  const date = new Date(dateString);

  if (locale === 'hu') {
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  if (locale === 'ro') {
    return date.toLocaleString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const day = date.getDate();
  const suffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:
        return 'st';
      case 2:
        return 'nd';
      case 3:
        return 'rd';
      default:
        return 'th';
    }
  };
  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${month} ${day}${suffix(day)} ${year}, ${time}`;
};

const formatLearningTime = (timeSpentMs: number, locale: Locale) => {
  const minutes = Math.round((timeSpentMs || 0) / 60000);
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'minute',
    unitDisplay: 'short',
    maximumFractionDigits: 0,
  }).format(minutes);
};

const sidebarLinks = [
  { key: 'public', icon: User },
  { key: 'edit', icon: Settings },
  { key: 'password', icon: Lock },
  { key: 'delete', icon: Trash2 },
];

export default function ProfilePage() {
  const { t, locale } = useLocale();
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { courseProgress } = useAlgorithmStore();
  const { install, canInstall, isStandalone, isIOS } = usePWAInstall();

  const [activeTab, setActiveTab] = useState('public');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [mascotEnabled, setMascotEnabled] = useState(true);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleteConfirmed, setIsDeleteConfirmed] = useState(false);

  const [lastSyncedEmail, setLastSyncedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email && session.user.email !== lastSyncedEmail) {
      interface LocalUser {
        firstName?: string;
        lastName?: string;
        bio?: string;
        mascotEnabled?: boolean;
      }
      const u = session.user as LocalUser;
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setBio(u.bio || '');
      setMascotEnabled(u.mascotEnabled !== false);
      setLastSyncedEmail(session.user.email);
    }
  }, [session, lastSyncedEmail]);

  const handleUpdateProfile = useCallback(
    async (showToast = true) => {
      setIsSaving(true);

      try {
        await axios.post('/api/profile/update', { firstName, lastName, bio, mascotEnabled });
        await update({ firstName, lastName, bio, mascotEnabled });
        if (showToast) {
          toast.success(t('toasts.profile_updated'), {
            id: 'profile-update',
            duration: 2000,
          });
        }
      } catch {
        if (showToast) {
          toast.error(t('toasts.profile_update_error'), {
            id: 'profile-update-error',
          });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [firstName, lastName, bio, mascotEnabled, t, update],
  );

  // Autosave effect for text fields
  useEffect(() => {
    if (status !== 'authenticated' || !lastSyncedEmail) return;

    // Check if anything actually changed to avoid initial/redundant saves
    const u = session?.user as BaseUser;
    if (
      firstName === (u.firstName || '') &&
      lastName === (u.lastName || '') &&
      bio === (u.bio || '') &&
      mascotEnabled === (u.mascotEnabled !== false)
    ) {
      return;
    }

    const timer = setTimeout(() => {
      handleUpdateProfile(false); // Silent save for text fields
    }, 1500);

    return () => clearTimeout(timer);
  }, [
    firstName,
    lastName,
    bio,
    mascotEnabled,
    status,
    lastSyncedEmail,
    session,
    handleUpdateProfile,
  ]);

  // Mascot toggle is immediate
  useEffect(() => {
    if (status !== 'authenticated' || !lastSyncedEmail) return;

    const u = session?.user as BaseUser;
    if (mascotEnabled === (u.mascotEnabled !== false)) return;

    handleUpdateProfile(true); // Keep toast for toggle
  }, [mascotEnabled, status, lastSyncedEmail, session, handleUpdateProfile]);

  if (status === 'loading' && !lastSyncedEmail) {
    return <LoadingOverlay isVisible={true} message={t('common.loading')} />;
  }

  if (!session?.user) return null;

  const user = session.user;
  const fullName = `${firstName} ${lastName}`.trim() || user.email || '';

  const getInitials = () => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
    return (user.email?.[0] || 'U').toUpperCase();
  };

  const initials = getInitials();
  const avatarUrl: string | undefined =
    (user as { imageUrl?: string }).imageUrl || user.image || undefined;

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('login.errors.password_required'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('register.errors.password_mismatch'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('toasts.password_min'));
      return;
    }

    setIsSaving(true);

    const passwordPromise = (async () => {
      await axios.post('/api/profile/update-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      return t('toasts.password_updated');
    })();

    toast.promise(passwordPromise, {
      loading: t('profile.edit.saving'),
      success: (data) => data,
      error: (error: unknown) => {
        const axiosError = error as AxiosError<{ error: string }>;
        return axiosError.response?.data?.error || t('toasts.password_update_error');
      },
    });

    try {
      await passwordPromise;
    } catch {
      // Handled by toast.promise
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsSaving(true);
    const { clearStore } = useAlgorithmStore.getState();

    const deletePromise = (async () => {
      await axios.delete('/api/profile/delete');
      clearStore();
      await signOut({ callbackUrl: '/' });
      return t('toasts.account_deleted');
    })();

    toast.promise(deletePromise, {
      loading: t('profile.edit.saving'),
      success: (data) => data,
      error: (error: unknown) => {
        const axiosError = error as AxiosError<{ error: string }>;
        return axiosError.response?.data?.error || t('toasts.delete_error');
      },
    });

    try {
      await deletePromise;
    } catch {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0a] min-h-[calc(100vh-85px)] py-8 md:py-12 px-4 sm:px-10 overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <h1 className="font-montserrat font-bold text-3xl sm:text-4xl text-black dark:text-white">
              {t('profile.title')}
            </h1>
            <p className="font-montserrat text-gray-500 mt-2">{t('profile.hero.subtitle')}</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-[#111] rounded-3xl p-3 border border-gray-100 dark:border-neutral-800 shadow-sm sticky top-24">
              <nav className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                {sidebarLinks
                  .filter((link) => {
                    if (
                      link.key === 'password' &&
                      (user as BaseUser).authProvider &&
                      (user as BaseUser).authProvider !== 'email'
                    ) {
                      return false;
                    }
                    return true;
                  })
                  .map((link) => {
                    const Icon = link.icon;
                    return (
                      <button
                        key={link.key}
                        onClick={() => {
                          setActiveTab(link.key);
                        }}
                        className={`flex items-center gap-3 w-full text-left px-5 py-3.5 rounded-2xl font-montserrat font-bold text-sm transition-all select-none whitespace-nowrap ${
                          activeTab === link.key
                            ? 'bg-[#269984] text-white shadow-lg shadow-[#269984]/30 scale-[1.02]'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <Icon size={18} strokeWidth={2.5} />
                        {t(`profile.tabs.${link.key}`)}
                      </button>
                    );
                  })}
              </nav>
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 bg-white dark:bg-[#111] rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-2xl shadow-gray-200/50 dark:shadow-none min-h-[600px] flex flex-col overflow-hidden">
            {/* Header / Profile Header */}
            <div className="bg-gradient-to-br from-[#269984] via-[#36D6BA] to-[#269984] h-32 sm:h-40 relative">
              {/* Pattern Overlay */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              ></div>
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

              <div className="absolute -bottom-10 left-0 right-0 sm:left-8 flex flex-col sm:flex-row items-center sm:items-end gap-3 sm:gap-6 z-10 px-4 sm:px-0">
                <div className="relative group flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border-4 sm:border-[6px] border-white dark:border-[#111] bg-white dark:bg-neutral-800 shadow-xl overflow-hidden flex items-center justify-center relative">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={fullName}
                        width={112}
                        height={112}
                        className="w-full h-full object-cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <span className="text-2xl sm:text-3xl font-black text-[#269984]">
                        {initials}
                      </span>
                    )}
                  </div>
                  {/* Role Badge on the Avatar - Only for Admins */}
                  {(user as BaseUser).role === 'admin' && (
                    <div className="absolute -top-1.5 -left-1.5 bg-[#269984] text-white px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg border-2 border-white dark:border-[#111] z-20">
                      {t('common.admin')}
                    </div>
                  )}
                </div>

                <div className="mb-6 sm:mb-16 text-center sm:text-left min-w-0 max-w-full">
                  <h2 className="font-montserrat font-black text-2xl sm:text-3xl text-white drop-shadow-md">
                    {fullName}
                  </h2>
                </div>
              </div>
            </div>

            <div className="pt-20 sm:pt-24 px-4 sm:px-8 pb-10 flex-1 overflow-hidden">
              {/* Tab Content */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 h-full">
                {/* Public Profile Content */}
                {activeTab === 'public' && (
                  <div className="space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-6">
                        <div>
                          <label className="flex items-center gap-2 font-montserrat font-black text-[#269984] mb-3 text-xs uppercase tracking-[0.2em]">
                            <User size={14} className="opacity-70" />
                            {t('profile.public.bio_title')}
                          </label>
                          <div className="p-6 bg-gray-50 dark:bg-neutral-900/50 rounded-3xl border border-gray-100 dark:border-neutral-800/50 min-h-[120px]">
                            <p className="font-montserrat text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed italic">
                              &quot;{bio || t('profile.public.no_bio')}&quot;
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="flex items-center gap-2 font-montserrat font-black text-[#269984] mb-3 text-xs uppercase tracking-[0.2em]">
                            <Calendar size={14} className="opacity-70" />
                            {t('profile.public.member_since')}
                          </label>
                          <div className="flex items-center gap-4 p-4 bg-white dark:bg-neutral-900 rounded-2xl border border-gray-100 dark:border-neutral-800">
                            <div className="p-2 bg-[#269984]/10 text-[#269984] rounded-lg">
                              <CheckCircle2 size={20} />
                            </div>
                            <p className="font-montserrat text-base font-bold text-gray-800 dark:text-gray-200">
                              {formatDate((user as BaseUser).createdAt || '', locale, t)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <label className="flex items-center gap-2 font-montserrat font-black text-[#269984] mb-3 text-xs uppercase tracking-[0.2em]">
                          <ShieldCheck size={14} className="opacity-70" />
                          {t('profile.public.account_details')}
                        </label>
                        <div className="p-6 bg-[#269984]/5 dark:bg-[#269984]/10 rounded-3xl border-2 border-dashed border-[#269984]/20 space-y-4">
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center py-2 border-b border-[#269984]/10 gap-1 overflow-hidden">
                            <span className="text-sm font-semibold text-gray-500 whitespace-nowrap">
                              {t('profile.edit.email')}
                            </span>
                            <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">
                              {user.email}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2 border-b border-[#269984]/10">
                            <span className="text-sm font-semibold text-gray-500">
                              {t('profile.public.provider')}
                            </span>
                            <span className="text-xs font-black uppercase bg-white dark:bg-neutral-800 px-2 py-1 rounded shadow-sm">
                              {(user as BaseUser).authProvider || t('login.email_label')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center py-2">
                            <span className="text-sm font-semibold text-gray-500">
                              {t('profile.public.status')}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs font-bold text-[#269984]">
                              <CheckCircle2 size={14} /> {t('profile.public.verified_status')}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="flex items-center gap-2 font-montserrat font-black text-[#269984] mb-3 text-xs uppercase tracking-[0.2em]">
                            <Target size={14} className="opacity-70" />
                            {t('profile.public.progress_title')}
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            {/* Points & Checkpoints Card */}
                            <div className="p-5 rounded-[2rem] bg-neutral-900 text-white flex flex-col justify-between shadow-lg relative overflow-hidden group">
                              <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-[#269984]/20 transition-all duration-500"></div>
                              <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                  <Trophy size={20} className="text-[#269984]" />
                                  <button
                                    onClick={() => router.push('/courses')}
                                    className="p-2 bg-white/10 hover:bg-[#269984] transition-all rounded-xl shadow-lg hover:scale-105 active:scale-95"
                                  >
                                    <ExternalLink size={14} />
                                  </button>
                                </div>
                                <div className="flex items-end gap-2">
                                  <p className="text-3xl font-black text-[#269984]">
                                    {((user as BaseUser).learningStats?.totalPoints as number) ||
                                      Object.values(courseProgress).reduce(
                                        (acc, curr) => acc + (curr.points || 0),
                                        0,
                                      )}
                                  </p>
                                  <p className="text-[10px] uppercase font-bold text-gray-400 mb-1.5">
                                    {t('courses.table.points')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Streaks Card */}
                            <div className="p-5 rounded-[2rem] bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 flex flex-col justify-between">
                              <div className="flex items-center gap-2 mb-4">
                                <Flame size={20} className="text-orange-500" />
                                <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">
                                  {t('profile.public.streak')}
                                </span>
                              </div>
                              <div className="flex justify-between items-end">
                                <div>
                                  <p className="text-3xl font-black text-orange-500">
                                    {((user as BaseUser).learningStats?.currentStreak as number) ||
                                      0}
                                  </p>
                                  <p className="text-[10px] uppercase font-bold text-gray-500">
                                    {t('profile.public.current')}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-orange-400/70">
                                    {((user as BaseUser).learningStats?.longestStreak as number) ||
                                      0}
                                  </p>
                                  <p className="text-[10px] uppercase font-bold text-gray-500">
                                    {t('profile.public.best')}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Time & Average Score Card */}
                            <div className="col-span-2 p-5 rounded-[2rem] bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                                  <Clock size={24} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                    {formatLearningTime(
                                      ((user as BaseUser).learningStats
                                        ?.totalTimeSpentMs as number) || 0,
                                      locale,
                                    )}
                                  </p>
                                  <p className="text-[10px] uppercase font-bold text-gray-400">
                                    {t('profile.public.learning_time')}
                                  </p>
                                </div>
                              </div>
                              <div className="h-10 w-px bg-blue-500/10"></div>
                              <div className="text-right pr-2">
                                <p className="text-lg font-black text-blue-500">
                                  {((user as BaseUser).learningStats?.averageScore as number) || 0}%
                                </p>
                                <p className="text-[10px] uppercase font-bold text-gray-400">
                                  {t('profile.public.avg_score')}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* PWA Download Section - Persistent on Mobile */}
                      {!isStandalone && (canInstall || isIOS) && (
                        <div className="md:col-span-2 p-8 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20 rounded-[2.5rem] border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-6 font-montserrat antialiased">
                          <div className="flex items-center gap-5">
                            <div className="bg-white dark:bg-emerald-500/20 p-4 rounded-[1.5rem] shadow-sm flex items-center justify-center">
                              <Smartphone className="w-8 h-8 text-emerald-500" />
                            </div>
                            <div>
                              <h3 className="font-montserrat font-black text-slate-900 dark:text-white text-lg leading-tight uppercase tracking-tight">
                                {t('pwa.install_title')}
                              </h3>
                              <p className="font-montserrat font-medium text-slate-600 dark:text-slate-400 text-sm max-w-sm mt-1">
                                {isIOS ? t('pwa.ios_instructions') : t('pwa.install_desc')}
                              </p>
                            </div>
                          </div>

                          {/* Different action based on platform/browser status */}
                          <div className="w-full sm:w-auto">
                            {!isIOS ? (
                              <button
                                onClick={install}
                                disabled={!canInstall}
                                className={`w-full sm:w-auto px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 group uppercase tracking-wider text-xs ${!canInstall ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
                              >
                                <Download
                                  className={`w-5 h-5 ${canInstall ? 'group-hover:animate-bounce' : ''}`}
                                />
                                {canInstall
                                  ? t('pwa.profile_install_btn')
                                  : t('pwa.already_installed_check')}
                              </button>
                            ) : (
                              <div className="px-6 py-3 bg-white/50 dark:bg-black/20 rounded-2xl border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider text-center">
                                {t('pwa.ios_instructions')}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Edit Profile Content */}
                {activeTab === 'edit' && (
                  <div className="max-w-2xl space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <label className="font-montserrat font-black text-black dark:text-white text-xs uppercase tracking-widest pl-1">
                          {t('profile.edit.first_name')}
                        </label>
                        <input
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          placeholder={t('profile.edit.first_name_placeholder')}
                          className="w-full font-montserrat h-14 border-2 border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#1a1a1a] dark:text-white rounded-2xl px-5 text-base outline-none focus:border-[#269984] focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-montserrat font-black text-black dark:text-white text-xs uppercase tracking-widest pl-1">
                          {t('profile.edit.last_name')}
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder={t('profile.edit.last_name_placeholder')}
                          className="w-full font-montserrat h-14 border-2 border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#1a1a1a] dark:text-white rounded-2xl px-5 text-base outline-none focus:border-[#269984] focus:bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-montserrat font-black text-black dark:text-white text-xs uppercase tracking-widest pl-1">
                        {t('profile.edit.email')}
                      </label>
                      <div className="w-full font-montserrat h-14 border-2 border-gray-50 bg-gray-50/30 dark:bg-neutral-900/30 text-gray-400 rounded-2xl px-5 text-base flex items-center gap-3">
                        <Mail size={18} />
                        {user.email}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="font-montserrat font-black text-black dark:text-white text-xs uppercase tracking-widest pl-1">
                        {t('profile.edit.bio')}
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        placeholder={t('profile.edit.bio_placeholder')}
                        className="w-full font-montserrat py-4 border-2 border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#1a1a1a] dark:text-white rounded-2xl px-5 text-base outline-none focus:border-[#269984] focus:bg-white transition-all shadow-sm resize-none"
                      />
                    </div>

                    <div className="p-6 bg-[#f0fbf9] dark:bg-[#269984]/5 rounded-[2rem] border border-[#269984]/20 flex items-center justify-between">
                      <div className="flex-1 pr-4">
                        <p className="font-montserrat font-black text-[#269984] text-xs uppercase tracking-widest mb-1">
                          {t('profile.edit.mascot_label')}
                        </p>
                        <p className="text-xs text-[#269984]/70 leading-relaxed">
                          {t('profile.edit.mascot_description')}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setMascotEnabled(!mascotEnabled);
                        }}
                        className={`w-14 h-8 rounded-full transition-all relative p-1 ${mascotEnabled ? 'bg-[#269984]' : 'bg-gray-300 dark:bg-neutral-700'}`}
                      >
                        <div
                          className={`w-6 h-6 bg-white rounded-full transition-all shadow-md ${mascotEnabled ? 'translate-x-6' : 'translate-x-0'}`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-4">
                      {isSaving && (
                        <div className="flex items-center gap-2 text-[#269984] font-montserrat font-bold text-sm animate-pulse">
                          <div className="w-1.5 h-1.5 bg-[#269984] rounded-full"></div>
                          {t('profile.edit.saving')}
                        </div>
                      )}
                      {!isSaving && firstName && (
                        <div className="flex items-center gap-2 text-gray-400 font-montserrat font-medium text-sm">
                          <CheckCircle2 size={14} className="text-[#269984]" />
                          {t('toasts.profile_updated_desc')}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Security Content */}
                {activeTab === 'password' && (
                  <div className="max-w-md space-y-10">
                    <div className="p-6 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-3xl flex gap-4">
                      <ShieldCheck className="text-blue-500 flex-shrink-0" size={24} />
                      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                        {t('profile.security.info_text')}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="font-montserrat font-black text-black dark:text-white text-xs uppercase tracking-widest pl-1">
                          {t('profile.security.current_password')}
                        </label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full font-montserrat h-14 border-2 border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#1a1a1a] dark:text-white rounded-2xl px-5 outline-none focus:border-[#269984] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-montserrat font-black text-black dark:text-white text-xs uppercase tracking-widest pl-1">
                          {t('profile.security.new_password')}
                        </label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full font-montserrat h-14 border-2 border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#1a1a1a] dark:text-white rounded-2xl px-5 outline-none focus:border-[#269984] transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-montserrat font-black text-black dark:text-white text-xs uppercase tracking-widest pl-1">
                          {t('profile.security.confirm_password')}
                        </label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full font-montserrat h-14 border-2 border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#1a1a1a] dark:text-white rounded-2xl px-5 outline-none focus:border-[#269984] transition-all"
                        />
                      </div>

                      <div className="flex items-center gap-6 pt-4">
                        <button
                          onClick={handleUpdatePassword}
                          disabled={isSaving}
                          className="font-montserrat font-black text-white h-14 px-10 rounded-2xl text-base hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-[#269984]/30 transition-all cursor-pointer select-none bg-[#269984] disabled:opacity-50"
                        >
                          {isSaving ? t('profile.edit.saving') : t('profile.security.update_btn')}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delete Account Content */}
                {activeTab === 'delete' && (
                  <div className="max-w-xl space-y-10">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 p-8 rounded-[2rem] flex gap-5">
                      <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-2xl h-fit">
                        <AlertTriangle className="text-red-500" size={32} />
                      </div>
                      <div>
                        <h3 className="font-montserrat font-black text-red-600 dark:text-red-500 mb-2 text-xl">
                          {t('profile.tabs.delete')}
                        </h3>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 font-montserrat leading-relaxed">
                          {t('profile.delete.warning')}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <p className="font-montserrat text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-tighter">
                          {t('profile.delete.confirm_text')}
                        </p>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => {
                            setDeleteConfirmation(e.target.value);
                            setIsDeleteConfirmed(e.target.value === 'DELETE');
                          }}
                          className="w-full font-montserrat h-16 border-2 border-gray-100 dark:border-neutral-800 bg-white dark:bg-[#1a1a1a] dark:text-white rounded-3xl px-6 text-xl text-center font-black outline-none focus:border-red-500 transition-all uppercase placeholder:opacity-20 translate-x-0"
                          placeholder={t('profile.delete.placeholder')}
                        />
                      </div>

                      <button
                        onClick={handleDeleteAccount}
                        disabled={!isDeleteConfirmed || isSaving}
                        className="w-full font-montserrat font-black text-white h-16 px-10 rounded-3xl text-lg hover:bg-red-700 active:scale-[0.98] transition-all cursor-pointer select-none bg-red-600 shadow-xl shadow-red-600/20 disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        {t('profile.delete.delete_btn')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
