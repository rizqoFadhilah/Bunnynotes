'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Star, ArrowDownToLine, ArrowUpFromLine, Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingBag, Briefcase, Heart, Smile, Calendar, Clock, CheckCircle2, Loader2, Plus, X, Trash2, HelpCircle, Rabbit } from 'lucide-react';
import Link from 'next/link';
import { addTransaction, getCategories, addCategory, deleteCategory } from '@/lib/api';
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
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
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
        <h1 className="text-2xl font-bold text-primary tracking-tight">New Transaction</h1>
        <div className="w-10"></div> {/* Spacer for centering */}
      </header>

      {/* Main Content Canvas */}
      <main className="pt-24 px-5 w-full max-w-md space-y-6 relative">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Decorative Sparkle */}
          <Star className="absolute top-20 right-4 text-primary-container opacity-50 rotate-12 w-8 h-8" fill="currentColor" />
          
          {/* Amount Input Card */}
          <section className="bg-surface-container rounded-xl p-[24px] shadow-[0_4px_0_0_#ffc1cc] border-2 border-white relative mt-4">
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
              Income
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
              Expense
            </button>
          </section>

          {/* Categories Sticker Grid */}
          <section className="bg-surface-container-low rounded-xl p-[24px] shadow-sm border border-outline-variant/30">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-on-surface-variant flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Category
              </h2>
              <button 
                type="button" 
                onClick={() => setShowCatModal(true)}
                className="text-xs font-bold text-primary flex items-center gap-1 bg-primary-container px-2 py-1 rounded-full border border-white shadow-sm"
              >
                <Plus className="w-3 h-3" /> Custom
              </button>
            </div>
            
            {isLoadingCats ? (
              <div className="flex justify-center p-4"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-3 gap-4">
                {activeCategories.map((cat) => {
                  const catId = cat.ID || cat.id || cat.Nama;
                  const isSelected = category === catId;
                  const SelectedIcon = ICON_MAP[cat.Icon] || HelpCircle;
                  return (
                    <button 
                      key={catId} 
                      type="button"
                      onClick={() => setCategory(catId)}
                      className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-surface-variant transition-colors group"
                    >
                      <div className={clsx(
                        "w-14 h-14 rounded-full flex items-center justify-center border-2 border-white transition-all",
                        isSelected ? 'ring-4 ring-primary bg-primary-container scale-110 shadow-none' : (cat.bgClass || 'bg-surface shadow-[0_2px_0_0_#dacefd]')
                      )}>
                        <SelectedIcon className={clsx("w-7 h-7", isSelected ? 'text-on-primary-container' : (cat.colorClass || 'text-secondary'))} />
                      </div>
                      <span className={clsx("text-xs font-bold truncate max-w-full px-1", isSelected ? 'text-primary' : 'text-on-surface-variant')}>{cat.Nama}</span>
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

          {/* Notes Area */}
          <section className="relative">
            <div className="absolute -top-4 -left-3 text-primary-container rotate-[-15deg]">
              <Heart className="w-8 h-8" fill="currentColor" />
            </div>
            <textarea 
              placeholder="Write a little note..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-surface-container-low rounded-xl p-4 border-2 border-white focus:border-dashed focus:border-primary focus:ring-0 text-lg text-on-surface-variant placeholder:text-on-surface-variant/50 min-h-[100px] shadow-sm resize-none outline-none"
            ></textarea>
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
                <><CheckCircle2 className="w-6 h-6" /> Save Transaction</>
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
            <h2 className="text-xl font-bold text-primary mb-4">Manage Categories</h2>
            
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
