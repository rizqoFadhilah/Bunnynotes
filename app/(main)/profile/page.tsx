'use client';

import { Flame, CheckCircle2, Heart, Star, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getTransactions, getAgendas } from '@/lib/api';
import ProfileHeader from '@/components/profile-header';
import ProfileSettings from '@/components/profile-settings';
import { useState, useEffect } from 'react';

export default function ProfilePage() {
  const [data, setData] = useState<{
    agendas: any[],
    transactions: any[]
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [agendas, transactions] = await Promise.all([
          getAgendas(),
          getTransactions(),
        ]);
        setData({ agendas, transactions });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const { agendas, transactions } = data || { agendas: [], transactions: [] };

  const completedTasks = agendas?.filter((a: any) => a.IsCompleted).length || 0;

  const activeDates = new Set<string>();

  const normalizeDateStr = (dateVal: string) => {
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return null;
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    } catch(e) {
      return null;
    }
  };

  agendas?.forEach((a: any) => {
    if (a.Date && a.IsCompleted) {
      const dateStr = normalizeDateStr(a.Date);
      if (dateStr) activeDates.add(dateStr);
    }
  });

  transactions?.forEach((t: any) => {
    if (t.Tanggal) {
      const dateStr = normalizeDateStr(t.Tanggal);
      if (dateStr) activeDates.add(dateStr);
    }
  });

  let currentStreak = 0;
  let latestDate = new Date();
  
  const todayStr = normalizeDateStr(latestDate.toISOString());
  
  let checkDate = new Date();
  let latestYesterday = new Date();
  latestYesterday.setDate(latestYesterday.getDate() - 1);
  const yesterdayStr = normalizeDateStr(latestYesterday.toISOString());

  if (todayStr && yesterdayStr) {
    if (activeDates.has(todayStr) || activeDates.has(yesterdayStr)) {
      if (!activeDates.has(todayStr)) {
        checkDate.setDate(checkDate.getDate() - 1); // Start streak counting from yesterday
      }
      
      while (true) {
        const checkStr = normalizeDateStr(checkDate.toISOString());
        if (checkStr && activeDates.has(checkStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
  }

  return (
    <>
      <ProfileHeader />

      {/* Cute Achievement Badges (Sticker Effect) */}
      <section className="mb-4 mt-8">
        <h3 className="text-2xl font-bold text-on-surface mb-4 flex items-center gap-2">
          <Star className="w-6 h-6 text-primary fill-current" />
          My Triumphs
        </h3>
        <div className="grid grid-cols-2 gap-5">
          {/* Streak Badge */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 flex flex-col items-center relative shadow-[4px_4px_0_0_#ffc1cc] ring-2 ring-white transform rotate-[-2deg] transition-transform hover:rotate-0">
            <div className="w-12 h-12 rounded-full bg-primary-fixed flex items-center justify-center mb-3 text-primary">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <span className="text-3xl font-bold text-on-primary-fixed">{currentStreak}</span>
            <span className="text-sm font-bold text-on-surface-variant text-center leading-tight">Day Streak</span>
          </div>

          {/* Tasks Badge */}
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-5 flex flex-col items-center relative shadow-[4px_4px_0_0_#dacefd] ring-2 ring-white transform rotate-[3deg] transition-transform hover:rotate-0">
            <div className="w-12 h-12 rounded-full bg-secondary-fixed flex items-center justify-center mb-3 text-secondary">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-3xl font-bold text-on-secondary-container">{completedTasks}</span>
            <span className="text-sm font-bold text-on-surface-variant text-center leading-tight">Tasks Done</span>
          </div>
        </div>
      </section>

     

      {/* Settings Menu */}
      <section className="mt-8 pb-4">
        <h3 className="text-2xl font-bold text-on-surface mb-4 pl-2">My Journal Settings</h3>
        <ProfileSettings />
      </section>
    </>
  );
}
