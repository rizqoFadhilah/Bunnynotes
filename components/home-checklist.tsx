'use client';

import { useState, useEffect } from 'react';
import { Check, MoreVertical, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { completeAgenda } from '@/lib/api';

export default function HomeChecklist({ initialAgendas }: { initialAgendas: any[] }) {
  const [isClient, setIsClient] = useState(false);
  const [agendas, setAgendas] = useState<any[]>(initialAgendas);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Filter for today
  const todayAgendas = agendas.filter((a) => {
    if (!isClient) return false;
    const dateVal = a.Timestamp || a.Date;
    if (!dateVal) return false;
    try {
      const agendaDate = new Date(dateVal);
      if (isNaN(agendaDate.getTime())) return String(dateVal).includes(dateString);
      const aDateString = `${agendaDate.getFullYear()}-${String(agendaDate.getMonth() + 1).padStart(2, '0')}-${String(agendaDate.getDate()).padStart(2, '0')}`;
      return aDateString === dateString;
    } catch (e) {
      return String(dateVal).includes(dateString);
    }
  });

  const totalCompleted = todayAgendas.filter(a => a.IsCompleted === "TRUE" || a.IsCompleted === true).length;
  const isAllCompleted = todayAgendas.length > 0 && totalCompleted === todayAgendas.length;

  const handleToggleAgenda = async (id: string) => {
    setIsToggling(id);
    try {
      // Optimistic update
      setAgendas(prev => prev.map(a => 
        a.ID === id ? { ...a, IsCompleted: (a.IsCompleted === "TRUE" || a.IsCompleted === true) ? "FALSE" : "TRUE" } : a
      ));
      await completeAgenda(id);
    } catch(e) {
      console.error(e);
      // Revert optimistic update? For now, leave it. Or could refetch.
    } finally {
      setIsToggling(null);
    }
  };

  if (!isClient) {
    return (
      <section className="clay-card p-[24px] relative border-white/40 mb-8 animate-pulse [--clay-card-bg:var(--color-surface-container-low)]">
        <h3 className="text-2xl font-bold text-primary mb-4 flex items-center gap-2">
          <div className="w-8 h-8 clay-icon-container shrink-0">
            <Check className="w-5 h-5" />
          </div>
          Checklist Hari Ini
        </h3>
        <ul className="space-y-4">
          <li className="flex items-center gap-4 clay-card p-4 [--clay-card-bg:var(--color-surface)] border-white/40">
            <div className="w-8 h-8 clay-button [--clay-btn-bg:var(--color-primary-container)]"></div>
            <div className="h-5 bg-surface-highest rounded w-3/4"></div>
          </li>
          <li className="flex items-center gap-4 clay-card p-4 [--clay-card-bg:var(--color-surface)] border-white/40">
            <div className="w-8 h-8 clay-button [--clay-btn-bg:var(--color-primary-container)]"></div>
            <div className="h-5 bg-surface-highest rounded w-1/2"></div>
          </li>
        </ul>
      </section>
    );
  }

  return (
    <>
      {/* Checklist Hari Ini */}
      <section className={clsx(
        "clay-card p-[24px] relative border-white/40 mb-8 transition-all duration-500",
        isAllCompleted ? "[--clay-card-bg:var(--color-tertiary-container)]" : "[--clay-card-bg:var(--color-surface-container-low)]"
      )}>
        <h3 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-3">
          <div className="w-10 h-10 clay-icon-container shrink-0 [--clay-icon-bg:var(--color-surface)]">
            <Check className={clsx("w-6 h-6", isAllCompleted ? "text-tertiary" : "text-primary")} />
          </div>
          Checklist Hari Ini
        </h3>
        
        <ul className="space-y-4 mb-6">
          {todayAgendas.length === 0 ? (
            <li className="text-center p-6 text-on-surface-variant text-sm font-medium clay-card [--clay-card-bg:rgba(255,255,255,0.3)]">Kosong nih bun, ayo tambah agenda!</li>
          ) : (
            todayAgendas.map((agenda) => {
              const isCompleted = agenda.IsCompleted === "TRUE" || agenda.IsCompleted === true;
              return (
                <li 
                  key={agenda.ID} 
                  onClick={() => handleToggleAgenda(agenda.ID)}
                  className="flex items-center gap-4 clay-card p-4 group cursor-pointer active:scale-95 transition-all [--clay-card-bg:var(--color-surface)] border-white/40"
                >
                  <div className={clsx(
                    "w-10 h-10 clay-button flex items-center justify-center transition-all shrink-0",
                    isCompleted ? "[--clay-btn-bg:var(--color-primary)]" : "[--clay-btn-bg:var(--color-surface-container-high)]"
                  )}>
                    {isToggling === agenda.ID ? (
                      <Loader2 className={clsx("w-5 h-5 animate-spin", isCompleted ? "text-on-primary" : "text-primary")} />
                    ) : isCompleted ? (
                      <Check className="w-5 h-5 text-white" strokeWidth={4} />
                    ) : null}
                  </div>
                  <span className={clsx("text-lg font-bold transition-all duration-300", isCompleted ? "text-outline/50 line-through" : "text-on-surface")}>
                    {agenda.Title}
                  </span>
                </li>
              );
            })
          )}
        </ul>
        
        <Link href="/planner/new" className="clay-button bg-primary text-white text-sm font-bold px-6 py-3 inline-flex items-center gap-2 w-full justify-center">
          <Plus className="w-4 h-4" /> Tambah Agenda
        </Link>
      </section>

      {/* Catatan Kecil (Sticky Note) for today */}
      <section className="clay-card p-6 bg-clay-yellow border-white/40 transform rotate-1 mt-4 mb-8 w-full [--clay-card-bg:var(--color-tertiary-container)]">
        <h3 className="text-lg text-on-tertiary-container mb-4 font-bold flex items-center gap-2">
           <span className="text-2xl">✨</span> Catatan Kecil
        </h3>
        <div className="space-y-4">
          {todayAgendas.filter(a => a.Notes).length > 0 ? (
            todayAgendas.filter(a => a.Notes).map(agenda => (
              <div key={`note-${agenda.ID}`} className="text-on-tertiary-container/80 leading-relaxed pb-4 border-b border-tertiary/20 last:border-0 last:pb-0">
                <p className="text-lg font-medium italic whitespace-pre-wrap">&quot;{agenda.Notes}&quot;</p>
              </div>
            ))
          ) : (
            <p className="text-lg text-on-tertiary-container/70 leading-relaxed font-medium">
              Tidak ada catatan tambahan untuk hari ini. Kamu hebat, Bun! ❤️
            </p>
          )}
        </div>
      </section>
    </>
  );
}
