'use client';

import { useState, useEffect } from 'react';
import { Pin, Check, Star, Sparkles, Plus, MoreVertical, Loader2, Download } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { getAgendas, completeAgenda } from '@/lib/api';

export default function PlannerPage() {
  const [agendas, setAgendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const [isToggling, setIsToggling] = useState<string | null>(null);

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

  const exportAgendasToCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['Judul', 'Tanggal', 'Status', 'Catatan'];
      const rows = agendas.map(a => {
        const isCompleted = a.IsCompleted === "TRUE" || a.IsCompleted === true;
        return [
          `"${(a.Title || '').replace(/"/g, '""')}"`,
          a.Date || a.Timestamp || '',
          isCompleted ? 'Selesai' : 'Belum Selesai',
          `"${(a.Notes || '').replace(/"/g, '""')}"`
        ];
      });

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `backup-planner-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
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
  const totalCompleted = selectedAgendas.filter(a => a.IsCompleted === "TRUE" || a.IsCompleted === true).length;
  const isAllCompleted = selectedAgendas.length > 0 && totalCompleted === selectedAgendas.length;
  
  // Formatter for month name
  const monthName = currentDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <>
      <div className="relative">
        {/* Backup Button */}
        <div className="flex justify-end mb-4 pr-2">
          <button 
            onClick={exportAgendasToCSV}
            disabled={isExporting || agendas.length === 0}
            className="flex items-center bg-tertiary-container text-on-tertiary-container rounded-lg px-4 py-2 border-2 border-white sticker-shadow hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            <span className="text-sm font-bold">Backup Planner CSV</span>
          </button>
        </div>

        {/* Background Decorations */}
        <div className="absolute -top-10 -left-10 text-primary-container opacity-50 rotate-12 pointer-events-none">
          <Star className="w-16 h-16 fill-current" />
        </div>
        <div className="absolute top-40 -right-5 text-secondary-container opacity-50 -rotate-12 pointer-events-none">
          <Sparkles className="w-12 h-12 fill-current" />
        </div>

        {/* Date Header */}
        <div className="relative bg-surface-container-lowest rounded-lg p-6 mb-8 border-4 border-white shadow-[0_4px_15px_rgba(129,81,91,0.05)] transform -rotate-1">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6 washi-tape rotate-2 z-10"></div>
          <div className="flex justify-between items-center px-4">
            <button 
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="text-primary font-bold px-2 py-1 bg-surface rounded-lg hover:bg-surface-variant transition-colors"
            >
              &lt;
            </button>
            <h2 className="text-2xl font-bold text-primary text-center mb-1">{monthName}</h2>
            <button 
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="text-primary font-bold px-2 py-1 bg-surface rounded-lg hover:bg-surface-variant transition-colors"
            >
              &gt;
            </button>
          </div>
          <p className="text-center text-on-surface-variant text-sm font-bold">Fokus hari ini: Sabar &amp; Bernapas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-8">
          {/* Calendar Section */}
          <div className="md:col-span-12 lg:col-span-7 bg-surface-container-lowest rounded-lg p-[24px] border-4 border-white shadow-[0_6px_20px_rgba(129,81,91,0.08)] relative z-10">
            <div className="absolute -top-4 -left-4 w-12 h-12 text-tertiary sticker-border rounded-full bg-white flex items-center justify-center rotate-[-10deg]">
              <Pin className="w-6 h-6 fill-current" />
            </div>
            
            <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2 text-center text-sm font-bold text-on-surface-variant">
              <div>S</div><div>S</div><div>R</div><div>K</div><div>J</div><div>S</div><div>M</div>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {days.map((day, idx) => {
                if (day === null) {
                  return (
                    <div key={`blank-${idx}`} className="aspect-square p-1 rounded-lg bg-surface-variant/30 border border-dashed border-outline-variant/30"></div>
                  )
                }

                const dAgendas = getAgendasForDate(day);
                const hasAgendas = dAgendas.length > 0;
                const isAllDone = hasAgendas && dAgendas.every(a => a.IsCompleted === "TRUE" || a.IsCompleted === true);

                return (
                  <div 
                    key={day} 
                    onClick={() => setSelectedDate(new Date(year, month, day))}
                    className={clsx(
                      "aspect-square p-1 rounded-lg flex flex-col items-center justify-center border transition-colors cursor-pointer relative",
                      isSelected(day) ? "bg-primary-container text-on-primary-container border-2 border-white shadow-sm ring-1 ring-primary/30 transform scale-110 z-10" : "bg-surface border-surface-variant hover:bg-primary-fixed/20",
                      isToday(day) && !isSelected(day) ? "ring-1 ring-primary ring-offset-1" : ""
                    )}
                  >
                    <span className={clsx("text-base", isSelected(day) && "font-bold", hasAgendas && "mb-1")}>{day}</span>
                    {hasAgendas && (
                      <div className="flex gap-0.5 mt-0.5">
                        {dAgendas.slice(0, 3).map((a, i) => (
                           <div key={i} className={clsx(
                             "w-1.5 h-1.5 rounded-full",
                             isAllDone ? "bg-tertiary" : "bg-primary"
                           )}></div>
                        ))}
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
             "bg-surface-container-low rounded-xl p-[24px] relative sticker-shadow border mb-8 transition-colors duration-500",
             isAllCompleted ? "border-tertiary shadow-[0_4px_15px_rgba(50,77,52,0.1)]" : "border-surface-variant soft-shadow-primary"
           )}>
              <div className="absolute top-4 -left-2 w-8 h-16 bg-surface-container rounded-r-lg border border-surface-variant shadow-sm flex items-center justify-center">
                <MoreVertical className="w-4 h-4 text-outline" />
              </div>
              <h3 className="text-2xl font-bold text-primary mb-4 ml-6 flex items-center gap-2">
                <Check className={clsx("w-6 h-6", isAllCompleted && "text-tertiary")} />
                Checklist {selectedDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
              </h3>
              
              <ul className="space-y-3 ml-6">
                {loading ? (
                   <li className="flex justify-center p-4">
                     <Loader2 className="w-6 h-6 animate-spin text-primary" />
                   </li>
                ) : selectedAgendas.length === 0 ? (
                  <li className="text-center p-4 text-on-surface-variant text-sm font-medium">Kosong nih bun, ayo tambah agenda!</li>
                ) : (
                  selectedAgendas.map((agenda) => {
                    const isCompleted = agenda.IsCompleted === "TRUE" || agenda.IsCompleted === true;
                    return (
                      <li 
                        key={agenda.ID} 
                        onClick={() => handleToggleAgenda(agenda.ID)}
                        className="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-lg border border-surface-variant/50 hover:bg-surface transition-colors cursor-pointer group"
                      >
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
                        <div className="flex flex-col justify-center">
                           <span className={clsx("text-lg font-medium transition-all duration-300", isCompleted ? "text-outline line-through opacity-70" : "text-on-surface")}>
                             {agenda.Title}
                           </span>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
              
              <Link href={`/planner/new?date=${selectedDate.toISOString()}`} className="mt-4 ml-6 text-sm font-bold text-primary flex items-center gap-1 hover:underline">
                <Plus className="w-4 h-4" /> Tambah Agenda
              </Link>
            </section>

            {/* Catatan Kecil (Sticky Note) */}
            <div className="bg-tertiary-fixed rounded-sm p-5 shadow-[4px_4px_0_rgba(129,81,91,0.1)] relative transform -rotate-2 mt-4">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-5 washi-tape-purple -rotate-3 z-10"></div>
              <h3 className="text-lg text-on-tertiary-fixed-variant mb-3 font-bold">Catatan Kecil ✨</h3>
              <div className="space-y-3">
                {selectedAgendas.filter(a => a.Notes).length > 0 ? (
                  selectedAgendas.filter(a => a.Notes).map(agenda => (
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
            </div>
          </div>
        </div>

        
      </div>
    </>
  );
}
