'use client';

import { useState, useEffect } from 'react';
import { Check, MoreVertical, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { completeAgenda, getAgendas, saveDailyNote } from '@/lib/api';

export default function HomeChecklist({ initialAgendas }: { initialAgendas: any[] }) {
  const [isClient, setIsClient] = useState(false);
  const [agendas, setAgendas] = useState<any[]>(initialAgendas);
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const [noteText, setNoteText] = useState('');
  const [originalNoteText, setOriginalNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const today = new Date();
  const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    if (!isClient) return;
    const dailyNoteAgenda = agendas.find(a => a.Title === 'Catatan Kecil' && (a.Date === dateString || (a.Timestamp && a.Timestamp.startsWith(dateString))));
    const val = dailyNoteAgenda ? (dailyNoteAgenda.Notes || '') : '';
    setNoteText(val);
    setOriginalNoteText(val);
  }, [isClient, agendas, dateString]);

  const handleSaveNote = async () => {
    if (noteText === originalNoteText) return;
    setIsSavingNote(true);
    try {
      await saveDailyNote(dateString, noteText);
      const updatedAgendas = await getAgendas();
      setAgendas(updatedAgendas || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNote(false);
    }
  };

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

  const displayAgendas = todayAgendas.filter(a => a.Title !== 'Catatan Kecil');
  const totalCompleted = displayAgendas.filter(a => a.IsCompleted === "TRUE" || a.IsCompleted === true).length;
  const isAllCompleted = displayAgendas.length > 0 && totalCompleted === displayAgendas.length;

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
          {displayAgendas.length === 0 ? (
            <li className="text-center p-6 text-on-surface-variant text-sm font-medium clay-card [--clay-card-bg:rgba(255,255,255,0.3)]">Kosong nih bun, ayo tambah agenda!</li>
          ) : (
            displayAgendas.map((agenda) => {
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
        <h3 className="text-lg text-on-tertiary-container mb-4 font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
             <span className="text-2xl">✨</span> Catatan Kecil
          </span>
          {isSavingNote && (
            <span className="text-xs font-bold text-on-tertiary-container/60 animate-pulse flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Menyimpan...
            </span>
          )}
        </h3>
        <div className="flex flex-col gap-3">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onBlur={handleSaveNote}
            placeholder="Tulis catatan kecil hari ini langsung di sini ya Bun... (misal: belanja minyak, resep, atau pengingat)"
            className="w-full min-h-[140px] p-3 text-lg font-semibold bg-white/30 hover:bg-white/40 focus:bg-white/50 border-2 border-white/20 focus:border-white/60 focus:outline-none rounded-xl text-on-tertiary-container placeholder-on-tertiary-container/50 resize-none transition-all duration-300"
          />
          {noteText !== originalNoteText && (
            <button
              onClick={handleSaveNote}
              disabled={isSavingNote}
              className="clay-button bg-[#FFB2BC] text-white font-bold text-xs px-4 py-2 self-end hover:scale-105 active:scale-95 transition-all text-center flex items-center gap-1 shadow-sm border border-white/30"
            >
              {isSavingNote ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Menyimpan...
                </>
              ) : (
                <>Simpan Note ✨</>
              )}
            </button>
          )}

          {/* Show notes from other agendas as secondary reference if they exist */}
          {todayAgendas.filter(a => a.Title !== 'Catatan Kecil' && a.Notes).length > 0 && (
            <div className="mt-4 pt-3 border-t border-on-tertiary-container/10">
              <span className="text-[10px] font-bold text-on-tertiary-container/40 uppercase tracking-widest block mb-1">Catatan dari Agenda Lain:</span>
              <div className="space-y-2">
                {todayAgendas.filter(a => a.Title !== 'Catatan Kecil' && a.Notes).map(agenda => (
                  <div key={`other-note-${agenda.ID}`} className="text-sm text-on-tertiary-container/70 leading-relaxed font-semibold">
                    <span className="text-primary font-bold">{agenda.Title}:</span> <span className="italic font-medium">&quot;{agenda.Notes}&quot;</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
