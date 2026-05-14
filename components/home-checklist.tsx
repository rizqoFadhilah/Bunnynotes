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
      <section className="bg-surface-container-low rounded-xl p-[24px] relative soft-shadow-primary sticker-shadow border border-surface-variant mb-8 animate-pulse">
        <div className="absolute top-4 -left-2 w-8 h-16 bg-surface-container rounded-r-lg border border-surface-variant shadow-sm flex items-center justify-center">
          <MoreVertical className="w-4 h-4 text-outline" />
        </div>
        <h3 className="text-2xl font-bold text-primary mb-4 ml-6 flex items-center gap-2">
          <Check className="w-6 h-6" />
          Checklist Hari Ini
        </h3>
        <ul className="space-y-3 ml-6">
          <li className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-lg border border-surface-variant/50">
            <div className="w-6 h-6 rounded border-2 border-primary-container bg-primary-container/20"></div>
            <div className="h-5 bg-surface-variant rounded w-3/4"></div>
          </li>
          <li className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-lg border border-surface-variant/50">
            <div className="w-6 h-6 rounded border-2 border-primary-container bg-primary-container/20"></div>
            <div className="h-5 bg-surface-variant rounded w-1/2"></div>
          </li>
        </ul>
      </section>
    );
  }

  return (
    <>
      {/* Checklist Hari Ini */}
      <section className={clsx(
        "bg-surface-container-low rounded-xl p-[24px] relative soft-shadow-primary sticker-shadow border mb-8 transition-colors duration-500",
        isAllCompleted ? "border-tertiary shadow-[0_4px_15px_rgba(50,77,52,0.1)]" : "border-surface-variant"
      )}>
        <div className="absolute top-4 -left-2 w-8 h-16 bg-surface-container rounded-r-lg border border-surface-variant shadow-sm flex items-center justify-center">
          <MoreVertical className="w-4 h-4 text-outline" />
        </div>
        <h3 className="text-2xl font-bold text-primary mb-4 ml-6 flex items-center gap-2">
          <Check className={clsx("w-6 h-6", isAllCompleted && "text-tertiary")} />
          Checklist Hari Ini
        </h3>
        
        <ul className="space-y-3 ml-6 mb-4">
          {todayAgendas.length === 0 ? (
            <li className="text-center p-4 text-on-surface-variant text-sm font-medium">Kosong nih bun, ayo tambah agenda!</li>
          ) : (
            todayAgendas.map((agenda) => {
              const isCompleted = agenda.IsCompleted === "TRUE" || agenda.IsCompleted === true;
              return (
                <li 
                  key={agenda.ID} 
                  onClick={() => handleToggleAgenda(agenda.ID)}
                  className="flex flex-col gap-1 bg-surface-container-lowest p-3 rounded-lg border border-surface-variant/50 hover:bg-surface transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "w-6 h-6 rounded border-2 flex items-center justify-center transition-all shrink-0",
                      isCompleted ? "border-primary bg-primary text-on-primary" : "border-primary-container bg-primary-container/20 group-hover:border-primary"
                    )}>
                      {isToggling === agenda.ID ? (
                        <Loader2 className={clsx("w-4 h-4 animate-spin", isCompleted ? "text-on-primary" : "text-primary")} />
                      ) : isCompleted ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : null}
                    </div>
                    <span className={clsx("text-lg font-medium transition-all duration-300", isCompleted ? "text-outline line-through opacity-70" : "text-on-surface")}>
                      {agenda.Title}
                    </span>
                  </div>
                </li>
              );
            })
          )}
        </ul>
        
        <Link href="/planner/new" className="mt-4 ml-6 text-sm font-bold text-primary flex items-center gap-1 hover:underline w-fit">
          <Plus className="w-4 h-4" /> Tambah Agenda
        </Link>
      </section>

      {/* Catatan Kecil (Sticky Note) for today */}
      <section className="bg-tertiary-fixed rounded-sm p-5 shadow-[4px_4px_0_rgba(129,81,91,0.1)] relative transform rotate-1 mt-4 mb-8 w-3/4 mx-auto md:w-full md:mx-0">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 washi-tape-purple -rotate-3 z-10"></div>
        <h3 className="text-lg text-on-tertiary-fixed-variant mb-3 font-bold">Catatan Kecil ✨</h3>
        <div className="space-y-3">
          {todayAgendas.filter(a => a.Notes).length > 0 ? (
            todayAgendas.filter(a => a.Notes).map(agenda => (
              <div key={`note-${agenda.ID}`} className="text-on-surface-variant leading-relaxed pb-3 border-b border-tertiary/20 last:border-0 last:pb-0">
                <p className="text-lg whitespace-pre-wrap">{agenda.Notes}</p>
              </div>
            ))
          ) : (
            <p className="text-lg text-on-surface-variant leading-relaxed">
              Tidak ada catatan tambahan untuk hari ini. Kamu hebat, Bun! ❤️
            </p>
          )}
        </div>
      </section>
    </>
  );
}
