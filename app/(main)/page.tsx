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
            <Link href="/money/new" className="bg-primary-container text-on-primary-container text-sm font-bold px-4 py-2 rounded-full inline-flex items-center gap-2 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_4px_0_#81515b] active:translate-y-[2px] active:shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_0_2px_0_#81515b] transition-all">
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

      <div className="mt-8"></div>

      {/* Checklist Hari Ini */}
      <HomeChecklist initialAgendas={agendas || []} />
    </>
  );
}
