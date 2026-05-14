'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Pin, HelpCircle, ChevronLeft, ChevronRight, Filter, X, Trash2, Loader2 } from 'lucide-react';
import { Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingBag, Briefcase, Heart, Smile } from 'lucide-react';
import { deleteTransaction } from '@/lib/api';

const ICON_MAP: Record<string, any> = {
  Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingBag, Briefcase, Heart, Smile
};

export default function MoneyDashboard({ transactions, categories }: { transactions: any[], categories: any[] }) {
  const router = useRouter();
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  
  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);
  
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // CHART LOGIC
  const todayDate = new Date();
  todayDate.setDate(todayDate.getDate() + (weekOffset * 7));
  
  let dayOfWeek = todayDate.getDay();
  if (dayOfWeek === 0) dayOfWeek = 7; // Make Sunday 7 instead of 0
  
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - dayOfWeek + 1);
  monday.setHours(0, 0, 0, 0);
  
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const dailySpending = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun
  let totalWeeklySpending = 0;
  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  localTransactions.forEach((t: any) => {
    if (t.Tipe === 'Expense') {
      const tDate = new Date(t.Tanggal);
      tDate.setHours(0, 0, 0, 0);
      const diffTime = tDate.getTime() - monday.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays < 7) {
        const val = Number(t.Nominal) || 0;
        dailySpending[diffDays] += val;
        totalWeeklySpending += val;
      }
    }
  });

  const maxSpending = Math.max(...dailySpending, 1);
  
  // LIST LOGIC
  const filteredTransactions = useMemo(() => {
    let result = [...localTransactions];
    
    if (filterCategory !== 'All') {
      result = result.filter(t => t.Kategori === filterCategory || categories.find(c => c.ID === t.Kategori)?.Nama === filterCategory);
    }
    
    if (filterDate) {
      result = result.filter(t => t.Tanggal.startsWith(filterDate));
    }
    
    return result.sort((a, b) => {
      const dateA = new Date(a.Tanggal + 'T' + (a.Waktu || '00:00:00')).getTime();
      const dateB = new Date(b.Tanggal + 'T' + (b.Waktu || '00:00:00')).getTime();
      return dateB - dateA;
    });
  }, [localTransactions, filterCategory, filterDate, categories]);

  const handleDelete = async (id: string) => {
    setIsDeleting(id);
    setConfirmDelete(null);
    try {
      await deleteTransaction(id);
      setLocalTransactions(prev => prev.filter(t => t.ID !== id));
      router.refresh(); // Update server side as well
    } catch (e) {
      console.error(e);
      // alert('Gagal menghapus transaksi'); // Alert is blocked in iframe anyway
    } finally {
      setIsDeleting(null);
    }
  };

  const onRequestDelete = (id: string) => {
    if (confirmDelete === id) {
      handleDelete(id);
    } else {
      setConfirmDelete(id);
      setTimeout(() => {
        setConfirmDelete(curr => curr === id ? null : curr);
      }, 3000);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Weekly Spending Chart */}
      <section className="bg-surface-container-lowest rounded-xl p-[24px] shadow-[0_6px_0_0_#dacefd] border-4 border-white relative mt-2 transform rotate-1 hover:rotate-0 transition-transform duration-300">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 bg-secondary-container/80 -rotate-2 shadow-sm rounded-sm backdrop-blur-sm opacity-90 washi-tape"></div>
        <div className="absolute -top-4 right-4 text-primary rotate-12 drop-shadow-sm">
          <Pin className="w-8 h-8 fill-current" />
        </div>
        
        <div className="flex items-center justify-between mb-8 mt-2">
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 bg-surface text-on-surface rounded-full shadow-sm border border-outline-variant hover:bg-surface-variant">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-on-surface">Rp {totalWeeklySpending.toLocaleString('id-ID')}</h2>
            <p className="text-xs font-medium text-on-surface-variant">
              {monday.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - {sunday.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} className={`p-2 rounded-full shadow-sm border border-outline-variant ${weekOffset >= 0 ? 'bg-surface-variant/50 text-outline cursor-not-allowed' : 'bg-surface text-on-surface hover:bg-surface-variant'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-end justify-between h-48 gap-2 xs:gap-3 pb-2 border-b-2 border-dashed border-outline-variant/40 pt-4">
          {dailySpending.map((amount, idx) => {
            const heightPercent = maxSpending > 1 ? Math.max((amount / maxSpending) * 100, 5) : 5;
            const isPeak = amount === maxSpending && amount > 0;
            
            // Dynamic colorful classes based on index (to match the original scrapbook design)
            const colorClass = idx % 3 === 0 ? 'bg-secondary-fixed group-hover:bg-secondary-container' : 
                               idx % 3 === 1 ? 'bg-tertiary-container group-hover:bg-tertiary-fixed' : 
                                               'bg-surface-container-high group-hover:bg-primary-container';
            return (
              <div key={idx} className="w-full flex flex-col justify-end items-center group h-full relative">
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-surface-container-highest text-on-surface text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-sm z-10 whitespace-nowrap pointer-events-none">
                  Rp {amount.toLocaleString('id-ID')}
                </div>
                
                <div 
                  className={clsx("w-full rounded-t-lg relative transition-all", isPeak ? "bg-primary-container" : colorClass)}
                  style={{ height: `${heightPercent}%` }}
                >
                  {isPeak && (
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary bg-white px-1 xs:px-2 py-0.5 xs:py-1 rounded-full shadow-sm border border-primary/20">Peak</span>
                  )}
                </div>
                <span className={`text-[10px] xs:text-xs font-bold mt-2 ${isPeak ? 'text-primary' : 'text-on-surface-variant'}`}>{weekDays[idx]}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Transaction History (Polaroid List) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-on-surface pl-2">Daftar Transaksi</h2>
          
          <div className="flex flex-wrap items-center gap-2 px-2 sm:px-0">
            <div className="relative flex items-center bg-surface-container rounded-lg px-3 py-2 border-2 border-white sticker-shadow">
              <Filter className="w-4 h-4 text-on-surface-variant mr-2" />
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-sm font-medium text-on-surface outline-none appearance-none pr-4"
              >
                <option value="All">Semua Kategori</option>
                {categories.map((c: any) => (
                  <option key={c.ID} value={c.ID}>{c.Nama}</option>
                ))}
              </select>
            </div>
            
            <div className="relative flex items-center bg-surface-container rounded-lg px-3 py-2 border-2 border-white sticker-shadow">
              <input 
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="bg-transparent text-sm font-medium text-on-surface outline-none"
              />
              {filterDate && (
                <button onClick={() => setFilterDate('')} className="ml-2 text-on-surface-variant hover:text-error">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
        
        {filteredTransactions.length > 0 ? filteredTransactions.map((t: any, idx: number) => {
          const rot = idx % 2 === 0 ? 'rotate-1' : '-rotate-1';
          const category = categories.find((c: any) => c.ID === t.Kategori || c.Nama === t.Kategori);
          const Icon = category && ICON_MAP[category.Icon] ? ICON_MAP[category.Icon] : HelpCircle;
          const tDate = new Date(t.Tanggal);
          const isToday = tDate.toDateString() === new Date().toDateString();

          return (
            <div key={t.ID} className={`bg-surface-container-lowest p-4 rounded-xl shadow-[2px_4px_8px_rgba(129,81,91,0.05)] border-[3px] border-white flex items-center justify-between relative transform ${rot} hover:rotate-0 transition-transform`}>
              {idx === 0 && (
                <div className="absolute -top-2 -left-1 w-4 h-10 border-2 border-outline-variant rounded-full bg-transparent transform -rotate-12 z-10 shadow-sm"></div>
              )}
              <div className="flex items-center gap-4 pl-4 pr-2">
                <div className={`w-10 h-10 xs:w-12 xs:h-12 shrink-0 rounded-full flex items-center justify-center shadow-inner ${t.Tipe === 'Income' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary-container text-on-primary-container'}`}>
                  <Icon className="w-5 h-5 xs:w-6 xs:h-6" />
                </div>
                <div>
                  <p className="text-base xs:text-lg font-medium text-on-surface line-clamp-1">{t.Catatan || 'Tanpa Catatan'}</p>
                  <p className="text-xs xs:text-sm font-medium text-on-surface-variant flex gap-1">
                    <span>{t.Tipe === 'Income' ? 'Pemasukan' : 'Pengeluaran'}</span>
                    <span>•</span>
                    <span>{isToday ? 'Hari ini' : tDate.toLocaleDateString('id-ID')}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-2">
                <span className={`text-xs xs:text-sm font-bold px-2 xs:px-3 py-1 rounded-full ${t.Tipe === 'Income' ? 'text-tertiary bg-tertiary-container/30' : 'text-error bg-error-container/30'}`}>
                  {t.Tipe === 'Income' ? '+' : '-'} Rp {Number(t.Nominal).toLocaleString('id-ID')}
                </span>
                <button 
                  onClick={() => onRequestDelete(t.ID)} 
                  disabled={isDeleting === t.ID}
                  className={clsx(
                    "text-xs font-bold px-2 py-1 rounded-full transition-all flex items-center gap-1",
                    confirmDelete === t.ID ? "bg-error text-on-error" : "text-on-surface-variant hover:text-error bg-transparent"
                  )}
                  aria-label="Delete transaction"
                >
                  {isDeleting === t.ID ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                  {confirmDelete === t.ID && <span>Yakin?</span>}
                </button>
              </div>
            </div>
          );
        }) : (
          <div className="text-center p-8 bg-surface-container-lowest rounded-xl border-[3px] border-white shadow-sm rotate-1">
            <p className="text-on-surface-variant font-medium">Berdasarkan filter ini, tidak ada transaksi. ❤️</p>
          </div>
        )}
      </section>
    </div>
  );
}
