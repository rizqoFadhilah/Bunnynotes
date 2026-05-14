'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Sparkles, Pin, Star, PlusCircle, Loader2, Calendar, Rabbit } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';
import { addAgenda } from '@/lib/api';

function NewActivityContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramDate = searchParams.get('date');
  
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekdays'>('none');
  const [weekdays, setWeekdays] = useState<number[]>([]);

  const handleSubmit = async () => {
    if (!title) return;
    setIsSubmitting(true);
    try {
      const selectedDate = paramDate ? new Date(paramDate) : new Date();
      let datesToSave: string[] = [];

      if (repeat === 'none') {
        datesToSave.push(selectedDate.toISOString());
      } else if (repeat === 'daily') {
        for (let i = 0; i < 30; i++) {
          const d = new Date(selectedDate);
          d.setDate(selectedDate.getDate() + i);
          datesToSave.push(d.toISOString());
        }
      } else if (repeat === 'weekdays') {
        for (let i = 0; i < 30; i++) {
          const d = new Date(selectedDate);
          d.setDate(selectedDate.getDate() + i);
          if (weekdays.includes(d.getDay())) {
            datesToSave.push(d.toISOString());
          }
        }
        if (datesToSave.length === 0) {
          datesToSave.push(selectedDate.toISOString());
        }
      }

      await addAgenda({
        Title: title,
        Date: datesToSave,
        Priority: priority,
        Notes: notes,
      });
      router.push('/planner');
      router.refresh();
    } catch (error) {
      console.error(error);
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[20px] py-4 bg-surface/90 backdrop-blur-md shadow-[0_4px_0_0_rgba(129,81,91,0.05)] border-b border-dashed border-primary/10">
        <Link href="/planner" className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-primary-container hover:text-on-primary-container transition-colors sticker-shadow ring-2 ring-white">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-primary tracking-tight">New Activity</h1>
        <div className="w-10 h-10 flex items-center justify-center">
          <Sparkles className="w-7 h-7 text-tertiary-container fill-current" />
        </div>
      </header>

      <main className="w-full max-w-lg px-[20px] pt-24 mx-auto space-y-[16px]">
        <section className="relative bg-white rounded-lg p-[24px] soft-shadow-primary border-4 border-white rotate-[-1deg] mt-4">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-24 h-6 washi-tape-pink opacity-80 rotate-2 shadow-sm rounded-sm"></div>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What are we doing today? ✏️" 
            className="w-full bg-surface-container-low rounded-lg py-4 px-6 text-2xl font-bold text-primary placeholder:text-on-surface-variant/50 border-2 border-transparent focus:border-dashed focus:border-primary focus:ring-0 outline-none transition-all"
          />
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px]">
          <section className="bg-surface-container-low rounded-lg p-[24px] border-2 border-white sticker-shadow sm:col-span-1">
            <h2 className="text-sm font-bold text-primary uppercase mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-secondary fill-current" />
              Priority
            </h2>
            <div className="flex sm:flex-col gap-3 justify-center">
              <button 
                onClick={() => setPriority('Low')}
                className={clsx(
                  "flex-1 sm:w-full py-2 px-4 rounded-full text-sm transition-all font-bold",
                  priority === 'Low' 
                    ? "bg-secondary-container text-on-secondary-container border-2 border-white sticker-shadow" 
                    : "bg-white text-on-surface-variant border-2 border-transparent hover:border-secondary-container"
                )}
              >
                Low
              </button>
              <button 
                onClick={() => setPriority('Medium')}
                className={clsx(
                  "flex-1 sm:w-full py-2 px-4 rounded-full text-sm transition-all font-bold",
                  priority === 'Medium' 
                    ? "bg-secondary-container text-on-secondary-container border-2 border-white sticker-shadow" 
                    : "bg-white text-on-surface-variant border-2 border-transparent hover:border-secondary-container"
                )}
              >
                Medium
              </button>
              <button 
                onClick={() => setPriority('High')}
                className={clsx(
                  "flex-1 sm:w-full py-2 px-4 rounded-full text-sm transition-all font-bold",
                  priority === 'High' 
                    ? "bg-error-container text-on-error-container border-2 border-white sticker-shadow" 
                    : "bg-white text-on-surface-variant border-2 border-transparent hover:border-error-container"
                )}
              >
                High
              </button>
            </div>
          </section>

          <section className="bg-[#fffae5] rounded-lg p-[24px] shadow-[4px_4px_12px_rgba(0,0,0,0.05)] sm:col-span-2 relative rotate-[1deg] mt-2 sm:mt-0">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-error-container border-2 border-white shadow-sm flex items-center justify-center text-on-error-container">
              <Pin className="w-4 h-4 fill-current" />
            </div>
            <h2 className="text-lg text-on-surface-variant mb-2 pl-2">Notes &amp; Details...</h2>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 p-2 text-lg text-on-surface resize-none leading-[30px] outline-none" 
              placeholder="Add any special little details here..." 
              rows={3}
              style={{
                backgroundImage: 'repeating-linear-gradient(transparent, transparent 29px, #e6e2d8 30px)',
                backgroundPosition: '0 0',
                backgroundSize: '100% 30px'
              }}
            ></textarea>
          </section>
        </div>

        {/* Repeat / Recurrence Options */}
        <section className="bg-surface-container-low rounded-lg p-[24px] border-2 border-white sticker-shadow mt-4 mb-4">
          <h2 className="text-sm font-bold text-primary uppercase mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-tertiary fill-current" />
            Terapkan ke:
          </h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-variant hover:bg-surface cursor-pointer">
              <input type="radio" checked={repeat === 'none'} onChange={() => setRepeat('none')} className="w-4 h-4 text-primary" />
              <span className="font-medium text-on-surface">Hanya tanggal ini</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-variant hover:bg-surface cursor-pointer">
              <input type="radio" checked={repeat === 'daily'} onChange={() => setRepeat('daily')} className="w-4 h-4 text-primary" />
              <span className="font-medium text-on-surface flex-col flex">
                <span>Semua Tanggal</span>
                <span className="text-xs text-on-surface-variant mt-0.5">Berlaku untuk {paramDate ? new Date(paramDate).toLocaleDateString('id-ID') : 'hari ini'} hingga 30 hari ke depan</span>
              </span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded-lg border border-surface-variant hover:bg-surface cursor-pointer">
              <input type="radio" checked={repeat === 'weekdays'} onChange={() => setRepeat('weekdays')} className="w-4 h-4 text-primary" />
              <span className="font-medium text-on-surface">Pilih Hari Tertentu (Mingguan)</span>
            </label>

            {repeat === 'weekdays' && (
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { label: 'Min', val: 0 },
                  { label: 'Sen', val: 1 },
                  { label: 'Sel', val: 2 },
                  { label: 'Rab', val: 3 },
                  { label: 'Kam', val: 4 },
                  { label: 'Jum', val: 5 },
                  { label: 'Sab', val: 6 },
                ].map((day) => (
                  <button 
                    key={day.val}
                    type="button"
                    onClick={() => {
                      if (weekdays.includes(day.val)) setWeekdays(weekdays.filter(d => d !== day.val));
                      else setWeekdays([...weekdays, day.val]);
                    }}
                    className={clsx(
                      "px-3 py-1 pb-1.5 rounded-full text-sm font-bold border transition-colors flex-1 min-w-[50px] sm:flex-none",
                      weekdays.includes(day.val) ? "bg-primary text-on-primary border-primary sticker-shadow ring-2 ring-white" : "bg-surface border-outline-variant text-on-surface-variant"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <div className="pt-8 pb-12 flex flex-col items-center gap-6">
          <div className="flex items-end gap-3 relative right-4">
            <div className="w-16 h-16 rounded-full bg-surface-container border-4 border-white sticker-shadow overflow-hidden flex items-center justify-center">
              <Rabbit className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </div>
            <div className="bg-white px-4 py-2 rounded-lg rounded-bl-none border-2 border-surface-container sticker-shadow mb-4">
              <p className="text-sm text-primary font-bold">You got this, Bun! ✨</p>
            </div>
          </div>

          <button 
            onClick={handleSubmit} 
            disabled={!title || isSubmitting}
            className="w-full max-w-sm bg-primary text-on-primary text-2xl font-bold py-4 px-8 rounded-full shadow-[0_6px_0_0_#663a43] hover:shadow-[0_4px_0_0_#663a43] hover:translate-y-[2px] active:shadow-none active:translate-y-[6px] transition-all relative overflow-hidden group flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : (
              <>
                Add to My Planner
                <PlusCircle className="w-6 h-6" />
              </>
            )}
          </button>
        </div>
      </main>
    </>
  );
}

export default function NewActivityPage() {
  return (
    <div className="min-h-screen bg-background text-on-background font-sans pb-32 bg-dot-pattern">
      <Suspense fallback={
        <div className="flex h-screen w-full items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }>
        <NewActivityContent />
      </Suspense>
    </div>
  );
}
