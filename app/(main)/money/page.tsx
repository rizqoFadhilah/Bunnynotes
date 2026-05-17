'use client';

import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getTransactions, getCategories } from '@/lib/api';
import MoneyDashboard from '@/components/money-dashboard';
import { useState, useEffect } from 'react';

export default function MoneyPage() {
  const [data, setData] = useState<{
    transactions: any[],
    categories: any[]
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [transactions, dbCategories] = await Promise.all([
          getTransactions(),
          getCategories()
        ]);
        setData({ transactions, categories: dbCategories || [] });
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

  const { transactions, categories } = data || { transactions: [], categories: [] };

  return (
    <>
      <div className="pt-4 pb-24">
        <MoneyDashboard transactions={transactions} categories={categories} />
      </div>
      
      {/* Floating Action Button */}
      <Link href="/money/new" className="fixed bottom-28 right-[20px] clay-button text-white text-sm font-bold px-6 py-4 flex items-center gap-2 z-40 lg:right-[calc(50vw-240px)] [--clay-btn-bg:var(--color-primary)]">
        <Plus className="w-5 h-5" />
        Tambah Transaksi
      </Link>
    </>
  );
}
