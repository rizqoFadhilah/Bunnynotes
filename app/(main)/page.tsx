'use client';

import { Plus, Wallet, CreditCard, Leaf, Rabbit, MoreVertical, Check, Circle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getTransactions, getBudgets, getCategories, getAgendas } from '@/lib/api';
import HomeChecklist from '@/components/home-checklist';
import GreetingHeader from '@/components/GreetingHeader';
import FloatingChatbot from '@/components/FloatingChatbot';
import { useState, useEffect } from 'react';
import { getWITDate, parseLocalDate } from '@/lib/utils';

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

  const today = getWITDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  transactions?.forEach((t: any) => {
    const nominal = parseInt(t.Nominal) || 0;
    if (t.Tipe === 'Income') {
      totalIncome += nominal;
    } else if (t.Tipe === 'Expense') {
      totalExpense += nominal;
      
      const tDate = parseLocalDate(t.Tanggal);
      if (tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear) {
        currentMonthExpense += nominal;
      }
    }
  });

  const sisaSaldo = totalIncome - totalExpense;

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
      <section className="grid grid-cols-1 md:grid-cols-2 gap-[24px]">
        {/* Saldo Card */}
        <div className="clay-card p-[24px] relative overflow-hidden [--clay-card-bg:var(--color-primary-container)]">
          <div className="absolute -right-4 -bottom-4 opacity-10 text-on-primary-container">
            <Wallet className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-on-primary-container/80">
              <Wallet className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Sisa Saldo</h3>
            </div>
            <p className="text-3xl font-bold text-on-primary-container mb-4">{formatRupiah(sisaSaldo)}</p>
            <Link href="/money/new" className="clay-button bg-white text-primary text-sm font-bold px-6 py-3 inline-flex items-center gap-2 [--clay-btn-bg:#ffffff] [--clay-btn-highlight:rgba(255,255,255,1)]">
              <Plus className="w-4 h-4" /> Tambah Transaksi
            </Link>
          </div>
        </div>

        {/* Pengeluaran Card */}
        <div className="clay-card p-[24px] relative overflow-hidden [--clay-card-bg:var(--color-secondary-container)]">
          <div className="absolute -right-4 -bottom-4 opacity-10 text-on-secondary-container">
            <CreditCard className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 text-on-secondary-container/80">
              <CreditCard className="w-5 h-5" />
              <h3 className="text-xs font-bold uppercase tracking-widest">Pengeluaran (Bulan Ini)</h3>
            </div>
            <p className="text-3xl font-bold text-on-secondary-container mb-4">{formatRupiah(currentMonthExpense)}</p>
          </div>
        </div>
      </section>

      <div className="mt-8"></div>

      {/* Checklist Hari Ini */}
      <HomeChecklist initialAgendas={agendas || []} />

      {/* Floating Chatbot */}
      <FloatingChatbot categories={categories} />
    </>
  );
}
