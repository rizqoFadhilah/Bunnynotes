'use client';

import { Plus, Wallet, CreditCard, Leaf, Rabbit, MoreVertical, Check, Circle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getTransactions, getBudgets, getCategories, getAgendas } from '@/lib/api';
import HomeChecklist from '@/components/home-checklist';
import GreetingHeader from '@/components/GreetingHeader';
import { useState, useEffect } from 'react';

export default function HomePage() {
  const [data, setData] = useState<{
    transactions: any[],
    budgets: any[],
    categories: any[],
    agendas: any[]
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [transactions, budgets, categories, agendas] = await Promise.all([
          getTransactions(),
          getBudgets(),
          getCategories(),
          getAgendas()
        ]);
        setData({ transactions, budgets, categories, agendas });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const { transactions, budgets, categories, agendas } = data || { transactions: [], budgets: [], categories: [], agendas: [] };

  let totalIncome = 0;
  let totalExpense = 0;
  let currentMonthExpense = 0;

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  transactions?.forEach((t: any) => {
    const nominal = parseInt(t.Nominal) || 0;
    if (t.Tipe === 'Income') {
      totalIncome += nominal;
    } else if (t.Tipe === 'Expense') {
      totalExpense += nominal;
      
      const tDate = new Date(t.Tanggal);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        currentMonthExpense += nominal;
      }
    }
  });

  const sisaSaldo = totalIncome - totalExpense;

  // Calculate Savings Progress
  let targetSavings = 5000000;
  let currentSavings = 3000000; // defaults initially
  let savingsLabel = 'Tabungan Liburan';

  // 1. Identify "savings" category or closest match
  const savingsCategory = categories?.find((c: any) => 
    c.Nama?.toLowerCase() === 'savings' || 
    c.Nama?.toLowerCase().includes('saving') || 
    c.Nama?.toLowerCase().includes('tabungan') || 
    c.Nama?.toLowerCase().includes('liburan')
  );

  const savingsCatId = savingsCategory?.ID || 'Savings';
  const savingsCatName = savingsCategory?.Nama || 'Savings';

  // 2. Find budget for this category
  // Try to find in active budgets first, then any budget
  const activeBudgets = budgets?.filter((b: any) => {
    if (b.Timestamp) {
      const bDate = new Date(b.Timestamp);
      return bDate.getMonth() === currentMonth && bDate.getFullYear() === currentYear;
    }
    return true; // Fallback
  }) || [];

  const foundSavingsConfig = (b: any) => {
    const k = b.Kategori?.toLowerCase() || '';
    return k === savingsCatId.toLowerCase() || 
           k === savingsCatName.toLowerCase() || 
           k.includes('saving') || 
           k.includes('tabungan') || 
           k.includes('liburan');
  };

  const savingsBudget = activeBudgets.find(foundSavingsConfig) || budgets?.find(foundSavingsConfig);

  if (savingsBudget) {
    targetSavings = parseInt(savingsBudget.Nominal) || 0;
    const catToMatchId = savingsBudget.Kategori;
    
    // label based on found category
    savingsLabel = savingsCategory ? savingsCategory.Nama : (catToMatchId.charAt(0).toUpperCase() + catToMatchId.slice(1));

    currentSavings = 0;
    // Calculate how much has been saved (Income - Expense)
    transactions?.forEach((t: any) => {
      if (t.Kategori === catToMatchId || t.Kategori === savingsCatId || t.Kategori === savingsCatName) {
        if (t.Tipe === 'Income') {
          currentSavings += parseInt(t.Nominal) || 0;
        } else if (t.Tipe === 'Expense') {
          currentSavings -= parseInt(t.Nominal) || 0;
        }
      }
    });
  }

  let savingsPercent = targetSavings > 0 ? (Math.max(0, currentSavings) / targetSavings) * 100 : 0;
  if (savingsPercent > 100) savingsPercent = 100;

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  return (
    <>
      <GreetingHeader />

      {/* Financial Summary Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
        {/* Saldo Card */}
        <div className="bg-primary-container rounded-xl p-[24px] relative overflow-hidden soft-shadow-primary sticker-shadow">
          <div className="absolute -right-4 -bottom-4 opacity-20 text-on-primary-container">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-on-primary-container">
              <Wallet className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Sisa Saldo</h3>
            </div>
            <p className="text-3xl font-bold text-on-primary-fixed mb-4">{formatRupiah(sisaSaldo)}</p>
            <Link href="/money/new" className="bg-surface-container-lowest text-primary text-sm font-bold px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_4px_0_rgba(129,81,91,0.2)] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.8),_0_2px_0_rgba(129,81,91,0.2)] transition-all">
              <Plus className="w-4 h-4" /> Tambah Transaksi
            </Link>
          </div>
        </div>

        {/* Pengeluaran Card */}
        <div className="bg-secondary-container rounded-xl p-[24px] relative overflow-hidden soft-shadow-primary sticker-shadow">
          <div className="absolute -right-4 -bottom-4 opacity-20 text-on-secondary-container">
            <CreditCard className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-on-secondary-container">
              <CreditCard className="w-5 h-5" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Pengeluaran (Bulan Ini)</h3>
            </div>
            <p className="text-3xl font-bold text-on-secondary-fixed mb-4">{formatRupiah(currentMonthExpense)}</p>
          </div>
        </div>
      </section>

      {/* Budget Progress Playful */}
      <section className="bg-tertiary-container rounded-xl p-[24px] relative soft-shadow-primary sticker-shadow transform -rotate-1">
        <div className="absolute top-0 right-8 w-12 h-4 washi-tape-purple transform rotate-3"></div>
        <h3 className="text-2xl font-bold text-on-tertiary-fixed mb-4 flex items-center gap-2">
          <Leaf className="w-6 h-6" />
          Progress {savingsLabel}
        </h3>
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-surface-container-lowest flex items-center justify-center relative border-4 border-tertiary-fixed border-dashed">
            <div className="absolute bottom-2 text-tertiary">
              <Leaf className="w-12 h-12" />
            </div>
            <div 
              className="absolute bottom-0 w-full bg-tertiary/20 rounded-b-full transition-all duration-1000"
              style={{ height: `${savingsPercent}%` }}
            ></div>
          </div>
          <div className="flex-1">
            <p className="text-lg font-medium text-on-tertiary-container mb-2">Wow, bunganya makin mekar! 🌻</p>
            <p className="text-sm font-bold text-on-tertiary-fixed opacity-70 mb-2">{formatRupiah(currentSavings)} / {formatRupiah(targetSavings)}</p>
            <div className="bg-surface-container-lowest rounded-full h-3 w-full overflow-hidden border-2 border-white sticker-shadow">
              <div 
                className="bg-tertiary h-full rounded-full relative transition-all duration-1000"
                style={{ width: `${savingsPercent}%` }}
              >
                <div className="absolute inset-0 bg-white/20 washi-tape-stripe"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Insight Note */}
      <section className="bg-surface-container-lowest p-6 rounded-lg relative soft-shadow-primary sticker-shadow rotate-2 w-3/4 mx-auto md:w-full md:mx-0 mt-8 mb-8 border border-primary/20">
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-primary-container rounded-full flex items-center justify-center border-2 border-white shadow-sm">
          <Rabbit className="w-6 h-6 text-primary" strokeWidth={2} />
        </div>
        <div className="text-center mt-2">
          <p className="text-lg text-on-surface font-medium mb-2">Pesan dari Kelinci 🐰</p>
          <p className="text-base text-on-surface-variant">Kemarin ada transaksi di toko kue 2x lho. Kurangin dikit ya Bunda biar tabungan cepet full buat beli wortel! 🥕</p>
        </div>
      </section>

      {/* Checklist Hari Ini */}
      <HomeChecklist initialAgendas={agendas || []} />
    </>
  );
}
