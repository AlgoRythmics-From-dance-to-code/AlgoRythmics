'use client';

import { BaseUser } from '../../../lib/types/auth';

import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocale, Locale } from '../../i18n/LocaleProvider';
import { useAlgorithmStore } from '../../store/useAlgorithmStore';

const formatDate = (dateString: string, locale: Locale) => {
  if (!dateString) return 'N/A';
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

  const [activeTab, setActiveTab] = useState('public');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ text: '', type: '' });

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');

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
      }
      const u = session.user as LocalUser;
      setFirstName(u.firstName || '');
      setLastName(u.lastName || '');
      setBio(u.bio || '');
      setLastSyncedEmail(session.user.email);
    }
  }, [session, lastSyncedEmail]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-85px)] dark:bg-[#0a0a0a]">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#269984]"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-2 w-2 bg-[#269984] rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    );
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

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setSaveMessage({ text: '', type: '' });

    try {
      await axios.post('/api/profile/update', { firstName, lastName, bio });
      setSaveMessage({ text: t('toasts.profile_updated'), type: 'success' });
      toast.success(t('toasts.profile_updated'), {
        description: t('toasts.profile_updated_desc'),
      });
      await update({ firstName, lastName, bio });
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error: string }>;
      const errMsg = axiosError.response?.data?.error || t('toasts.profile_update_error');
      setSaveMessage({ text: errMsg, type: 'error' });
      toast.error(t('toasts.profile_update_error'), { description: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('toasts.unexpected_error_desc'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('toasts.password_update_error'));
      return;
    }
    setIsSaving(true);
    try {
      await axios.post('/api/profile/update-password', { currentPassword, newPassword });
      setSaveMessage({ text: t('toasts.password_updated'), type: 'success' });
      toast.success(t('toasts.password_updated'), {
        description: t('toasts.password_updated_desc'),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const errMsg =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response: { data?: { error?: string } } }).response?.data?.error ||
            t('toasts.profile_update_error')
          : t('toasts.profile_update_error');
      setSaveMessage({ text: errMsg, type: 'error' });
      toast.error(t('toasts.password_update_error'), { description: errMsg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') return;
    setIsSaving(true);
    const { clearStore } = useAlgorithmStore.getState();
    try {
      await axios.delete('/api/profile/delete');
      toast.success(t('toasts.account_deleted'), { description: t('toasts.account_deleted_desc') });
      clearStore();
      await signOut({ callbackUrl: '/' });
    } catch {
      const errMsg = t('toasts.delete_error');
      setSaveMessage({ text: errMsg, type: 'error' });
      toast.error(t('toasts.delete_error'), { description: errMsg });
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-[#f8f9fa] dark:bg-[#0a0a0a] min-h-[calc(100vh-85px)] py-12 px-4 sm:px-10">
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
                          setSaveMessage({ text: '', type: '' });
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
          <div className="flex-1 bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-2xl shadow-gray-200/50 dark:shadow-none min-h-[600px] flex flex-col">
            {/* Header / Profile Header - NO overflow-hidden here to allow avatar to peek out */}
            <div className="bg-gradient-to-br from-[#269984] via-[#36D6BA] to-[#269984] h-48 relative rounded-t-[2.5rem]">
              {/* Pattern Overlay */}
              <div
                className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                  backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                  backgroundSize: '24px 24px',
                }}
              ></div>
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>

              <div className="absolute -bottom-16 left-8 flex items-end gap-6 z-10">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl border-8 border-white dark:border-[#111] bg-white dark:bg-neutral-800 shadow-xl overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={fullName}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                        style={{ width: '100%', height: '100%' }}
                      />
                    ) : (
                      <span className="text-4xl font-black text-[#269984]">{initials}</span>
                    )}
                  </div>
                </div>

                <div className="mb-14 last:hidden md:block">
                  <h2 className="font-montserrat font-black text-3xl text-white drop-shadow-sm truncate max-w-[250px] sm:max-w-md">
                    {fullName}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white border border-white/30">
                      {(user as BaseUser).role || 'User'}
                    </span>
                    <span className="flex items-center gap-1.5 text-white/90 text-sm font-medium min-w-0">
                      <Mail size={14} className="flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-24 px-8 pb-10 flex-1 overflow-hidden">
              {/* Tab Content */}
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                              {formatDate((user as BaseUser).createdAt || '', locale)}
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
                              {(user as BaseUser).authProvider || 'Email'}
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

                        <div className="p-6 rounded-3xl bg-neutral-900 text-white flex items-center justify-between">
                          <div>
                            <p className="text-xs font-black uppercase opacity-50 tracking-tighter">
                              {t('profile.public.progress_title')}
                            </p>
                            <p className="text-lg font-black mt-1">
                              {t('profile.public.progress_subtitle')}
                            </p>
                          </div>
                          <button
                            onClick={() => router.push('/courses')}
                            className="p-3 bg-[#269984] hover:bg-[#36D6BA] transition-colors rounded-2xl"
                          >
                            <ExternalLink size={20} />
                          </button>
                        </div>
                      </div>
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
                          placeholder="Your first name"
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
                          placeholder="Your last name"
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
                        placeholder="Tell us about yourself..."
                        className="w-full font-montserrat py-4 border-2 border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-[#1a1a1a] dark:text-white rounded-2xl px-5 text-base outline-none focus:border-[#269984] focus:bg-white transition-all shadow-sm resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                      <button
                        onClick={handleUpdateProfile}
                        disabled={isSaving}
                        className="font-montserrat font-black text-white h-14 px-10 rounded-2xl text-base hover:scale-[1.03] active:scale-[0.98] shadow-lg shadow-[#269984]/30 transition-all cursor-pointer select-none bg-[#269984] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? t('profile.edit.saving') : t('profile.edit.save')}
                      </button>

                      {saveMessage.text && (
                        <div
                          className={`p-4 rounded-xl flex items-center gap-2 ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}
                        >
                          {saveMessage.type === 'success' ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <AlertTriangle size={18} />
                          )}
                          <span className="text-sm font-bold uppercase tracking-tight">
                            {saveMessage.text}
                          </span>
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
                          {t('profile.security.update_btn')}
                        </button>

                        {saveMessage.text && (
                          <div
                            className={`flex items-center gap-2 ${saveMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {saveMessage.type === 'success' ? (
                              <CheckCircle2 size={18} />
                            ) : (
                              <AlertTriangle size={18} />
                            )}
                            <span className="text-sm font-bold uppercase">{saveMessage.text}</span>
                          </div>
                        )}
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
                          placeholder="DELETE"
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
