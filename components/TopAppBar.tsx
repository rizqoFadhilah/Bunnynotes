import { Bell, Rabbit } from 'lucide-react';

export default function TopAppBar({ title = 'Bunnynotes' }: { title?: string }) {
  return (
    <header className="fixed top-4 left-4 right-4 z-50 flex justify-between items-center px-[20px] py-4 clay-card h-16 [--clay-card-bg:rgba(255,255,255,0.8)] border-white/40">
      {/* Leading Avatar */}
      <div className="w-10 h-10 clay-icon-container shrink-0 [--clay-icon-bg:var(--color-primary-container)]">
        <Rabbit className="w-6 h-6 text-on-primary-container" strokeWidth={2} />
      </div>

      {/* Headline */}
      <h1 className="text-xl font-bold text-on-surface tracking-tight">
        {title}
      </h1>

      {/* Trailing Icon */}
      <button className="w-10 h-10 clay-icon-container text-on-surface transition-colors shrink-0">
        <Bell className="w-5 h-5" strokeWidth={2} />
      </button>
    </header>
  );
}
