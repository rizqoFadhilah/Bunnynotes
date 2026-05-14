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
      <Link href="/money/new" className="fixed bottom-28 right-[20px] bg-primary text-on-primary text-sm font-bold px-6 py-4 rounded-full shadow-[0_8px_0_0_rgba(102,58,67,1)] flex items-center gap-2 sticker-border hover:translate-y-1 hover:shadow-[0_4px_0_0_rgba(102,58,67,1)] transition-all z-40 lg:right-[calc(50vw-240px)]">
        <Plus className="w-5 h-5" />
        Tambah Transaksi
      </Link>
    </>
  );
}
