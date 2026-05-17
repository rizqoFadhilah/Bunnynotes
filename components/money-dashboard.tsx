'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { Pin, HelpCircle, ChevronLeft, ChevronRight, Filter, X, Trash2, Loader2, Download } from 'lucide-react';
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
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = last week, etc.
  const [isExporting, setIsExporting] = useState(false);
  
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

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  
  const dailySpending = useMemo(() => {
    const spending = [0, 0, 0, 0, 0, 0, 0];
    localTransactions.forEach((t: any) => {
      if (t.Tipe === 'Expense') {
        const tDate = new Date(t.Tanggal);
        tDate.setHours(0, 0, 0, 0);
        const diffTime = tDate.getTime() - monday.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays >= 0 && diffDays < 7) {
          spending[diffDays] += Number(t.Nominal) || 0;
        }
      }
    });
    return spending;
  }, [localTransactions, monday]);

  const totalWeeklySpending = useMemo(() => 
    dailySpending.reduce((sum, amount) => sum + amount, 0),
  [dailySpending]);

  const maxSpending = useMemo(() => Math.max(...dailySpending, 1), [dailySpending]);

  const categoryData = useMemo(() => {
    const dataMap: Record<string, number> = {};
    localTransactions.forEach((t: any) => {
      const tDate = new Date(t.Tanggal);
      tDate.setHours(0, 0, 0, 0);
      if (t.Tipe === 'Expense' && tDate >= monday && tDate <= sunday) {
        const catId = t.Kategori;
        const category = categories.find(c => c.ID === catId || c.Nama === catId);
        const label = category ? category.Nama : 'Lainnya';
        dataMap[label] = (dataMap[label] || 0) + (Number(t.Nominal) || 0);
      }
    });
    
    return Object.entries(dataMap).map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [localTransactions, monday, sunday, categories]);

  const PIE_COLORS = [
    '#F8BBD0', // Soft Pink
    '#B2EBF2', // Soft Toska
    '#E1BEE7', // Soft Purple
    '#FFF9C4', // Soft Yellow
    '#FFCCBC', // Soft Coral
    '#B3E5FC', // Soft Sky Blue
    '#C8E6C9', // Soft Mint
    '#FCE4EC', // Very Soft Pink
  ];

  const BAR_COLORS = [
    '#F8BBD0', // Soft Pink
    '#B2EBF2', // Soft Toska
    '#E1BEE7', // Soft Purple
    '#FFF9C4', // Soft Yellow
    '#FFCCBC', // Soft Coral
    '#B3E5FC', // Soft Sky Blue
    '#C8E6C9', // Soft Mint
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

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Tanggal', 'Tipe', 'Kategori', 'Nominal', 'Catatan'];
      const rows = filteredTransactions.map(t => {
        const categoryName = categories.find(c => c.ID === t.Kategori || c.Nama === t.Kategori)?.Nama || 'Lainnya';
        return [
          t.Tanggal,
          t.Tipe === 'Income' ? 'Pemasukan' : 'Pengeluaran',
          categoryName,
          t.Nominal,
          `"${(t.Catatan || '').replace(/"/g, '""')}"`
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `backup-transaksi-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
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
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 bg-surface text-on-surface rounded-full shadow-sm border border-outline-variant hover:bg-surface-variant z-10 relative">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold text-on-surface">Rp {totalWeeklySpending.toLocaleString('id-ID')}</h2>
            <p className="text-xs font-medium text-on-surface-variant">
              {monday.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} - {sunday.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setWeekOffset(o => o + 1)} disabled={weekOffset >= 0} className={`p-2 rounded-full shadow-sm border border-outline-variant z-10 relative ${weekOffset >= 0 ? 'bg-surface-variant/50 text-outline cursor-not-allowed' : 'bg-surface text-on-surface hover:bg-surface-variant'}`}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex items-end justify-between h-48 gap-2 xs:gap-3 pb-2 border-b-2 border-dashed border-outline-variant/40 pt-10">
          {dailySpending.map((amount, idx) => {
            const heightPercent = maxSpending > 1 ? Math.max((amount / maxSpending) * 100, 5) : 5;
            const isPeak = amount === maxSpending && amount > 0;
            
            return (
              <div key={idx} className="w-full flex flex-col justify-end items-center group h-full relative">
                {/* Spending info visible without hover */}
                {amount > 0 && (
                  <div className="absolute -top-16 text-on-surface text-[9px] font-bold px-1 whitespace-nowrap pointer-events-none transform -rotate-90 origin-bottom pb-1">
                    {formatShortValue(amount)}
                  </div>
                )}
                
                <div 
                  className="w-full rounded-t-lg relative transition-all"
                  style={{ 
                    height: `${heightPercent}%`,
                    backgroundColor: BAR_COLORS[idx % BAR_COLORS.length]
                  }}
                >
                </div>
                <span className="text-[10px] xs:text-xs font-bold mt-2 text-on-surface-variant">{weekDays[idx]}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Expense by Category Pie Chart */}
      {categoryData.length > 0 && (
        <section className="bg-surface-container-lowest rounded-xl p-[24px] shadow-[0_6px_0_0_#ffd8e4] border-4 border-white relative mt-2 transform -rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="absolute -top-3 left-1/4 -translate-x-1/2 w-20 h-6 bg-tertiary-container/80 rotate-2 shadow-sm rounded-sm backdrop-blur-sm opacity-90 washi-tape"></div>
          
          <h2 className="text-xl font-bold text-on-surface mb-4">Pengeluaran per Kategori</h2>
          
          <div className="h-64 mt-2 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Legend layout="horizontal" align="center" verticalAlign="bottom" />
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  animationDuration={1500}
                  label={({ cx = 0, cy = 0, midAngle = 0, outerRadius = 0, value = 0 }) => {
                    const RADIAN = Math.PI / 180;
                    const radius = outerRadius + 20;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    return (
                      <text
                        x={x}
                        y={y}
                        fill="#49454f"
                        textAnchor={x > cx ? 'start' : 'end'}
                        dominantBaseline="central"
                        className="text-[10px] font-extrabold"
                      >
                        Rp.{Number(value).toLocaleString('id-ID')}
                      </text>
                    );
                  }}
                  labelLine={{ stroke: '#49454f', strokeWidth: 1 }}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="rgba(255,255,255,0.5)" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-4 bg-tertiary-container/20 rounded-lg border-2 border-white sticker-shadow">
            <p className="text-sm font-bold text-on-tertiary-container flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Kategori Terbesar: {categoryData[0].name}
            </p>
          </div>
        </section>
      )}

      {/* Transaction History (Polaroid List) */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 className="text-2xl font-bold text-on-surface pl-2">Daftar Transaksi</h2>
          
          <div className="flex flex-wrap items-center gap-2 px-2 sm:px-0">
            {/* Backup Button */}
            <button 
              onClick={exportToCSV}
              disabled={isExporting || filteredTransactions.length === 0}
              className="relative flex items-center bg-tertiary-container text-on-tertiary-container rounded-lg px-3 py-2 border-2 border-white sticker-shadow hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
            >
              {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              <span className="text-sm font-bold">Backup CSV</span>
            </button>

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
