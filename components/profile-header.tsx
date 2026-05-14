'use client';

import { useState, useEffect } from 'react';
import { Edit2, Rabbit, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { getProfile } from '@/lib/api';

export default function ProfileHeader() {
  const { user } = useAuth();
  const [name, setName] = useState('Bunda');
  const [loading, setLoading] = useState(true);

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
      setLoading(false);
    }
    loadProfile();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center relative mt-4">
      {/* Decorative subtle shape */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary-fixed/40 rounded-[3rem] rotate-12 -z-10 blur-xl"></div>
      
      <div className="relative group cursor-pointer">
        <div className="w-28 h-28 rounded-full border-4 border-white shadow-[0_8px_24px_rgba(129,81,91,0.15)] overflow-hidden bg-primary-container flex items-center justify-center">
          <Rabbit className="w-16 h-16 text-primary transform transition-transform group-hover:scale-105" strokeWidth={1.5} />
        </div>
        {/* Edit badge */}
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-surface rounded-full border-2 border-white shadow-sm flex items-center justify-center text-primary">
          <Edit2 className="w-4 h-4 fill-current" />
        </div>
      </div>
      
      <h2 className="text-3xl font-bold text-on-surface mt-4 text-center">{name}</h2>
      <p className="text-sm font-bold text-outline mt-1 bg-surface-container px-3 py-1 rounded-full">Pro Planner</p>
    </div>
  );
}
