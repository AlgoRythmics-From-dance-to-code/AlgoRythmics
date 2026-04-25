'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import Image from 'next/image';
import { Trophy, Medal, Award, User, Flame } from 'lucide-react';
import { useLocale } from '../../i18n/LocaleProvider';
import { getUserBadges, UserStats } from '../../../lib/badges';
import LoadingOverlay from '../../components/LoadingOverlay';

import { useSession } from 'next-auth/react';
import { BaseUser } from '../../../lib/types/auth';

interface LeaderboardUser {
  id: string;
  firstName: string;
  lastName: string;
  imageUrl: string | null;
  stats: UserStats;
}

export default function LeaderboardPage() {
  const { t } = useLocale();
  const { data: session } = useSession();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await axios.get('/api/leaderboard');
        setUsers(response.data.users);
      } catch (error) {
        console.error('Failed to load leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return <LoadingOverlay isVisible={true} message={t('common.loading')} />;
  }

  return (
    <div className="w-full min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] py-12 px-4 sm:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-orange-500/20 transform rotate-3">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h1 className="font-montserrat font-black text-4xl md:text-5xl text-gray-900 dark:text-white tracking-tight mb-4">
            {t('leaderboard.title')}
          </h1>
          <p className="font-montserrat text-lg text-gray-600 dark:text-gray-400 max-w-xl">
            {t('leaderboard.subtitle')}
          </p>
        </div>

        {/* Leaderboard Table/List */}
        <div className="bg-white dark:bg-[#111] rounded-[2.5rem] border border-gray-100 dark:border-neutral-800 shadow-2xl shadow-gray-200/50 dark:shadow-none overflow-hidden relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#269984] to-transparent opacity-50"></div>

          {users.length === 0 ? (
            <div className="p-12 text-center text-gray-500 font-montserrat">No data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left font-montserrat">
                <thead className="bg-gray-50 dark:bg-neutral-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest border-b border-gray-100 dark:border-neutral-800">
                  <tr>
                    <th className="px-6 py-5 font-bold text-center w-24">
                      {t('leaderboard.rank')}
                    </th>
                    <th className="px-6 py-5 font-bold">{t('leaderboard.user')}</th>
                    <th className="px-6 py-5 font-bold">{t('leaderboard.badges')}</th>
                    <th className="px-6 py-5 font-bold text-right">{t('leaderboard.xp')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-neutral-800">
                  {users.map((user, index) => {
                    const rank = index + 1;
                    const isTop3 = rank <= 3;
                    const badges = getUserBadges(user.stats);
                    const isCurrentUser =
                      session?.user && (session.user as BaseUser).id === user.id;

                    return (
                      <tr
                        key={user.id}
                        className={`group transition-colors ${
                          isCurrentUser
                            ? 'bg-[#269984]/5 dark:bg-[#269984]/10 border-l-4 border-l-[#269984]'
                            : 'hover:bg-gray-50/50 dark:hover:bg-neutral-900/30'
                        }`}
                      >
                        {/* Rank */}
                        <td className="px-6 py-5 text-center">
                          <div
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-2xl font-black text-lg ${
                              rank === 1
                                ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 shadow-lg shadow-amber-500/20'
                                : rank === 2
                                  ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300 shadow-md'
                                  : rank === 3
                                    ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 shadow-md'
                                    : 'text-gray-400 dark:text-gray-600'
                            }`}
                          >
                            {rank === 1 ? (
                              <Medal size={20} className="mr-0.5" />
                            ) : rank === 2 ? (
                              <Medal size={20} className="mr-0.5" />
                            ) : rank === 3 ? (
                              <Medal size={20} className="mr-0.5" />
                            ) : (
                              rank
                            )}
                          </div>
                        </td>

                        {/* User */}
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div
                              className={`w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-100 dark:bg-neutral-800 border-2 ${isTop3 ? 'border-[#269984] shadow-md shadow-[#269984]/20' : 'border-transparent'}`}
                            >
                              {user.imageUrl ? (
                                <Image
                                  src={user.imageUrl}
                                  alt={user.firstName}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6 text-gray-400" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span
                                className={`font-bold text-base ${isCurrentUser ? 'text-[#269984]' : 'text-gray-900 dark:text-white'}`}
                              >
                                {user.firstName} {user.lastName}
                              </span>
                              {(user.stats.longestStreak ?? 0) > 0 && (
                                <span className="text-xs font-bold text-orange-500 flex items-center gap-1 mt-0.5">
                                  <Flame size={12} /> {user.stats.longestStreak}{' '}
                                  {t('profile.public.streak')}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Badges */}
                        <td className="px-6 py-5">
                          <div className="flex flex-wrap gap-2">
                            {badges.map((badge) => (
                              <div
                                key={badge.id}
                                className={`flex items-center justify-center w-8 h-8 rounded-full border ${badge.color} cursor-help group/badge relative`}
                                title={t(badge.translationKey)}
                              >
                                <span className="text-sm">{badge.icon}</span>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover/badge:opacity-100 group-hover/badge:visible transition-all whitespace-nowrap z-10 shadow-xl pointer-events-none">
                                  {t(badge.translationKey)}
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                </div>
                              </div>
                            ))}
                            {badges.length === 0 && (
                              <span className="text-xs text-gray-400 italic">—</span>
                            )}
                          </div>
                        </td>

                        {/* XP */}
                        <td className="px-6 py-5 text-right">
                          <div className="inline-flex items-center gap-2 bg-[#269984]/10 dark:bg-[#269984]/20 px-4 py-2 rounded-xl">
                            <Award className="w-4 h-4 text-[#269984]" />
                            <span className="font-black text-[#269984] text-lg">
                              {user.stats.totalPoints || 0}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
