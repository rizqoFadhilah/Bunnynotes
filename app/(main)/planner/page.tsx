'use client';

import { useState, useEffect } from 'react';
import { Pin, Check, Star, Sparkles, Plus, MoreVertical, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { getAgendas, completeAgenda, saveDailyNote } from '@/lib/api';

export default function PlannerPage() {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isToggling, setIsToggling] = useState<string | null>(null);

  const [noteText, setNoteText] = useState('');
  const [originalNoteText, setOriginalNoteText] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const fetchAgendas = async () => {
    setLoading(true);
    try {
      const data = await getAgendas();
      setAgendas(data || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgendas();
  }, []);

  useEffect(() => {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const dailyNoteAgenda = agendas.find(a => a.Title === 'Catatan Kecil' && (a.Date === dateStr || (a.Timestamp && a.Timestamp.startsWith(dateStr))));
    const val = dailyNoteAgenda ? (dailyNoteAgenda.Notes || '') : '';
    setNoteText(val);
    setOriginalNoteText(val);
  }, [selectedDate, agendas]);

  const handleSaveNote = async () => {
    if (noteText === originalNoteText) return;
    setIsSavingNote(true);
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      await saveDailyNote(dateStr, noteText);
      await fetchAgendas();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleToggleAgenda = async (id: string) => {
    setIsToggling(id);
    try {
      await completeAgenda(id);
      await fetchAgendas();
    } catch(e) {
      console.error(e);
    } finally {
      setIsToggling(null);
    }
  };

  // Calendar logic
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 is Sunday
  
  // Custom week starts on Monday
  const startingDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const days = [];
  for (let i = 0; i < startingDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const isToday = (d: number) => {
    const today = new Date();
    return today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
  };

  const isSelected = (d: number) => {
    return selectedDate.getDate() === d && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
  };

  const getAgendasForDate = (d: number | Date) => {
    const targetDate = d instanceof Date ? d : new Date(year, month, d);
    const dateString = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(targetDate.getDate()).padStart(2, '0')}`;
    return agendas.filter((a) => {
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
  };

  const selectedAgendas = getAgendasForDate(selectedDate);
  const checklistAgendas = selectedAgendas.filter(a => a.Title !== 'Catatan Kecil');
  const totalCompleted = checklistAgendas.filter(a => a.IsCompleted === "TRUE" || a.IsCompleted === true).length;
  const isAllCompleted = checklistAgendas.length > 0 && totalCompleted === checklistAgendas.length;
  
  // Formatter for month name
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="relative">
        {/* Background Decorations */}
        <div className="absolute -top-10 -left-10 text-primary-container opacity-50 rotate-12 pointer-events-none">
          <Star className="w-16 h-16 fill-current" />
        </div>
        <div className="absolute top-40 -right-5 text-secondary-container opacity-50 -rotate-12 pointer-events-none">
          <Sparkles className="w-12 h-12 fill-current" />
        </div>

        {/* Date Header */}
        <div className="relative clay-card p-6 mb-8 border-white/60 [--clay-card-bg:var(--color-surface)]">
          <div className="flex justify-between items-center px-4">
            <button 
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="w-10 h-10 clay-icon-container text-primary hover:bg-surface-variant transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-on-surface text-center mb-1 tracking-tight">{monthName}</h2>
            <button 
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="w-10 h-10 clay-icon-container text-primary hover:bg-surface-variant transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          <p className="text-center text-primary/60 text-xs font-bold uppercase tracking-widest mt-4">Fokus hari ini: Sabar &amp; Bernapas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          {/* Calendar Section */}
          <div className="md:col-span-12 lg:col-span-7 clay-card p-[24px] border-white/60 relative z-10 [--clay-card-bg:var(--color-surface)]">
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-4 text-center text-[10px] font-bold text-primary/40 uppercase tracking-widest">
              <div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div><div>Min</div>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {days.map((day, idx) => {
                if (day === null) {
                  return (
                    <div key={`blank-${idx}`} className="aspect-square p-1 rounded-2xl bg-surface-variant/20 border border-dashed border-outline-variant/20"></div>
                  )
                }

                const dAgendas = getAgendasForDate(day).filter(a => a.Title !== 'Catatan Kecil');
                const hasAgendas = dAgendas.length > 0;
                const isAllDone = hasAgendas && dAgendas.every(a => a.IsCompleted === "TRUE" || a.IsCompleted === true);

                return (
                  <div 
                    key={day} 
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={clsx(
                      "aspect-square p-1 transition-all cursor-pointer relative",
                      isSelected(day) ? "clay-button z-20 [--clay-btn-bg:var(--color-primary)] ring-2 ring-white/50" : "clay-card [--clay-card-bg:var(--color-surface)] border-white/40 grayscale-[0.5] opacity-80 hover:grayscale-0 hover:opacity-100",
                      isToday(day) && !isSelected(day) ? "ring-2 ring-clay-pink ring-offset-2" : ""
                    )}
                    style={{ borderRadius: '16px' }}
                  >
                    <span className={clsx("text-base flex items-center justify-center h-full", isSelected(day) ? "font-bold text-white" : "text-on-surface")}>{day}</span>
                    {hasAgendas && (
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        <div className={clsx("w-1.5 h-1.5 rounded-full", isSelected(day) ? "bg-white/80" : isAllDone ? "bg-tertiary" : "bg-primary")}></div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Agenda & Notes Column */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-4 mt-4 lg:mt-0">
            {/* Agenda Hari Ini */}
           <section className={clsx(
             "clay-card p-[24px] relative border-white/40 mb-8 transition-all duration-500",
             isAllCompleted ? "[--clay-card-bg:var(--color-tertiary-container)]" : "[--clay-card-bg:var(--color-surface-container-low)]"
           )}>
              <h3 className="text-2xl font-bold text-on-surface mb-6 flex items-center gap-3">
                <div className="w-10 h-10 clay-icon-container shrink-0 [--clay-icon-bg:var(--color-surface)]">
                  <Check className={clsx("w-6 h-6", isAllCompleted ? "text-tertiary" : "text-primary")} />
                </div>
                {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </h3>
              
              <ul className="space-y-4 mb-6">
                {loading ? (
                   <li className="flex justify-center p-4">
                     <Loader2 className="w-6 h-6 animate-spin text-primary" />
                   </li>
                ) : checklistAgendas.length === 0 ? (
                  <li className="text-center p-6 text-on-surface-variant text-sm font-medium clay-card [--clay-card-bg:rgba(255,255,255,0.3)]">Kosong nih bun, ayo tambah agenda!</li>
                ) : (
                  checklistAgendas.map((agenda) => {
                    const isCompleted = agenda.IsCompleted === "TRUE" || agenda.IsCompleted === true;
                    return (
                      <li 
                        key={agenda.ID} 
                        onClick={() => handleToggleAgenda(agenda.ID)}
                        className="flex items-center gap-4 clay-card p-3 group cursor-pointer active:scale-95 transition-all [--clay-card-bg:var(--color-surface)] border-white/40"
                      >
                        <div className={clsx(
                          "w-10 h-10 clay-button flex items-center justify-center transition-all shrink-0",
                          isCompleted ? "[--clay-btn-bg:var(--color-primary)]" : "[--clay-btn-bg:var(--color-surface-container-high)]"
                        )}>
                          {isToggling === agenda.ID ? (
                             <Loader2 className={clsx("w-4 h-4 animate-spin", isCompleted ? "text-on-primary" : "text-primary")} />
                          ) : isCompleted ? (
                             <Check className="w-4 h-4 text-white" strokeWidth={4} />
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
              
              <Link href={`/planner/new?date=${selectedDate.toISOString()}`} className="clay-button bg-primary text-white text-sm font-bold px-6 py-3 inline-flex items-center gap-2 w-full justify-center">
                <Plus className="w-4 h-4" /> Tambah Agenda
              </Link>
            </section>

            {/* Catatan Kecil (Sticky Note) */}
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

                {/* Show notes from other agendas as secondary read-only reference if they exist */}
                {selectedAgendas.filter(a => a.Title !== 'Catatan Kecil' && a.Notes).length > 0 && (
                  <div className="mt-4 pt-3 border-t border-on-tertiary-container/10">
                    <span className="text-[10px] font-bold text-on-tertiary-container/40 uppercase tracking-widest block mb-2">Catatan dari Agenda Lain:</span>
                    <div className="space-y-2">
                      {selectedAgendas.filter(a => a.Title !== 'Catatan Kecil' && a.Notes).map(agenda => (
                        <div key={`other-note-${agenda.ID}`} className="text-sm text-on-tertiary-container/70 leading-relaxed font-semibold">
                          <span className="text-primary font-bold">{agenda.Title}:</span> <span className="italic font-medium">&quot;{agenda.Notes}&quot;</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        
      </div>
    </>
  );
}
