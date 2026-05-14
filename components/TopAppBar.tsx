import { Bell, Rabbit } from 'lucide-react';

export default function TopAppBar({ title = 'Bunnynotes' }: { title?: string }) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-[20px] py-4 bg-surface border-b-2 border-dashed border-primary/20 backdrop-blur-md bg-surface/80 shadow-[0_4px_0_0_rgba(129,81,91,0.1)] rounded-b-[2rem]">
      {/* Leading Avatar */}
      <div className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm hover:scale-105 transition-transform flex items-center justify-center bg-primary-container shrink-0">
        <Rabbit className="w-6 h-6 text-primary" strokeWidth={1.5} />
      </div>

      {/* Headline */}
      <h1 className="text-2xl font-bold text-primary tracking-tight">
        {title}
      </h1>

      {/* Trailing Icon */}
      <button className="w-10 h-10 flex items-center justify-center rounded-full text-primary hover:bg-surface-container transition-colors shrink-0">
        <Bell className="w-6 h-6" strokeWidth={2} />
      </button>
    </header>
  );
}
