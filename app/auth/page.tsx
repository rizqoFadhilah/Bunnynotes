'use client';

import { useState } from 'react';
import { supabase } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Rabbit, Star, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        });
        if (error) throw error;
        alert('Cek email Bunda untuk konfirmasi ya! ✨');
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Decorative Stars */}
      <Star className="absolute top-10 left-10 text-primary-container opacity-50 rotate-12 w-8 h-8" fill="currentColor" />
      <Star className="absolute bottom-20 right-10 text-secondary-container opacity-50 -rotate-12 w-6 h-6" fill="currentColor" />
      
      <main className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-8 sticker-shadow relative z-10">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 washi-tape-pink -rotate-2"></div>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mb-4 sticker-shadow">
            <Rabbit className="w-12 h-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary tracking-tight">
            {isLogin ? 'Selamat Datang, Bunda! 🌸' : 'Gabung Bersama Kami 🐰'}
          </h1>
          <p className="text-on-surface-variant text-center mt-2">
            {isLogin ? 'Yuk masuk untuk atur rumah jadi lebih rapi!' : 'Buat akun untuk mulai perjalanan Bunda!'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-on-surface-variant ml-1">Nama Bunda</label>
              <input
                type="text"
                placeholder="Contoh: Bunda Rina"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-medium border-2 border-transparent focus:border-primary outline-none transition-all"
                required={!isLogin}
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Email</label>
            <input
              type="email"
              placeholder="bunda@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-medium border-2 border-transparent focus:border-primary outline-none transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-on-surface-variant ml-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 font-medium border-2 border-transparent focus:border-primary outline-none transition-all"
              required
            />
          </div>

          {error && (
            <p className="text-error text-xs font-bold text-center bg-error-container p-3 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-on-primary py-4 rounded-full font-bold text-lg shadow-[0_6px_0_0_#663a43] hover:translate-y-1 hover:shadow-[0_4px_0_0_#663a43] active:translate-y-2 active:shadow-none transition-all flex justify-center items-center gap-2 group"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Masuk Sekarang' : 'Daftar Akun'}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-dashed border-outline-variant text-center">
          <p className="text-on-surface-variant text-sm font-medium">
            {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-bold ml-2 underline decoration-primary/30 underline-offset-4"
            >
              {isLogin ? 'Daftar Di Sini' : 'Masuk Sekarang'}
            </button>
          </p>
        </div>
      </main>

      <Link href="/onboarding" className="mt-8 text-on-surface-variant text-sm font-bold hover:text-primary transition-colors">
        ← Kembali ke Awal
      </Link>
    </div>
  );
}
