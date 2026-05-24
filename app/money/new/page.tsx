'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, ArrowDownToLine, ArrowUpFromLine, Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingBag, Briefcase, Heart, Smile, Calendar, Clock, CheckCircle2, Loader2, Plus, X, Trash2, HelpCircle, Rabbit } from 'lucide-react';
import Link from 'next/link';
import { addTransaction, getCategories, addCategory, deleteCategory } from '@/lib/api';
import { getWITDateTime } from '@/lib/utils';
import clsx from 'clsx';
import Image from 'next/image';

const ICON_MAP: Record<string, any> = {
  Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingBag, Briefcase, Heart, Smile
};

const DEFAULT_CATEGORIES = [
  { id: 'Food', Nama: 'Food', Icon: 'Utensils', colorClass: 'text-primary', bgClass: 'bg-surface shadow-[0_2px_0_0_#ffc1cc]' },
  { id: 'Household', Nama: 'Household', Icon: 'Home', colorClass: 'text-tertiary', bgClass: 'bg-surface shadow-[0_2px_0_0_#bad9b8]' },
  { id: 'Kids', Nama: 'Kids', Icon: 'Baby', colorClass: 'text-secondary', bgClass: 'bg-surface shadow-[0_2px_0_0_#dacefd]' },
];

export default function NewTransactionPage() {
  const router = useRouter();
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('Food');
  const [date, setDate] = useState(() => getWITDateTime().dateStr);
  const [time, setTime] = useState(() => getWITDateTime().timeStr);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Categories State
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [isLoadingCats, setIsLoadingCats] = useState(true);
  
  // Modal State
  const [showCatModal, setShowCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('Sparkles');
  const [isAddingCat, setIsAddingCat] = useState(false);

  const fetchCategories = async () => {
    setIsLoadingCats(true);
    try {
      const data = await getCategories();
      if (data && data.length > 0) {
        setDbCategories(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCats(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCatName) return;
    setIsAddingCat(true);
    try {
      await addCategory({ Nama: newCatName, Icon: newCatIcon, Warna: 'text-secondary' });
      setNewCatName('');
      await fetchCategories();
    } catch (e) {
      console.error(e);
      alert('Gagal menambah kategori');
    } finally {
      setIsAddingCat(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      await fetchCategories();
      if (category === id) setCategory('Food');
    } catch (e) {
      console.error(e);
      alert('Gagal menghapus kategori');
    }
  };

  const activeCategories = dbCategories.length > 0 ? dbCategories : DEFAULT_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return alert('Nominal harus diisi!');
    
    setIsSubmitting(true);
    try {
      await addTransaction({
        Tanggal: date,
        Waktu: time,
        Tipe: type,
        Kategori: category,
        Nominal: amount,
        Catatan: notes
      });
      router.push('/money');
      router.refresh();
    } catch (error) {
      console.error(error);
      alert('Gagal menyimpan transaksi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans pb-32 flex justify-center">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-5 py-4 bg-surface/80 backdrop-blur-md border-b-2 border-dashed border-primary/20 shadow-[0_4px_0_0_rgba(129,81,91,0.1)] rounded-b-lg lg:max-w-md lg:left-1/2 lg:-translate-x-1/2">
        <Link href="/money" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:scale-105 transition-transform text-primary">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="text-xl font-bold text-primary tracking-tight">Tambah Transaksi</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 px-5 w-full max-w-md space-y-6 relative">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Decorative Sparkle */}
          <Star className="absolute top-20 right-4 text-primary-container opacity-50 rotate-12 w-8 h-8" fill="currentColor" />
          
          {/* Notes Area (Paling Atas) */}
          <section className="relative mt-2">
            <div className="absolute -top-3.5 -left-3 text-primary-container rotate-[-15deg] z-10">
              <Heart className="w-6 h-6" fill="currentColor" />
            </div>
            <input 
              type="text"
              placeholder="Nama Transaksi (misal: Bensin, Bakso, Susu Anak)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl px-4 py-3 border-2 border-white focus:border-dashed focus:border-primary focus:ring-0 text-sm font-bold text-on-surface-variant placeholder:text-on-surface-variant/50 shadow-sm outline-none"
            />
          </section>

          {/* Amount Input Card */}
          <section className="bg-surface-container rounded-xl p-[24px] shadow-[0_4px_0_0_#ffc1cc] border-2 border-white relative mt-2">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-container px-4 py-1 rounded-full text-on-primary-container text-sm font-bold shadow-sm border-2 border-white rotate-2">
              Nominal
            </div>
            <div className="flex items-center justify-center mt-4">
              <span className="text-4xl font-bold text-primary mr-2">Rp</span>
              <input 
                type="number" 
                placeholder="0" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-transparent border-none text-center text-4xl font-bold text-primary focus:ring-0 placeholder:text-primary/30 p-0 outline-none" 
              />
            </div>

            {/* Quick Helper Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-dashed border-primary/20">
              <button
                type="button"
                onClick={() => setAmount(prev => prev ? prev + '000' : '')}
                className="px-3 py-1 bg-surface hover:bg-primary-container/30 border border-primary/20 rounded-full text-xs font-bold text-primary transition-all active:scale-95 shadow-xs"
              >
                +000
              </button>
              <button
                type="button"
                onClick={() => setAmount(prev => prev ? prev + '000000' : '')}
                className="px-3 py-1 bg-surface hover:bg-primary-container/30 border border-primary/20 rounded-full text-xs font-bold text-primary transition-all active:scale-95 shadow-xs"
              >
                +Juta (000.000)
              </button>
              <button
                type="button"
                onClick={() => setAmount(prev => {
                  const current = Number(prev) || 0;
                  return String(current + 10000);
                })}
                className="px-3 py-1 bg-surface hover:bg-primary-container/30 border border-primary/20 rounded-full text-xs font-bold text-primary transition-all active:scale-95 shadow-xs"
              >
                +10k
              </button>
              <button
                type="button"
                onClick={() => setAmount(prev => {
                  const current = Number(prev) || 0;
                  return String(current + 50000);
                })}
                className="px-3 py-1 bg-surface hover:bg-primary-container/30 border border-primary/20 rounded-full text-xs font-bold text-primary transition-all active:scale-95 shadow-xs"
              >
                +50k
              </button>
              <button
                type="button"
                onClick={() => setAmount(prev => {
                  const current = Number(prev) || 0;
                  return String(current + 10000);
                })}
                className="px-3 py-1 bg-surface hover:bg-primary-container/30 border border-primary/20 rounded-full text-xs font-bold text-primary transition-all active:scale-95 shadow-xs"
              >
                +100k
              </button>
              <button
                type="button"
                onClick={() => setAmount('')}
                className="px-3 py-1 bg-error-container/20 hover:bg-error-container/40 border border-error-container text-error rounded-full text-xs font-extrabold transition-all active:scale-95 shadow-xs"
              >
                Hapus
              </button>
            </div>
          </section>

          {/* Income/Expense Toggle */}
          <section className="flex gap-4">
            <button 
              type="button"
              onClick={() => setType('Income')}
              className={clsx(
                "flex-1 text-sm font-bold py-3 rounded-full border-2 border-white transition-all flex items-center justify-center gap-2",
                type === 'Income' 
                  ? "bg-tertiary-container text-on-tertiary-container shadow-[0_4px_0_0_#bad9b8] scale-105" 
                  : "bg-surface-container text-on-surface-variant opacity-80"
              )}
            >
              <ArrowDownToLine className="w-5 h-5" />
              Pemasukan
            </button>
            <button 
              type="button"
              onClick={() => setType('Expense')}
              className={clsx(
                "flex-1 text-sm font-bold py-3 rounded-full border-2 border-white transition-all flex items-center justify-center gap-2",
                type === 'Expense' 
                  ? "bg-error-container text-on-error-container shadow-[0_4px_0_0_#ffdad6] scale-105" 
                  : "bg-surface-container text-on-surface-variant opacity-80"
              )}
            >
              <ArrowUpFromLine className="w-5 h-5" />
              Pengeluaran
            </button>
          </section>

          {/* Categories Minimalist List Items */}
          <section className="bg-surface-container-low rounded-xl p-[20px] shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Kategori
              </h2>
              <button 
                type="button" 
                onClick={() => setShowCatModal(true)}
                className="text-xs font-bold text-primary flex items-center gap-1 bg-primary-container px-2.5 py-1 rounded-full border border-white shadow-xs hover:bg-primary-container-high transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah
              </button>
            </div>
            
            {isLoadingCats ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeCategories.map((cat) => {
                  const catId = cat.ID || cat.id || cat.Nama;
                  const isSelected = category === catId;
                  const SelectedIcon = ICON_MAP[cat.Icon] || HelpCircle;
                  return (
                    <button 
                      key={catId} 
                      type="button"
                      onClick={() => setCategory(catId)}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full border-2 text-xs font-extrabold transition-all active:scale-95 cursor-pointer shadow-xs",
                        isSelected 
                          ? 'bg-primary-container text-on-primary-container border-primary scale-102' 
                          : 'bg-surface hover:bg-surface-container border-white/60 text-on-surface-variant'
                      )}
                    >
                      <SelectedIcon className={clsx("w-4 h-4", isSelected ? 'text-primary' : (cat.colorClass || 'text-secondary'))} />
                      <span>{cat.Nama}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </section>

          {/* Date & Time Washi */}
          <section className="flex gap-4">
            <div className="flex-1 washi-tape-pink bg-surface rounded-lg p-3 border-2 border-dashed border-primary/30 flex items-center justify-between -rotate-1">
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-transparent text-base text-on-surface-variant font-medium outline-none focus:ring-0 cursor-pointer" 
              />
            </div>
            <div className="flex-1 washi-tape-pink bg-surface rounded-lg p-3 border-2 border-dashed border-primary/30 flex items-center justify-between rotate-1">
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-transparent text-base text-on-surface-variant font-medium outline-none focus:ring-0 cursor-pointer" 
              />
            </div>
          </section>

          {/* Save Button */}
          <section className="pt-4 pb-8">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-primary text-on-primary text-2xl font-bold py-4 rounded-xl shadow-[0_6px_0_0_#663a43] hover:translate-y-1 hover:shadow-[0_2px_0_0_#663a43] transition-all flex items-center justify-center gap-2 border-2 border-white disabled:opacity-70 disabled:pointer-events-none"
            >
              {isSubmitting ? (
                <><Loader2 className="w-6 h-6 animate-spin" /> Menyimpan...</>
              ) : (
                <><CheckCircle2 className="w-6 h-6" /> Simpan Transaksi</>
              )}
            </button>
          </section>
        </form>
        
        {/* Mascot Decoration Optional */}
        <div className="absolute bottom-10 right-0 opacity-20 pointer-events-none">
          <Rabbit className="w-48 h-48 text-primary" strokeWidth={1} />
        </div>
      </main>

      {/* Custom Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-scrim/40 backdrop-blur-sm">
          <div className="bg-surface-container-lowest max-w-sm w-full rounded-2xl p-6 shadow-xl border-4 border-white relative max-h-[80vh] overflow-y-auto">
            <button 
              onClick={() => setShowCatModal(false)}
              className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface bg-surface-container w-8 h-8 rounded-full flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-primary mb-4">Kelola Kategori</h2>
            
            {/* Add New Category */}
            <div className="bg-surface-container-low p-4 rounded-xl border-2 border-dashed border-primary/20 mb-6">
              <h3 className="text-sm font-bold text-on-surface-variant mb-2">Buat Custom Kategori</h3>
              <input 
                type="text" 
                placeholder="Nama Kategori"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full bg-surface p-2 rounded-lg mb-3 border-2 border-transparent focus:border-primary outline-none"
              />
              <div className="flex gap-2 flex-wrap mb-4">
                {Object.keys(ICON_MAP).map(iconKey => {
                  const Icon = ICON_MAP[iconKey];
                  const isSel = newCatIcon === iconKey;
                  return (
                    <button 
                      key={iconKey}
                      onClick={() => setNewCatIcon(iconKey)}
                      className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                        isSel ? "border-primary bg-primary-container text-primary shadow-sm" : "border-transparent bg-surface text-on-surface-variant hover:bg-surface-variant"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  )
                })}
              </div>
              <button 
                onClick={handleAddCategory}
                disabled={!newCatName || isAddingCat}
                className="w-full bg-tertiary-container text-on-tertiary-container font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 border border-white shadow-sm"
              >
                {isAddingCat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4"/>}
                Tambah Kategori
              </button>
            </div>

            {/* List Categories */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-on-surface-variant mb-2">Kategori Ku</h3>
              {dbCategories.map(cat => {
                const CatIcon = ICON_MAP[cat.Icon] || HelpCircle;
                return (
                  <div key={cat.ID || cat.Nama} className="flex items-center justify-between bg-surface p-3 rounded-lg border border-white shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-primary">
                        <CatIcon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-on-surface text-sm">{cat.Nama}</span>
                    </div>
                    {cat.ID && (
                      <button 
                        onClick={() => handleDeleteCategory(cat.ID)}
                        className="text-error border border-error-container bg-error-container/20 p-2 rounded-lg hover:bg-error-container/40 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
