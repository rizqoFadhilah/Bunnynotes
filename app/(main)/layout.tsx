'use client';

import BottomNav from '@/components/BottomNav';
import TopAppBar from '@/components/TopAppBar';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/api';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isAllowed } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/onboarding');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-8 text-center">
        <div className="bg-surface-container-lowest p-8 rounded-2xl sticker-shadow border-4 border-white max-w-sm">
          <h2 className="text-2xl font-bold text-primary mb-4">Akses Terbatas 🔒</h2>
          <p className="text-on-surface-variant mb-6">
            Maaf Bunda, email <strong>{user.email}</strong> belum terdaftar dalam daftar putih (whitelist) kami. 
            Silakan hubungi admin untuk mendapatkan akses ya!
          </p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="w-full bg-primary text-on-primary py-3 rounded-full font-bold shadow-sm"
          >
            Keluar (Sign Out)
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Background Decorative Clay Shapes */}
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-clay-pink/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 -right-20 w-96 h-96 bg-clay-pink/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-20 left-1/4 w-72 h-72 bg-clay-blue/20 rounded-full blur-3xl"></div>
      </div>
      <TopAppBar />
      <main className="relative z-10 pt-[100px] px-[20px] max-w-lg mx-auto space-y-8 pb-32">
        {children}
      </main>
      <BottomNav />
    </>
  );
}
