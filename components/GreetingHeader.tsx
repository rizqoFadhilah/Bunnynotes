'use client';

import { Rabbit } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { useState, useEffect } from 'react';
import { getProfile } from '@/lib/api';

export default function GreetingHeader() {
  const { user } = useAuth();
  const [name, setName] = useState('Bunda');

  useEffect(() => {
    async function loadProfile() {
      if (user) {
        const profile = await getProfile(user.id);
        if (profile?.full_name) {
          setName(profile.full_name);
        } else if (user.user_metadata?.full_name) {
          setName(user.user_metadata.full_name);
        }
      }
    }
    loadProfile();
  }, [user]);

  const today = new Date();
  const greetings = [
    {
      title: `Halo, ${name} 🌸`,
      message: "Semangat hari ini! Bunda hebat banget udah urus semuanya. Yuk, cek catatan kita bareng-bareng! ✨"
    },
    {
      title: `Pagi yang Indah, ${name} ☀️`,
      message: "Jangan lupa luangkan waktu sebentar buat tarik napas dan minum teh hangat ya, Bun. You're doing great! ☕"
    },
    {
      title: `Siap Beraksi, ${name}? 🚀`,
      message: "Hari baru, semangat baru! Tabungan dan rencana Bunda udah nungguin nih. Ayo kita cek perkembangannya! 💖"
    },
    {
      title: `${name} Luar Biasa! 🌟`,
      message: "Setiap senyum dan usaha Bunda sangat berharga buat keluarga. Jangan lupa apresiasi diri sendiri ya hari ini! 🐰"
    },
    {
      title: `Hai ${name} Sayang 💕`,
      message: "Semoga harinya lancar dan penuh berkah. Kalau lagi capek, istirahat sebentar nggak apa-apa kok. Peluk jauh! 🦋"
    }
  ];
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const randomGreeting = greetings[dayOfYear % greetings.length];

  return (
    <section className="relative bg-surface-container-lowest rounded-xl p-[24px] soft-shadow-primary sticker-shadow transform rotate-1">
      <div className="absolute -top-3 left-6 w-16 h-6 washi-tape-pink transform -rotate-2"></div>
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center flex-shrink-0 border-2 border-white sticker-shadow transform -rotate-6">
          <Rabbit className="w-10 h-10 text-primary-fixed" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-primary mb-1">{randomGreeting.title}</h2>
          <p className="text-sm text-on-surface-variant font-medium">{randomGreeting.message}</p>
          <p className="text-xs font-semibold text-outline mt-2 opacity-70">
            {today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>
    </section>
  );
}
