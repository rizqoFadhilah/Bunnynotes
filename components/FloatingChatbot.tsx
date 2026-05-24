'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Rabbit, Send, X, RotateCcw, Sparkles, Loader2 } from 'lucide-react';
import { addTransaction } from '@/lib/api';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const DEFAULT_WELCOME = "Halo Bunda sayang! 🐰🌸\n\nBunBot sekarang siap bantuin Bunda catat transaksi pengeluaran/pemasukan dengan super cepat lho! ⚡💕\n\nBunda tinggal ketik aja pesan singkat seadanya, contohnya:\n✍️ *'transport bensin 5k'*\n✍️ *'makan bakso 20rb'*\n✍️ *'belanja sayur 50.000'*\n\nNanti BunBot langsung otomatis masukin datanya ke catatan keuangan Bunda dengan tanggal dan jam hari ini! Praktis banget kan, Bun? Yuk cobain sekarang! 🥰✨";

const QUICK_ACTIONS = [
  { label: "🚗 Transport Bensin", prompt: "transport bensin 5k" },
  { label: "🍜 Makan Bakso", prompt: "makan bakso 20rb" },
  { label: "🛒 Belanja Sayur", prompt: "belanja bulanan 250k" },
  { label: "💸 Token Listrik", prompt: "listrik token 100k" }
];

export default function FloatingChatbot({ categories = [] }: { categories?: any[] }) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: DEFAULT_WELCOME }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage only on client-side mount
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('bunbot_chat_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      } catch (e) {
        console.error("Failed to load chat history:", e);
      }
    }
  }, []);

  // Save history to localStorage whenever messages change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('bunbot_chat_history', JSON.stringify(messages));
    }
  }, [messages, isMounted]);

  // Scroll to bottom whenever messages or loading state changes
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Send chat history and current dynamic categories to endpoint
      const chatHistory = [...messages, userMessage];
      const categoryNames = categories.map(c => c.Nama);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: chatHistory,
          availableCategories: categoryNames
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reply');
      }

      const data = await response.json();
      
      // If a valid transaction has been parsed by AI, insert it into the database directly on behalf of the user
      if (data.isTransaction && data.transaction) {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const timeStr = `${hh}:${min}`;

        // Match category object to find the ID if possible, otherwise send standard category name string
        const matchedCategory = categories.find(
          c => c.Nama.toLowerCase() === data.transaction.Kategori.toLowerCase()
        );
        const categoryValue = matchedCategory ? matchedCategory.ID : data.transaction.Kategori;

        const newTransaction = {
          Tipe: data.transaction.Tipe || 'Expense',
          Kategori: categoryValue,
          Nominal: Number(data.transaction.Nominal) || 0,
          Catatan: data.transaction.Catatan || '',
          Tanggal: dateStr,
          Waktu: timeStr
        };

        await addTransaction(newTransaction);
        
        // Refresh pages instantly to load new financial charts & dashboard information on the homescreen
        router.refresh();
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: data.reply
      }]);
    } catch (error) {
      console.error('Error talking with BunBot:', error);
      setMessages(prev => [...prev, {
        role: 'model',
        content: "Aduh Bunda sayang, sepertinya jaringan BunBot lagi tersangkut di wortel nih 🥕 Coba kirim pesan lagi sebentar ya, Bun! Semoga Bunda tetap ceria! 💕🌸"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (confirm('Bunda yakin mau membersihkan riwayat obrolan kita?')) {
      const resetState: Message[] = [{ role: 'model', content: DEFAULT_WELCOME }];
      setMessages(resetState);
      localStorage.setItem('bunbot_chat_history', JSON.stringify(resetState));
    }
  };

  if (!isMounted) return null;

  return (
    <div id="bunbot-floating-container" className="fixed bottom-[110px] right-4 md:right-8 z-40 flex flex-col items-end">
      {/* Chat Windows Container */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="bunbot-chat-window"
            initial={{ opacity: 0, scale: 0.85, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-[340px] max-w-[calc(100vw-32px)] h-[460px] max-h-[calc(100vh-180px)] clay-card p-4 flex flex-col [--clay-card-bg:var(--color-surface)] border-white shadow-xl mb-4"
          >
            {/* Header */}
            <div id="bunbot-chat-header" className="flex items-center justify-between border-b pb-3 mb-3 border-secondary-container">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 clay-icon-container flex-shrink-0 [--clay-icon-bg:var(--color-primary-container)]">
                  <Rabbit className="w-6 h-6 text-on-primary-container" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-on-surface flex items-center gap-1">
                    BunBot 🐰💕
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
                    </span>
                  </h3>
                  <p className="text-[10px] text-on-surface-variant font-medium">Catat Cepat Bunda</p>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1">
                <button
                  id="btn-confirm-reset-chat"
                  onClick={resetChat}
                  title="Mulai Ulang Obrolan"
                  className="p-2 hover:bg-surface-container rounded-xl transition text-on-surface-variant hover:text-primary"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  id="btn-close-chatbot"
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-surface-container rounded-xl transition text-on-surface-variant hover:text-primary"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div
              id="bunbot-chat-scroller"
              className="flex-1 overflow-y-auto pr-1 space-y-3 flex flex-col scrollbar-none pb-2 text-justify"
            >
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed border-2 ${
                      msg.role === 'user'
                        ? 'bg-primary-container text-on-primary-container border-white sticker-shadow !rounded-br-sm'
                        : 'bg-surface-container text-on-surface border-white/60 shadow-xs !rounded-bl-sm'
                    }`}
                    style={{ whiteSpace: 'pre-wrap' }}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-on-surface-variant/70 mt-1 px-1">
                    {msg.role === 'user' ? 'Bunda' : 'BunBot'}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="self-start flex flex-col items-start max-w-[85%]">
                  <div className="bg-surface-container text-on-surface border-white/60 border-2 rounded-2xl rounded-bl-sm p-3 text-xs font-medium shadow-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    <span>BunBot sedang mencatat... 🐰✨</span>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Quick Actions Templates inside Open Drawer */}
            {messages.length <= 1 && !isLoading && (
              <div id="bunbot-quick-actions" className="mb-2">
                <p className="text-[10px] uppercase font-extrabold tracking-wider text-on-surface-variant/70 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-tertiary" /> Coba Ketik Cepat:
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_ACTIONS.map((action, i) => (
                    <button
                      key={i}
                      id={`btn-quick-action-${i}`}
                      onClick={() => handleSendMessage(action.prompt)}
                      className="text-left py-1.5 px-2 bg-surface-container hover:bg-primary-container/43 rounded-xl border border-white text-[10px] font-bold text-on-surface-variant hover:text-on-primary-container transition overflow-hidden text-ellipsis whitespace-nowrap"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form Footer */}
            <form
              id="bunbot-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-1.5 pt-2 border-t border-secondary-container"
            >
              <input
                id="chatbot-text-input"
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Tulis transaksi cepat, misal: bensin 5k"
                disabled={isLoading}
                className="flex-1 bg-surface-container border-white border-2 rounded-xl py-2 px-3 text-xs font-bold text-on-surface placeholder:text-on-surface-variant/60 outline-hidden focus:ring-2 focus:ring-primary transition"
              />
              <button
                id="chatbot-submit"
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="clay-button p-2 w-9 h-9 flex items-center justify-center text-white disabled:opacity-50 disabled:scale-100 cursor-pointer [--clay-btn-bg:var(--color-primary)] [--clay-btn-highlight:rgba(255,255,255,0.4)]"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Sparkly Trigger Button */}
      <motion.button
        id="btn-toggle-chatbot"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="clay-button w-14 h-14 flex items-center justify-center text-white cursor-pointer relative [--clay-btn-bg:var(--color-primary)]"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close-icon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="rabbit-icon"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              className="relative"
            >
              <Rabbit className="w-8 h-8 text-white" strokeWidth={1.8} />
              {/* Pulsing indicator badge */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-tertiary text-[8px] font-extrabold text-[#5D4037] flex items-center justify-center">
                  ✨
                </span>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
