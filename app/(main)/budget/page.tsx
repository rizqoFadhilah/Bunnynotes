'use client';

import { Sparkles, Smile, TriangleAlert, ShoppingCart, Baby, Plus, HelpCircle, Utensils, Home, Car, PiggyBank, Briefcase, Heart, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getBudgets, getTransactions, getCategories } from '@/lib/api';
import clsx from 'clsx';
import { useState, useEffect } from 'react';

import DeleteBudgetButton from '@/components/delete-budget-button';

const ICON_MAP: Record<string, any> = {
  Utensils, Home, Baby, Sparkles, Car, PiggyBank, ShoppingCart, Briefcase, Heart, Smile
};

export default function BudgetPage() {
  const [data, setData] = useState<{
    budgets: any[],
    transactions: any[],
    categories: any[]
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [budgets, transactions, categories] = await Promise.all([
          getBudgets(),
          getTransactions(),
          getCategories()
        ]);
        setData({ budgets, transactions, categories });
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

  const { budgets, transactions, categories } = data || { budgets: [], transactions: [], categories: [] };

  const today = new Date();
  const currentMonth = (today.getMonth() + 1).toString();
  const currentYear = today.getFullYear().toString();

  // Find total budget and expenses
  let totalBudget = 0;
  let totalExpenseThisMonth = 0;

  const budgetByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};
  const budgetIdsByCategory: Record<string, string[]> = {};

  budgets?.forEach((b: any) => {
    let bMonth = currentMonth;
    let bYear = currentYear;
    
    // Budgets might have Timestamp
    if (b.Timestamp) {
        const bDate = new Date(b.Timestamp);
        if (!isNaN(bDate.getTime())) {
            bMonth = (bDate.getMonth() + 1).toString();
            bYear = bDate.getFullYear().toString();
        }
    }
    
    // Also support "Periode" if populated logic needed
    if (bMonth === currentMonth && bYear === currentYear) {
      const nominal = parseInt(b.Nominal) || 0;
      if (!budgetByCategory[b.Kategori]) {
        budgetByCategory[b.Kategori] = 0;
        budgetIdsByCategory[b.Kategori] = [];
      }
      budgetByCategory[b.Kategori] += nominal;
      
      const id = b.ID || b.id;
      if (id) budgetIdsByCategory[b.Kategori].push(id);
      
      totalBudget += nominal;
    }
  });

  transactions?.forEach((t: any) => {
    const tDate = new Date(t.Tanggal);
    if ((tDate.getMonth() + 1).toString() === currentMonth && tDate.getFullYear().toString() === currentYear) {
      const nominal = parseInt(t.Nominal) || 0;
      
      if (t.Tipe === 'Expense') {
        if (!expenseByCategory[t.Kategori]) {
          expenseByCategory[t.Kategori] = 0;
        }
        expenseByCategory[t.Kategori] += nominal;
        totalExpenseThisMonth += nominal;
      }
    }
  });

  const remainingBudget = totalBudget - totalExpenseThisMonth;

  // We only show progress for categories that either have a budget (income) or have expenses
  const activeCategories = Array.from(new Set([...Object.keys(budgetByCategory), ...Object.keys(expenseByCategory)]));

  const formatRupiah = (angka: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(angka);
  };

  const getCategoryDetails = (catId: string) => {
    if (!categories || categories.length === 0) return { Nama: catId, Icon: 'Sparkles', colorClass: 'text-primary' };
    const cat = categories.find((c: any) => c.ID === catId || c.Nama === catId);
    return cat ? cat : { Nama: catId, Icon: 'Sparkles', colorClass: 'text-primary' };
  };

  return (
    <>
      <div className="relative">
        {/* Decorative Floating Elements */}
        <div className="absolute top-10 left-4 text-tertiary opacity-40 rotate-12 pointer-events-none">
          <Sparkles className="w-8 h-8 fill-current" />
        </div>

        {/* Summary Polaroid Card */}
        <section className="bg-surface-container-lowest p-[24px] rounded-xl ring-4 ring-white shadow-[0_8px_16px_rgba(129,81,91,0.06)] relative mt-4">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-6 bg-secondary-fixed-dim/40 backdrop-blur-sm -rotate-2 border-x-2 border-secondary-fixed-dim/50 shadow-sm z-10 washi-tape-purple"></div>
          
          <div className="text-center space-y-2 mt-2">
            <p className="text-sm font-bold text-on-surface-variant uppercase tracking-widest">Sisa Budget Bulan Ini</p>
            <h2 className={clsx("text-4xl font-bold", remainingBudget < 0 ? "text-error" : "text-primary")}>
              {formatRupiah(remainingBudget)}
            </h2>
            <div className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold mt-2",
              remainingBudget < 0 ? "bg-error-container text-on-error-container" : "bg-tertiary-container text-on-tertiary-container"
            )}>
              {remainingBudget < 0 ? <TriangleAlert className="w-4 h-4" /> : <Smile className="w-4 h-4" />}
              <span>{remainingBudget < 0 ? "Overbudget nih, Bunda!" : "Masih aman, Bunda!"}</span>
            </div>
            <p className="text-sm text-on-surface-variant mt-2 font-medium">Total Budget Set: {formatRupiah(totalBudget)}</p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="space-y-4 relative mt-8 pb-32">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-secondary fill-current" />
            <h3 className="text-2xl font-bold text-on-surface">Rincian Budget</h3>
          </div>

          {activeCategories.length === 0 ? (
            <div className="text-center p-8 bg-surface-container-lowest rounded-xl ring-2 ring-white shadow-sm mt-4">
              <p className="text-on-surface-variant mb-2">Belum ada aktivitas bulan ini.</p>
              <p className="text-sm">Catat pemasukan atau pengeluaran pertamamu!</p>
            </div>
          ) : (
            activeCategories.map((catKey: string) => {
              const catDetails = getCategoryDetails(catKey);
              const CatIcon = ICON_MAP[catDetails.Icon] || HelpCircle;
              const nominal = budgetByCategory[catKey] || 0;
              const expense = expenseByCategory[catKey] || 0;
              
              const percentUsed = nominal > 0 ? (expense / nominal) * 100 : (expense > 0 ? 100 : 0);
              const percentRemaining = nominal > 0 ? Math.max(0, ((nominal - expense) / nominal) * 100) : 0;
              const isWarning = percentUsed >= 85 && percentUsed < 100;
              const isOver = percentUsed >= 100 && expense > nominal;

              return (
                <div key={catKey} className={clsx(
                  "bg-surface-container-lowest p-[16px] rounded-lg shadow-[0_4px_10px_rgba(129,81,91,0.04)] ring-2 relative group",
                  isOver ? "ring-error-container/50" : "ring-white/50"
                )}>
                  <DeleteBudgetButton budgetIds={budgetIdsByCategory[catKey] || []} />
                  {isWarning && !isOver && (
                    <div className="absolute -right-2 -top-4 bg-white text-error text-[10px] font-bold px-2 py-1 rounded-lg rotate-[15deg] ring-2 ring-error shadow-[2px_2px_0_0_#ba1a1a] z-10 flex items-center gap-1">
                      Hampir Habis!
                    </div>
                  )}
                  {isOver && (
                    <div className="absolute -right-2 -top-4 bg-error text-white text-[10px] font-bold px-2 py-1 rounded-lg rotate-[15deg] ring-2 ring-error shadow-[2px_2px_0_0_#ba1a1a] z-10 flex items-center gap-1">
                      Overbudget!
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3 text-on-surface">
                      <div className={clsx(
                        "w-10 h-10 rounded-full flex items-center justify-center shadow-sm",
                        catDetails.bgClass || "bg-primary-container"
                      )}>
                        <CatIcon className={clsx("w-5 h-5", catDetails.colorClass || "text-on-primary-container")} />
                      </div>
                      <span className="text-sm font-bold">{catDetails.Nama}</span>
                    </div>
                    <div className={clsx(
                      "px-3 py-1 rounded-full text-[12px] font-bold shadow-sm border border-white",
                      isOver ? "bg-error text-white" : isWarning ? "bg-error-container text-on-error-container" : "bg-tertiary-fixed-dim text-on-tertiary-fixed-variant"
                    )}>
                      {Math.ceil(percentRemaining)}%
                    </div>
                  </div>
                  <div className={clsx(
                    "h-6 w-full rounded-full overflow-hidden shadow-inner relative ring-1",
                    isOver ? "bg-error-container ring-error/20" : "bg-surface-variant ring-transparent"
                  )}>
                    <div 
                      className={clsx(
                        "absolute top-0 left-0 h-full rounded-full shadow-[inset_0_3px_4px_rgba(255,255,255,0.3)] transition-all duration-1000 ease-out",
                        isOver ? "bg-error" : isWarning ? "bg-error" : "bg-tertiary"
                      )}
                      style={{ width: `${percentRemaining}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[12px] text-on-surface-variant mt-2">
                    <span>Terpakai {formatRupiah(expense)}</span>
                    <span>Total {formatRupiah(nominal)}</span>
                  </div>
                </div>
              );
            })
          )}

        </section>

        {/* Floating Action Button */}
        <Link href="/budget/new" className="fixed bottom-28 right-[20px] lg:right-[calc(50vw-240px)] z-40 bg-primary-container text-on-primary-container px-6 py-4 rounded-full shadow-[6px_6px_0_0_#81515b] ring-4 ring-white hover:scale-105 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all duration-150 flex items-center gap-2">
          <Plus className="w-6 h-6 font-bold" strokeWidth={3} />
          <span className="text-lg font-bold tracking-tight">Set Budget</span>
          <span className="text-xl ml-1">🎯</span>
        </Link>
      </div>
    </>
  );
}
