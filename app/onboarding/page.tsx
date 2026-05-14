import { Star, ChevronRight, Rabbit } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen font-sans text-on-background flex flex-col items-center justify-center relative overflow-hidden px-[20px]" 
      style={{
        backgroundColor: '#fdf9ee', 
        backgroundImage: 'radial-gradient(circle at 15% 20%, #ffc1cc 0%, transparent 25%), radial-gradient(circle at 85% 80%, #dacefd 0%, transparent 30%), radial-gradient(circle at 50% 50%, #fdf9ee 0%, #fdf9ee 100%)'
      }}>
      
      {/* Decorative Elements */}
      <Star className="absolute text-primary-fixed-dim fill-current opacity-80" style={{ top: '10%', left: '10%', transform: 'rotate(-15deg)', width: '24px', height: '24px' }} />
      <Star className="absolute text-secondary-container fill-current opacity-80" style={{ top: '20%', right: '15%', transform: 'rotate(20deg)', width: '32px', height: '32px' }} />
      <Star className="absolute text-tertiary-fixed-dim fill-current opacity-80" style={{ bottom: '30%', left: '5%', transform: 'rotate(10deg)', width: '28px', height: '28px' }} />
      <Star className="absolute text-primary-fixed-dim fill-current opacity-80" style={{ bottom: '15%', right: '10%', transform: 'rotate(-10deg)', width: '20px', height: '20px' }} />

      {/* Main Container */}
      <main className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-[0_8px_0_0_rgba(255,193,204,0.3)] ring-4 ring-white relative flex flex-col items-center p-[24px] text-center mt-8 mb-8 z-10" style={{ transform: 'rotate(1deg)' }}>
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 -rotate-2 w-24 h-6 washi-tape-pink z-10" style={{ boxShadow: '1px 1px 2px rgba(0,0,0,0.05)' }}></div>
        
        {/* Illustration */}
        <div className="w-full aspect-square mb-6 rounded-lg overflow-hidden border-4 border-white shadow-[0_4px_10px_rgba(129,81,91,0.1)] relative bg-primary-container flex items-center justify-center" style={{ transform: 'rotate(-1deg)' }}>
          <Rabbit className="w-48 h-48 text-primary" strokeWidth={1} />
        </div>

        {/* Typography */}
        <h1 className="text-4xl font-bold text-primary mb-4 tracking-tight">
          Bunnynotes
        </h1>
        <p className="text-xl text-on-surface-variant mb-8 px-4 leading-relaxed font-medium">
          Organize your home, money, and daily life with joy 🌸
        </p>

        {/* Call to Action */}
        <Link href="/auth" className="w-full py-4 px-6 bg-primary-container text-on-primary-container text-2xl font-bold rounded-full shadow-[0_6px_0_0_#81515b] ring-2 ring-white hover:bg-primary hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-1 active:shadow-[0_2px_0_0_#81515b] flex items-center justify-center gap-2 group">
          Start Your Cozy Journey
          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Subtle Footer Note */}
        <p className="text-sm font-bold text-outline mt-6 opacity-70">
          A gentle space for your daily rhythm.
        </p>
      </main>
    </div>
  );
}
