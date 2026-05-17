'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Pin, HelpCircle, ChevronLeft, ChevronRight, Filter, X, Trash2, Loader2 } from 'lucide-react';
import { Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingBag, Briefcase, Heart, Smile } from 'lucide-react';
import { deleteTransaction } from '@/lib/api';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip as RechartsTooltip 
} from 'recharts';

const ICON_MAP: Record<string, any> = {
  Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingBag, Briefcase, Heart, Smile
};

export default function MoneyDashboard({ transactions, categories }: { transactions: any[], categories: any[] }) {
  const router = useRouter();
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  const [offset, setOffset] = useState(0); 
  
  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);
  
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterDate, setFilterDate] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // DATE LOGIC
  const { startDate, endDate, labels, periodTitle } = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    let labels: string[] = [];
    let periodTitle = '';

    if (timeRange === 'week') {
      const baseDate = new Date();
      baseDate.setDate(now.getDate() + (offset * 7));
      let dayOfWeek = baseDate.getDay();
      if (dayOfWeek === 0) dayOfWeek = 7;
      
      start = new Date(baseDate);
      start.setDate(baseDate.getDate() - dayOfWeek + 1);
      start.setHours(0, 0, 0, 0);
      
      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      labels = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      periodTitle = `${start.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}`;
    } else if (timeRange === 'month') {
      start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
      end.setHours(23, 59, 59, 999);
      
      labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
      periodTitle = start.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    } else {
      start = new Date(now.getFullYear() + offset, 0, 1);
      end = new Date(now.getFullYear() + offset, 11, 31, 23, 59, 59, 999);
      
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      periodTitle = start.getFullYear().toString();
    }

    return { startDate: start, endDate: end, labels, periodTitle };
  }, [timeRange, offset]);

  const aggregatedSpending = useMemo(() => {
    let data: number[] = new Array(labels.length).fill(0);
    
    localTransactions.forEach((t: any) => {
      if (t.Tipe === 'Expense') {
        const tDate = new Date(t.Tanggal);
        if (tDate >= startDate && tDate <= endDate) {
          if (timeRange === 'week') {
            let day = tDate.getDay();
            if (day === 0) day = 7;
            data[day - 1] += Number(t.Nominal) || 0;
          } else if (timeRange === 'month') {
            const date = tDate.getDate();
            const weekIndex = Math.floor((date - 1) / 7);
            data[Math.min(weekIndex, 4)] += Number(t.Nominal) || 0;
          } else {
            const month = tDate.getMonth();
            data[month] += Number(t.Nominal) || 0;
          }
        }
      }
    });
    return data;
  }, [localTransactions, startDate, endDate, timeRange, labels.length]);

  const totalPeriodSpending = useMemo(() => 
    aggregatedSpending.reduce((sum, amount) => sum + amount, 0),
  [aggregatedSpending]);

  const maxSpending = useMemo(() => Math.max(...aggregatedSpending, 1), [aggregatedSpending]);

  const categoryData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    localTransactions.forEach((t: any) => {
      const tDate = new Date(t.Tanggal);
      if (t.Tipe === 'Expense' && tDate >= startDate && tDate <= endDate) {
        const catId = t.Kategori;
        const category = categories.find(c => c.ID === catId || c.Nama === catId);
        const label = category ? category.Nama : 'Lainnya';
        dataMap[label] = (dataMap[label] || 0) + (Number(t.Nominal) || 0);
      }
    });
    
    return Object.entries(dataMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [localTransactions, startDate, endDate, categories]);

  const PIE_COLORS = [
    '#FFB2BC', // clay-pink
    '#8EE3F5', // clay-blue
    '#FFD54F', // clay-yellow
    '#FF8A65', // clay-orange
    '#7EDCC9', // clay-mint
    '#A7F3E5', // light-mint
    '#FFDDE2', // light-pink
    '#FFF1C5', // light-yellow
  ];

  const BAR_COLORS = [
    '#FFB2BC', 
    '#8EE3F5', 
    '#FFD54F', 
    '#FF8A65', 
    '#7EDCC9', 
    '#A7F3E5', 
    '#FFDDE2',
  ];

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
      router.refresh();
    } catch (e) {
      console.error(e);
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

  const formatShortValue = (value: number) => {
    if (value === 0) return '';
    return `Rp.${value.toLocaleString('id-ID')}`;
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Time Range Switcher */}
      <section className="clay-card p-2 flex items-center gap-2 [--clay-card-bg:rgba(255,255,255,0.7)] border-white/60">
        {(['week', 'month', 'year'] as const).map((range) => (
          <button
            key={range}
            onClick={() => {
              setTimeRange(range);
              setOffset(0);
            }}
            className={clsx(
              "flex-1 py-3 text-sm font-bold capitalize transition-all",
              timeRange === range 
                ? "clay-button [--clay-btn-bg:var(--color-primary)] text-white" 
                : "text-on-surface/60 hover:text-on-surface"
            )}
          >
            {range === 'week' ? 'Minggu' : range === 'month' ? 'Bulan' : 'Tahun'}
          </button>
        ))}
      </section>

      {/* Spending Chart */}
      <section className="clay-card p-[24px] [--clay-card-bg:var(--color-surface)] border-white/60 relative mt-2 transition-transform duration-300">
        <div className="flex items-center justify-between mb-8 mt-2">
          <button onClick={() => setOffset(o => o - 1)} className="w-10 h-10 clay-icon-container text-on-surface hover:bg-surface-variant z-10 relative">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">Rp {totalPeriodSpending.toLocaleString('id-ID')}</h2>
            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest mt-1">
              {periodTitle}
            </p>
          </div>
          <button onClick={() => setOffset(o => o + 1)} disabled={offset >= 0} className={clsx("w-10 h-10 clay-icon-container z-10 relative transition-opacity", offset >= 0 ? 'opacity-20 cursor-not-allowed' : 'text-on-surface hover:bg-surface-variant')}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-end justify-between h-48 gap-2 xs:gap-3 pb-2 pt-10">
          {aggregatedSpending.map((amount, idx) => {
            const heightPercent = maxSpending > 1 ? Math.max((amount / maxSpending) * 100, 8) : 8;
            
            return (
              <div key={idx} className="w-full flex flex-col justify-end items-center group h-full relative">
                {amount > 0 && (
                  <div className="absolute -top-16 text-on-surface text-[10px] font-bold px-1 whitespace-nowrap pointer-events-none transform -rotate-90 origin-bottom pb-1">
                    {formatShortValue(amount)}
                  </div>
                )}
                
                <div 
                  className="w-full clay-card rounded-b-none border-0 transition-all"
                  style={{ 
                    height: `${heightPercent}%`,
                    backgroundColor: BAR_COLORS[idx % BAR_COLORS.length],
                    '--clay-shadow': 'rgba(0,0,0,0.1)',
                    '--clay-highlight': 'rgba(255,255,255,0.4)',
                    borderBottomLeftRadius: '0',
                    borderBottomRightRadius: '0'
                  } as any}
                >
                </div>
                <span className="text-[10px] font-bold mt-2 text-on-surface-variant uppercase">{labels[idx]}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Expense by Category Pie Chart */}
      {categoryData.length > 0 && (
        <section className="clay-card p-[24px] [--clay-card-bg:var(--color-surface)] border-white/60 relative mt-2 transition-transform duration-300">
          <h2 className="text-xl font-bold text-on-surface mb-4 tracking-tight">Kategori Terpopuler</h2>
          
          <div className="h-64 mt-2 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 20, right: 40, bottom: 20, left: 40 }}>
                <RechartsTooltip />
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={8}
                  dataKey="value"
                  animationDuration={1500}
                  label={({ name, value }) => `${name}: ${formatShortValue(value)}`}
                  labelLine={true}
                  style={{ fontSize: '10px', fontWeight: 'bold' }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(255,255,255,0.5)" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 clay-card [--clay-card-bg:var(--color-tertiary-container)] border-white/60">
            <p className="text-sm font-bold text-on-tertiary-container flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" />
              {categoryData[0].name} adalah yang paling sering!
            </p>
          </div>
        </section>
      )}

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
            <div key={t.ID} className="clay-card p-4 flex items-center justify-between border-white/40 transition-transform [--clay-card-bg:var(--color-surface)]">
              <div className="flex items-center gap-4">
                <div className={clsx(
                  "w-12 h-12 clay-button flex items-center justify-center shrink-0 border-white/20",
                  t.Tipe === 'Income' ? "[--clay-btn-bg:var(--color-tertiary-container)] text-on-tertiary-container" : "[--clay-btn-bg:var(--color-primary-container)] text-on-primary-container"
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-base font-bold text-on-surface line-clamp-1">{t.Catatan || 'Tanpa Catatan'}</p>
                  <p className="text-xs font-bold text-primary/60 uppercase tracking-widest flex gap-1 mt-1">
                    <span>{isToday ? 'Hari ini' : tDate.toLocaleDateString('id-ID')}</span>
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-end shrink-0 gap-2">
                <span className={clsx(
                  "text-sm font-bold px-4 py-1 clay-button border-white/20",
                  t.Tipe === 'Income' ? "text-tertiary [--clay-btn-bg:var(--color-tertiary-container)]/30" : "text-secondary [--clay-btn-bg:var(--color-secondary-container)]"
                )}>
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
