'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Rabbit, Send, X, RotateCcw, Sparkles, Loader2, Mic, Square } from 'lucide-react';
import { addTransaction, addCategory, getCategories } from '@/lib/api';
import { getWITDateTime } from '@/lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const DEFAULT_WELCOME = "Halo Bunda sayang! 🐰🌸\n\nBunBot sekarang siap bantuin Bunda catat transaksi pengeluaran/pemasukan dengan super cepat lho! ⚡💕\n\nBunda tinggal ketik pesan singkat atau **klik icon mik 🎤** di bawah untuk langsung bercerita lewat suara Bunda! Contohnya:\n✍️ *'transport bensin 5k'*\n✍️ *'makan bakso 20rb'*\n✍️ *'Beli susu anak tadi habis 150 ribu'* via rekaman suara.\n\nNanti BunBot langsung otomatis memproses dan mencatatnya ke keuangan Bunda! Praktis banget kan? Yuk cobain sekarang! 🥰✨";

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

  // BunBot Voice Assistant State
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);

  // Categories & Pending Interactive Fallback States
  const [localCategories, setLocalCategories] = useState<any[]>([]);
  const [pendingVoiceTransaction, setPendingVoiceTransaction] = useState<{
    Tipe: string;
    KategoriRekomendasi: string;
    Nominal: number;
    Catatan: string;
    Tanggal: string;
    Waktu: string;
  } | null>(null);

  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);

  const handleCreateNewCategoryAndSave = async () => {
    if (!pendingVoiceTransaction) return;
    setIsLoading(true);
    try {
      const catName = pendingVoiceTransaction.KategoriRekomendasi;
      await addCategory({
        Nama: catName,
        Icon: 'Sparkles',
        Warna: 'text-primary'
      });
      
      const freshCats = await getCategories();
      setLocalCategories(freshCats);
      
      const matched = freshCats.find(
        (c: any) => String(c.Nama).toLowerCase() === String(catName).toLowerCase()
      );
      const catId = matched ? (matched.ID || matched.id) : catName;

      const newTransaction = {
        Tipe: pendingVoiceTransaction.Tipe,
        Kategori: catId,
        Nominal: pendingVoiceTransaction.Nominal,
        Catatan: pendingVoiceTransaction.Catatan,
        Tanggal: pendingVoiceTransaction.Tanggal,
        Waktu: pendingVoiceTransaction.Waktu
      };

      await addTransaction(newTransaction);
      router.refresh();

      const readableTipe = pendingVoiceTransaction.Tipe === 'Income' ? 'Pemasukan' : 'Pengeluaran';
      setMessages(prev => [...prev, {
        role: 'model',
        content: `Hore Bunda sayang! 🎉\n\nKategori baru **"${catName}"** berhasil ditambahkan ke daftar Bunda. Transaksi Bunda juga otomatis disimpan:\n🌟 **Jenis**: ${readableTipe}\n💰 **Nominal**: Rp ${pendingVoiceTransaction.Nominal.toLocaleString('id-ID')}\n📂 **Kategori**: ${catName}\n📝 **Catatan**: "${pendingVoiceTransaction.Catatan || 'Tanpa Catatan'}"\n\nBunBot hebat kan? 🥰💕✨`
      }]);
      setPendingVoiceTransaction(null);
    } catch (err) {
      console.error('Error creating cat in chatbot:', err);
      alert('Gagal membuat kategori baru.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveWithExistingCategory = async (matchedCat: any) => {
    if (!pendingVoiceTransaction) return;
    setIsLoading(true);
    try {
      const newTransaction = {
        Tipe: pendingVoiceTransaction.Tipe,
        Kategori: matchedCat.ID || matchedCat.id,
        Nominal: pendingVoiceTransaction.Nominal,
        Catatan: pendingVoiceTransaction.Catatan,
        Tanggal: pendingVoiceTransaction.Tanggal,
        Waktu: pendingVoiceTransaction.Waktu
      };

      await addTransaction(newTransaction);
      router.refresh();

      const readableTipe = pendingVoiceTransaction.Tipe === 'Income' ? 'Pemasukan' : 'Pengeluaran';
      setMessages(prev => [...prev, {
        role: 'model',
        content: `Selesai Bun! Transaksi Bunda berhasil dihubungkan dan dicatatkan ke kategori **"${matchedCat.Nama}"**:\n🌟 **Jenis**: ${readableTipe}\n💰 **Nominal**: Rp ${pendingVoiceTransaction.Nominal.toLocaleString('id-ID')}\n📝 **Catatan**: "${pendingVoiceTransaction.Catatan || 'Tanpa Catatan'}"\n\nSudah tersimpan rapi ya! 🥰🌸`
      }]);
      setPendingVoiceTransaction(null);
    } catch (err) {
      console.error('Error saving transaction with existing category:', err);
      alert('Gagal mencatat transaksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds(prev => prev + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Fitur perekaman suara tidak didukung atau diblokir di peramban ini.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' };
      const recorder = new MediaRecorder(stream, options);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: options.mimeType });
        stream.getTracks().forEach(track => track.stop());
        await processAudioBlob(blob, options.mimeType);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err: any) {
      console.error('Permission mic error in Chatbot:', err);
      const errMsg = (err.message || String(err)).toLowerCase();
      const errName = (err.name || '').toLowerCase();
      
      const isDeviceNotFound = errName === 'notfounderror' || 
                              errName === 'devicesnotfounderror' || 
                              errMsg.includes('device not found') ||
                              errMsg.includes('not found') ||
                              errMsg.includes('requested device');
      
      const isSandboxOrIframe = errMsg.includes('permission') || 
                                errMsg.includes('security') || 
                                errMsg.includes('not allowed') ||
                                errName === 'notallowederror' ||
                                errName === 'securityerror';

      let friendlyError = '';
      if (isDeviceNotFound) {
        friendlyError = 'Aduh Bunda sayang, BunBot tidak menemukan perangkat mikrofon yang aktif di HP/laptop/browser Bunda saat ini. 🎤❌\n\nBunda bisa menghubungkan mikrofon terlebih dahulu, atau langsung ketik cerita keuangan Bunda kapan saja di kolom teks di bawah ya! Tetap super praktis kok! 💕';
      } else if (isSandboxOrIframe) {
        friendlyError = 'Aduh Bunda sayang, fitur perekaman suara terhalang oleh aturan keamanan browser atau sandboxing iframe di penampil ini. 🔒\n\nBunda bisa **Membuka Aplikasi di Tab Baru** (lewat tombol panah di kanan atas layar) untuk mencobanya secara penuh, atau ketik langsung ceritanya di kolom chat bawah ya! 🥰🌸';
      } else {
        friendlyError = `Aduh Bunda sayang, BunBot belum bisa mengakses mikrofon saat ini (${err.message || 'Izin ditolak'}). 😢\n\nPastikan Bunda sudah mengizinkan mikrofon di browser, atau ceritakan langsung lewat ketikan di kolom chat bawah ya! 🌸`;
      }

      setMessages(prev => [...prev, {
        role: 'model',
        content: friendlyError
      }]);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const processAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsAnalyzingVoice(true);
    // Add temporary message indicating recording is analyzing
    setMessages(prev => [...prev, {
      role: 'user',
      content: '🎤 *[Pesan suara dikirim oleh Bunda]*'
    }]);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64Payload = base64data.split(',')[1];

        const response = await fetch('/api/gemini/voice-transaction', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            audioBase64: base64Payload,
            mimeType: mimeType,
            availableCategories: categories
          })
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || 'Gagal menganalisis cerita Bunda.');
        }

        const { nominal, tipe, kategori_rekomendasi, catatan } = result.data;

        if (nominal) {
          // Automatic Transaction Insertion
          const wit = getWITDateTime();
          const dateStr = wit.dateStr;
          const timeStr = wit.timeStr;

          // Match category name
          const matchedCategory = localCategories.find(
            c => String(c.Nama).toLowerCase() === String(kategori_rekomendasi).toLowerCase() ||
                 String(c.ID || c.id).toLowerCase() === String(kategori_rekomendasi).toLowerCase()
          );

          if (matchedCategory) {
            const categoryValue = matchedCategory.ID || matchedCategory.id;
            const newTransaction = {
              Tipe: tipe || 'Expense',
              Kategori: categoryValue,
              Nominal: Number(nominal) || 0,
              Catatan: catatan || '',
              Tanggal: dateStr,
              Waktu: timeStr
            };

            await addTransaction(newTransaction);
            router.refresh();

            const readableTipe = tipe === 'Income' ? 'Pemasukan' : 'Pengeluaran';
            setMessages(prev => [...prev, {
              role: 'model',
              content: `Wah Bun, BunBot udah denger cerita rekaman suara Bunda! 🐰🌸\n\nBunBot bantu catetin otomatis ya:\n🌟 **Jenis**: ${readableTipe}\n💰 **Nominal**: Rp ${Number(nominal).toLocaleString('id-ID')}\n📂 **Kategori**: ${matchedCategory.Nama}\n📝 **Catatan**: "${catatan || 'Tanpa Catatan'}"\n\nTransaksi Bunda beneran udah berhasil disimpan dengan rapi! Hebat banget Bunda hari ini! 🥰✨`
            }]);
          } else {
            // Category is NOT registered! Do NOT save. Set state to pending and prompt.
            setPendingVoiceTransaction({
              Tipe: tipe || 'Expense',
              KategoriRekomendasi: kategori_rekomendasi || 'Lainnya',
              Nominal: Number(nominal) || 0,
              Catatan: catatan || '',
              Tanggal: dateStr,
              Waktu: timeStr
            });

            setMessages(prev => [...prev, {
              role: 'model',
              content: `Wah Bun, BunBot denger cerita Bunda senilai **Rp ${Number(nominal).toLocaleString('id-ID')}** untuk *"${catatan || 'Tanpa Catatan'}"*.\n\nNamun, kategori **"${kategori_rekomendasi || 'Lainnya'}"** belum terdaftar di daftar kategori Bunda saat ini. 🤔💭\n\nSilakan tentukan keputusan Bunda di bawah ini ya! 👇`
            }]);
          }
        } else {
          setMessages(prev => [...prev, {
            role: 'model',
            content: `Aduh Bun, BunBot kurang bisa menangkap angka nominal transaksi dalam cerita suara Bunda tadi. 😢\nBisa tolong rekam ulang ceritanya dengan menyebutkan nominal nominal atau ketik langsung di kolom chat ya, Bun? 💕`
          }]);
        }
      };
    } catch (err: any) {
      console.error('Error processing audio in chatbot:', err);
      setMessages(prev => [...prev, {
        role: 'model',
        content: `Wah Bunda sayang, sepertinya BunBot gagal memproses suara rekaman. Cerita Bunda tadi boleh diketik langsung atau dicoba direkam ulang dengan lebih dekat ke mic ya? 🐰🌸`
      }]);
    } finally {
      setIsAnalyzingVoice(false);
    }
  };

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
        const wit = getWITDateTime();
        const dateStr = wit.dateStr;
        const timeStr = wit.timeStr;

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

              {isAnalyzingVoice && (
                <div className="self-start flex flex-col items-start max-w-[85%]">
                  <div className="bg-surface-container text-on-surface border-white/60 border-2 rounded-2xl rounded-bl-sm p-3 text-xs font-medium shadow-xs flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-primary animate-pulse" />
                    <span>BunBot sedang memahami suara Bunda... 🐰🌸</span>
                  </div>
                </div>
              )}

              {/* Interactive Fallback Panel for Unregistered Category */}
              {pendingVoiceTransaction && (
                <div className="self-start w-full max-w-[95%] clay-card p-3 my-2 border-2 border-dashed border-primary/50 bg-primary-container/[0.08] text-xs transition-all animate-in fade-in-50 duration-200">
                  <p className="font-extrabold text-on-surface mb-2 flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-primary" /> Keputusan Kategori:
                  </p>
                  
                  <div className="flex flex-col gap-2">
                    {/* Option 1: Create new category */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={handleCreateNewCategoryAndSave}
                      className="clay-button py-2 px-3 text-[11px] font-black text-white shrink-0 [--clay-btn-bg:var(--color-primary)] flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>➕ Buat Kategori Baru &quot;{pendingVoiceTransaction.KategoriRekomendasi}&quot;</span>
                      )}
                    </button>
                    
                    <p className="text-[10px] text-on-surface-variant font-extrabold text-center my-0.5 uppercase tracking-wider">— ATAU PILIH KATEGORI YANG ADA —</p>
                    
                    {/* Option 2: Existing categories grid */}
                    <div className="grid grid-cols-2 gap-1.5 max-h-[120px] overflow-y-auto pr-1">
                      {localCategories
                        .filter(c => !pendingVoiceTransaction.Tipe || c.Tipe === pendingVoiceTransaction.Tipe || !c.Tipe)
                        .map(c => (
                          <button
                            key={c.ID || c.id}
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSaveWithExistingCategory(c)}
                            className="bg-surface-container hover:bg-primary-container/[0.3] border-2 border-white py-1.5 px-2 rounded-xl text-[10px] font-black text-on-surface-variant hover:text-on-primary-container text-left transition truncate cursor-pointer disabled:opacity-50"
                          >
                            📁 {c.Nama}
                          </button>
                        ))}
                    </div>
                    
                    {/* Option 3: Cancel */}
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => {
                        setPendingVoiceTransaction(null);
                        setMessages(prev => [...prev, {
                          role: 'model',
                          content: 'Transaksi dibatalkan. Bunda bisa menceritakan transaksi lainnya kapan saja ya! 🐰🌸'
                        }]);
                      }}
                      className="border-2 border-red-200 hover:bg-red-50 text-red-500 rounded-xl py-1.5 text-[10px] font-extrabold text-center transition active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      ❌ Batalkan Transaksi Ini
                    </button>
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

            {/* Input Form Footer & Voice Record Toggle */}
            <form
              id="bunbot-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="flex items-center gap-1.5 pt-2 border-t border-secondary-container"
            >
              {isRecording ? (
                <div className="flex-1 flex items-center justify-between bg-red-50 rounded-xl px-3 py-1.5 border-2 border-red-200">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                    <span className="text-xs font-black text-red-600">BunBot merekam... {recordSeconds}s</span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="w-9 h-9 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-md active:scale-95 transition-all outline-hidden shrink-0 cursor-pointer"
                    title="Selesai Bicara (Hentikan Rekam)"
                    aria-label="Selesai Bicara (Hentikan Rekam)"
                  >
                    <Square className="w-4 h-4 fill-white text-white" />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={isLoading || isAnalyzingVoice || !!pendingVoiceTransaction}
                    onClick={startRecording}
                    className={`p-2 w-9 h-9 flex items-center justify-center rounded-xl border border-white transition-all hover:scale-105 active:scale-95 text-primary ${
                      isAnalyzingVoice || !!pendingVoiceTransaction ? 'bg-surface-container opacity-50' : 'bg-primary-container/[0.3] hover:bg-primary-container/[0.5]'
                    }`}
                    title="Ceritakan Lewat Suara"
                  >
                    {isAnalyzingVoice ? (
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    ) : (
                      <Mic className="w-4 h-4 text-primary" />
                    )}
                  </button>
                  <input
                    id="chatbot-text-input"
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={pendingVoiceTransaction ? "Pilih keputusan kategori di atas..." : isAnalyzingVoice ? "BunBot sedang mendengarkan..." : "Tulis cerita transaksi cepat..."}
                    disabled={isLoading || isAnalyzingVoice || !!pendingVoiceTransaction}
                    className="flex-1 bg-surface-container border-white border-2 rounded-xl py-2 px-3 text-xs font-bold text-on-surface placeholder:text-on-surface-variant/60 outline-hidden focus:ring-2 focus:ring-primary transition"
                  />
                  <button
                    id="chatbot-submit"
                    type="submit"
                    disabled={!inputText.trim() || isLoading || isAnalyzingVoice || !!pendingVoiceTransaction}
                    className="clay-button p-2 w-9 h-9 flex items-center justify-center text-white disabled:opacity-50 disabled:scale-100 cursor-pointer [--clay-btn-bg:var(--color-primary)] [--clay-btn-highlight:rgba(255,255,255,0.4)]"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </>
              )}
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
