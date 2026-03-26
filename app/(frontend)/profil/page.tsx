'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { AlertTriangle } from 'lucide-react';

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  
  const day = date.getDate();
  const suffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1:  return 'st';
      case 2:  return 'nd';
      case 3:  return 'rd';
      default: return 'th';
    }
  };

  const month = date.toLocaleString('en-US', { month: 'long' });
  const year = date.getFullYear();
  const time = date.toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return `${month} ${day}${suffix(day)} ${year}, ${time}`;
};

const sidebarLinks = [
  { key: 'public', label: 'Public Profile' },
  { key: 'edit', label: 'Edit Profile' },
  { key: 'password', label: 'Security' },
  { key: 'delete', label: 'Delete Account' },
];

export default function ProfilePage() {
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setFirstName((session.user as any).firstName || '');
      setLastName((session.user as any).lastName || '');
      setBio((session.user as any).bio || '');
    }
  }, [session]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-[#269984] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return null;

  const user = session.user as any;
  const fullName = `${firstName} ${lastName}`.trim() || user.email;
  
  const getInitials = () => {
    if (firstName && lastName) return (firstName[0] + lastName[0]).toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (lastName) return lastName[0].toUpperCase();
    return (user.email?.[0] || 'U').toUpperCase();
  };
  
  const initials = getInitials();
  const avatarUrl = user.imageUrl || user.image;

  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setSaveMessage({ text: '', type: '' });

    try {
      await axios.post('/api/profile/update', { firstName, lastName, bio });
      setSaveMessage({ text: 'Profil sikeresen frissítve!', type: 'success' });
      
      // Refresh the session to get latest data from DB
      await update();
    } catch (error: any) {
      setSaveMessage({ text: error.response?.data?.error || 'Hiba történt a mentés során.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setSaveMessage({ text: 'Kérlek tölts ki minden jelszó mezőt!', type: 'error' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSaveMessage({ text: 'Az új jelszavak nem egyeznek!', type: 'error' });
      return;
    }

    setIsSaving(true);
    try {
      await axios.post('/api/profile/update-password', { currentPassword, newPassword });
      setSaveMessage({ text: 'Jelszó sikeresen módosítva!', type: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setSaveMessage({ text: error.response?.data?.error || 'Hiba történt a jelszó módosítása során.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user.email) {
      setSaveMessage({ text: 'Kérlek írd be pontosan az e-mail címedet a törléshez!', type: 'error' });
      return;
    }
    if (!isDeleteConfirmed) {
      setSaveMessage({ text: 'Kérlek jelöld be az elfogadó négyzetet!', type: 'error' });
      return;
    }

    if (!confirm('VIGYÁZAT! Biztosan és végérvényesen törölni szeretnéd a fiókodat?')) return;
    
    setIsSaving(true);
    try {
      await axios.delete('/api/profile/delete');
      await signOut({ callbackUrl: '/' });
    } catch (error: any) {
      setSaveMessage({ text: 'Hiba történt a fiók törlése során.', type: 'error' });
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-[#0a0a0a] min-h-screen">
      {/* Hero */}
      <div className="bg-[#269984] py-12 md:py-20 px-6 sm:px-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-montserrat font-black text-3xl sm:text-4xl lg:text-5xl text-white mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            Account Settings
          </h1>
          <p className="font-montserrat text-white/80 text-base sm:text-lg max-w-2xl">
            Kezeld a profilodat, biztonsági beállításaidat és regisztrációs adataidat egy helyen.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 sm:px-12 py-10 md:py-16">
        <div className="flex flex-col lg:flex-row gap-10 md:gap-16">
          {/* Sidebar Nav */}
          <div className="w-full lg:w-64 flex-shrink-0">
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible no-scrollbar gap-2 pb-4 lg:pb-0 sticky top-24">
              {sidebarLinks
                .filter(link => {
                  if (link.key === 'password' && user.authProvider && user.authProvider !== 'email') {
                    return false;
                  }
                  return true;
                })
                .map((link) => (
                  <button
                    key={link.key}
                    onClick={() => {
                      setActiveTab(link.key);
                      setSaveMessage({ text: '', type: '' });
                    }}
                    className={`flex-shrink-0 lg:w-full text-left px-5 py-3.5 rounded-xl font-montserrat font-bold text-sm transition-all duration-300 ${
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
                    className="flex items-center justify-center rounded-full font-montserrat font-bold text-white w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-4xl flex-shrink-0 uppercase overflow-hidden"
                    style={{ backgroundColor: '#269984' }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="text-center sm:text-left">
                    <h3 className="font-montserrat font-bold text-xl sm:text-2xl text-black dark:text-white">
                      {fullName}
                    </h3>
                    <p className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400">
                      {user.email}
                    </p>
                    <p className="font-montserrat mt-2 text-xs sm:text-sm text-[#999] dark:text-gray-500">
                      Created: {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="p-5 sm:p-6 rounded-xl border-2 border-[#F0F0F0] dark:border-white/10">
                  <h4 className="font-montserrat font-bold text-base sm:text-lg text-black dark:text-white mb-3">
                    Bio
                  </h4>
                  <p className="font-montserrat text-sm sm:text-base text-[#666] dark:text-gray-400 leading-relaxed">
                    {bio || 'Nincs megadva biográfia.'}
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
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={isSaving}
                    className="font-montserrat font-bold text-white h-12 px-8 rounded-lg text-base hover:opacity-90 transition-all cursor-pointer bg-[#269984] disabled:opacity-50"
                  >
                    {isSaving ? 'Mentés...' : 'Save Changes'}
                  </button>

                  {saveMessage.text && (
                    <p className={`text-sm mt-3 ${saveMessage.type === 'success' ? 'text-[#269984]' : 'text-red-500'}`}>
                      {saveMessage.text}
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'password' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-black dark:text-white mb-6 md:mb-8">
                  Security
                </h2>
                {user.authProvider && user.authProvider !== 'email' ? (
                  <div className="p-6 sm:p-8 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/20 max-w-2xl">
                    <h3 className="font-montserrat font-bold text-lg text-blue-800 dark:text-blue-400 mb-3">
                      Social Login
                    </h3>
                    <p className="font-montserrat text-sm sm:text-base text-blue-700 dark:text-blue-300/80 leading-relaxed">
                      Jelenleg a(z) <strong className="uppercase">{user.authProvider}</strong> szolgáltatóval vagy bejelentkezve. A jelszavadat a szolgáltató oldalán tudod módosítani.
                    </p>
                  </div>
                ) : (
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
                    <button 
                      onClick={handleUpdatePassword}
                      disabled={isSaving}
                      className="font-montserrat font-bold text-white h-12 px-8 rounded-lg text-base hover:opacity-90 transition-all cursor-pointer bg-[#269984] disabled:opacity-50"
                    >
                      {isSaving ? 'Jelszó mentése...' : 'Update Password'}
                    </button>
                    {saveMessage.text && (
                      <p className={`text-sm mt-3 ${saveMessage.type === 'success' ? 'text-[#269984]' : 'text-red-500'}`}>
                        {saveMessage.text}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}


            {activeTab === 'delete' && (
              <div>
                <h2 className="font-montserrat font-bold text-xl sm:text-2xl lg:text-3xl text-red-600 mb-6 md:mb-8">
                  Veszélyzóna: Fiók törlése
                </h2>
                <div className="p-6 sm:p-8 rounded-2xl bg-red-50 dark:bg-red-900/10 border-2 border-red-200 dark:border-red-900/30 max-w-2xl">
                  <div className="flex items-center gap-3 mb-4 text-red-600">
                    <AlertTriangle className="w-8 h-8" />
                    <h3 className="font-montserrat font-black text-xl">
                      FIGYELEM! A művelet nem vonható vissza.
                    </h3>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="font-montserrat text-sm sm:text-base text-red-700 dark:text-red-300 leading-relaxed uppercase font-bold">
                       A fiókod törlésével minden adatod véglegesen megsemmisül!
                    </p>
                    <ul className="list-disc list-inside font-montserrat text-sm text-red-600/80 dark:text-red-400/80 space-y-1 ml-2">
                       <li>Minden vásárolt kurzusod elveszik</li>
                       <li>Minden elért pontod és jelvényed törlődik</li>
                       <li>A statisztikáid megsemmisülnek</li>
                       <li>Profilod és elért eredményeid eltűnnek</li>
                    </ul>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white dark:bg-black/20 p-4 rounded-xl border border-red-200 dark:border-red-900/40">
                      <p className="font-montserrat text-sm text-gray-600 dark:text-gray-400 mb-4">
                        A törlés megerősítéséhez kérlek írd be ide az e-mail címedet: <strong className="text-black dark:text-white select-all">{user.email}</strong>
                      </p>
                      <input
                        type="email"
                        value={deleteConfirmation}
                        onChange={(e) => setDeleteConfirmation(e.target.value)}
                        placeholder="E-mail címed"
                        className="w-full font-montserrat h-12 border-2 border-red-100 dark:border-red-900/40 bg-white dark:bg-[#1a1a1a] dark:text-white rounded-lg px-4 text-base outline-none focus:border-red-500 transition-colors"
                      />
                    </div>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={isDeleteConfirmed}
                        onChange={(e) => setIsDeleteConfirmed(e.target.checked)}
                        className="mt-1 w-5 h-5 accent-red-600 cursor-pointer"
                      />
                      <span className="font-montserrat text-sm text-gray-700 dark:text-gray-300 group-hover:text-red-600 transition-colors">
                        Megértettem, hogy a törlés után nem állítható vissza a fiókom és az összes haladásom elveszik.
                      </span>
                    </label>

                    <div>
                      <button 
                        onClick={handleDeleteAccount}
                        disabled={isSaving || deleteConfirmation !== user.email || !isDeleteConfirmed}
                        className="w-full sm:w-auto font-montserrat font-black text-white h-14 px-10 rounded-xl text-lg hover:bg-red-700 focus:ring-4 focus:ring-red-200 transition-all cursor-pointer bg-red-600 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-red-200 dark:shadow-none"
                      >
                        {isSaving ? 'Fiók törlése folyamatban...' : 'FIÓK VÉGLEGES TÖRLÉSE'}
                      </button>
                      
                      {saveMessage.text && saveMessage.type === 'error' && (
                        <p className="text-red-600 font-bold text-sm mt-4 animate-bounce">
                          {saveMessage.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
