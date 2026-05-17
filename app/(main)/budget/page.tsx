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
        <section className="clay-card p-[24px] border-white/60 relative mt-4 [--clay-card-bg:var(--color-surface)]">
          <div className="text-center space-y-2 mt-2">
            <p className="text-xs font-bold text-primary/60 uppercase tracking-widest">Sisa Budget Bulan Ini</p>
            <h2 className={clsx("text-4xl font-bold tracking-tight", remainingBudget < 0 ? "text-error" : "text-primary")}>
              {formatRupiah(remainingBudget)}
            </h2>
            <div className={clsx(
              "inline-flex items-center gap-1.5 px-4 py-2 clay-button mt-4 border-white/20",
              remainingBudget < 0 ? "[--clay-btn-bg:var(--color-secondary-container)] text-on-secondary-container" : "[--clay-btn-bg:var(--color-tertiary-container)] text-on-tertiary-container"
            )}>
              {remainingBudget < 0 ? <TriangleAlert className="w-5 h-5" /> : <Smile className="w-5 h-5" />}
              <span className="font-bold">{remainingBudget < 0 ? "Overbudget nih, Bunda!" : "Masih aman, Bunda!"}</span>
            </div>
            <p className="text-sm font-bold text-on-surface-variant opacity-60 mt-4 underline decoration-dashed underline-offset-4 decoration-primary/20">Total Budget Set: {formatRupiah(totalBudget)}</p>
          </div>
        </section>

        {/* Categories Section */}
        <section className="space-y-4 relative mt-8 pb-32">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-6 h-6 text-secondary fill-current" />
            <h3 className="text-2xl font-bold text-on-surface">Rincian Budget</h3>
          </div>

          {activeCategories.length === 0 ? (
            <div className="text-center p-12 clay-card border-white/40 [--clay-card-bg:rgba(255,255,255,0.3)] mt-4">
              <p className="text-on-surface-variant font-bold mb-2">Belum ada aktivitas bulan ini.</p>
              <p className="text-sm font-medium opacity-60">Catat pemasukan atau pengeluaran pertamamu!</p>
            </div>
          ) : (
            activeCategories.map((catKey: string) => {
              const catDetails = getCategoryDetails(catKey);
              const CatIcon = ICON_MAP[catDetails.Icon] || HelpCircle;
              const nominal = budgetByCategory[catKey] || 0;
              const expense = expenseByCategory[catKey] || 0;
              
              const percentRemaining = nominal > 0 ? Math.max(0, ((nominal - expense) / nominal) * 100) : 0;
              const isWarning = (100 - percentRemaining) >= 85 && (100 - percentRemaining) < 100;
              const isOver = (100 - percentRemaining) >= 100 && expense > nominal;

              return (
                <div key={catKey} className={clsx(
                  "clay-card p-[20px] transition-all [--clay-card-bg:var(--color-surface)] border-white/60",
                  isOver && "ring-4 ring-error/20"
                )}>
                  <DeleteBudgetButton budgetIds={budgetIdsByCategory[catKey] || []} />
                  
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className={clsx(
                        "w-12 h-12 clay-icon-container shrink-0 [--clay-icon-bg:var(--color-primary-container)] border-white/40",
                        catDetails.bgClass
                      )}>
                        <CatIcon className={clsx("w-6 h-6", catDetails.colorClass || "text-on-primary-container")} />
                      </div>
                      <span className="text-base font-bold text-on-surface tracking-tight">{catDetails.Nama}</span>
                    </div>
                    <div className={clsx(
                      "px-4 py-1 clay-button text-[12px] font-bold border-white/40",
                      isOver ? "[--clay-btn-bg:var(--color-secondary)] text-white" : isWarning ? "[--clay-btn-bg:var(--color-secondary-container)] text-on-secondary-container" : "[--clay-btn-bg:var(--color-tertiary-container)] text-on-tertiary-container"
                    )}>
                      {Math.ceil(percentRemaining)}% Sisa
                    </div>
                  </div>
                  <div className={clsx(
                    "h-8 w-full clay-card rounded-full overflow-hidden relative border-0 p-0",
                    isOver ? "[--clay-card-bg:var(--color-surface-container-high)]" : "[--clay-card-bg:var(--color-surface-container-low)]"
                  )}>
                    <div 
                      className={clsx(
                        "absolute top-0 left-0 h-full transition-all duration-1000 ease-out clay-card rounded-full border-0",
                        isOver ? "[--clay-card-bg:var(--color-secondary)]" : isWarning ? "[--clay-card-bg:var(--color-secondary)]" : "[--clay-card-bg:var(--color-primary)]"
                      )}
                      style={{ width: `${percentRemaining}%`, borderRadius: '100px' } as any}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-primary/40 uppercase tracking-widest mt-4">
                    <span>🔥 Terpakai {formatRupiah(expense)}</span>
                    <span>🎯 Target {formatRupiah(nominal)}</span>
                  </div>
                </div>
              );
            })
          )}

        </section>

        {/* Floating Action Button */}
        <Link href="/budget/new" className="fixed bottom-28 right-[20px] lg:right-[calc(50vw-240px)] z-40 clay-button text-white px-6 py-4 transition-all duration-150 flex items-center gap-2 [--clay-btn-bg:var(--color-primary)]">
          <Plus className="w-6 h-6" strokeWidth={3} />
          <span className="text-lg font-bold tracking-tight">Set Budget</span>
          <span className="text-xl ml-1 leading-none">🎯</span>
        </Link>
      </div>
    </>
  );
}
