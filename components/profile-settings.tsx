'use client';

import { useState, useEffect } from 'react';
import { User, Save, Loader2, LogOut, Key } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase, getProfile } from '@/lib/api';
import { useAuth } from './AuthProvider';

export default function ProfileSettings() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: 'Bunda',
    email: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState('');

  useEffect(() => {
    async function loadData() {
      if (user) {
        setFormData(prev => ({ ...prev, email: user.email || '' }));
        const profile = await getProfile(user.id);
        if (profile?.full_name) {
          setFormData(prev => ({ ...prev, name: profile.full_name }));
        }
      }
      if (typeof window !== 'undefined') {
        const savedKey = localStorage.getItem('bunybot_gemini_api_key') || '';
        setGeminiApiKey(savedKey);
      }
    }
    loadData();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: formData.name });
      
      if (error) throw error;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('bunybot_gemini_api_key', geminiApiKey);
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/onboarding');
  };

  if (!user) return null;

  return (
    <div className="bg-surface-container-lowest rounded-[1.5rem] p-6 shadow-[0_4px_16px_rgba(129,81,91,0.06)] border-4 border-white mb-28">
      <div className="flex flex-col gap-4">
        
        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant ml-2">Nama Tampilan</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
              <User className="w-5 h-5" />
            </div>
            <input 
              type="text" 
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-surface py-3 pl-12 pr-4 rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-bold text-on-surface-variant ml-2">Alamat Email (Hanya Baca)</label>
          <div className="relative">
            <input 
              type="email" 
              value={formData.email}
              readOnly
              className="w-full bg-surface py-3 px-4 rounded-xl text-on-surface-variant font-medium opacity-70 cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-1 pt-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-bold text-on-surface-variant ml-2 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-primary" /> Kunci API Gemini (Lokal/Tamu)
            </label>
            <a 
              href="https://aistudio.google.com/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs font-bold text-primary hover:underline hover:text-primary-hover flex items-center pr-2"
            >
              Dapatkan Kunci Gratis 🔑
            </a>
          </div>
          <div className="relative">
            <input 
              type="password" 
              name="geminiApiKey"
              placeholder="Masukkan Kunci API Gemini Bunda..." 
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="w-full bg-surface py-3 px-4 rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all shadow-inner placeholder:text-on-surface-variant/40 text-xs md:text-sm"
            />
          </div>
          <p className="text-[11px] leading-relaxed text-on-surface-variant/70 px-2 pt-1">
            * Khusus pengguna baru/tamu: Supaya fitur chat & rekaman suara BunyBot dapat bekerja otomatis, masukkan Kunci API Gemini Bunda yang didapatkan gratis dari Google. Kunci ini hanya disimpan aman di memori perangkat/browser Bunda sendiri! ❤️
          </p>
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="mt-4 w-full bg-primary text-on-primary font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm active:scale-[0.98]"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Menyimpan...
            </>
          ) : saveSuccess ? (
            <>
              Tersimpan! ✨
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Simpan Pengaturan
            </>
          )}
        </button>

        <button 
          onClick={handleLogout}
          className="mt-4 w-full bg-error-container text-on-error-container font-bold py-4 rounded-xl flex justify-center items-center gap-2 hover:bg-error-container/90 transition-colors shadow-sm"
        >
          <LogOut className="w-5 h-5" />
          Keluar (Sign Out)
        </button>

      </div>
    </div>
  );
}
