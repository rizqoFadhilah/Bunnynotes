import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-gemini-api-key") || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set in environment variables or headers.");
      return NextResponse.json({
        isTransaction: false,
        reply: "Halo Bunda sayang! BunyBot sangat ingin membantu Bunda mencatat keuangan secara otomatis 🐰🌸\n\nTapi sepertinya Kunci API Gemini belum dipasang nih. 😢\n\n**Cara mengaktifkannya sangat mudah lho!** 👇\n1. Masuk ke tab **Profil** Bunda di menu navigasi bawah.\n2. Di bagian **Kunci API Gemini (Opsional)**, masukkan Kunci API Bunda sendiri.\n3. Jika belum punya, klik link **Dapatkan Kunci Gratis** di sebelahnya untuk dapet kunci gratis langsung dari Google! 🔑✨\n4. Simpan, dan BunyBot siap bantu catat transaksi Bunda dengan super cepat! 💕"
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const { messages, availableCategories } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages structure" }, { status: 400 });
    }

    const categoriesList = availableCategories && availableCategories.length > 0
      ? availableCategories
      : ['Food', 'Household', 'Kids', 'Skincare', 'Transport', 'Savings'];

    // Get the latest user message to parse
    const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');
    const userPrompt = lastUserMessage ? lastUserMessage.content : "";

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Bantu urai dan catat pesan ini sebagai transaksi keuangan rumah tangga Bunda yang cepat.
Pesan dari Bunda: "${userPrompt}"

Daftar kategori yang tersedia saat ini: ${JSON.stringify(categoriesList)}`,
      config: {
        systemInstruction: `Anda adalah BunyBot (asisten kelinci imut 🐰🌸). Tugas utama Anda adalah mengurai pesan singkat lisan atau chat bahasa Indonesia dari Bunda menjadi data transaksi keuangan terstruktur (pengeluaran atau pemasukan).

Pahami pola penulisan cepat seperti:
- "transport bensin 5k" -> kategori "Transport", bensin "Catatan", nominal 5000.
- "makan bakso 25.000" -> kategori "Food", makan bakso "Catatan", nominal 25000.
- "belanja sayur 50rb" -> kategori "Food" atau "Household", belanja sayur "Catatan", nominal 50000.
- "gaji bulanan +5jt" -> tipe "Income", kategori "Savings" (atau kategori lain yang cocok), nominal 5000000.

Aturan Pemetaan:
1. isTransaction: Atur true jika pesan mengandung informasi nominal uang (seperti 5k, 50rb, 25.000, 100 ribu) dan aktivitas pengisian/pembelian/transaksi. Jika hanya sapaan biasa (seperti "halo", "apa kabarmu"), atur false.
2. tipe: Harus 'Expense' (pengeluaran) atau 'Income' (pemasukan). Secara default, jika tidak disebutkan tanda "+" atau pemasukan, anggap saja ia adalah 'Expense'.
3. kategori: Pilih salah satu nama kategori yang paling mendekati dari list tersedia yang diberikan. Jika tidak ada yang cocok sama sekali, gunakan salah satu dari default ('Food', 'Household', 'Kids', 'Skincare', 'Transport', 'Savings') yang dianggap paling relevan.
4. catatan: Bagian deskripsi/perincian yang bersih (misalnya "bensin", "parkir", "bakso", "belanja sayur"). Buat singkat dan manis.
5. nominal: Hanya angka murni (integer) tanpa titik/koma/simbol mata uang. Parsing kata singkatan seperti "k"/"rb" -> "000", "jt" -> "000000".
6. reply: Jika transaksi berhasil diurai, buat balasan yang super imut, hangat, dan mengonfirmasi pencatatan ini menggunakan gaya bahasa BunyBot yang imut (🐰🌸✨💕) lengkap dengan detail apa saja yang dicatat. Jika isTransaction false, balas dengan sapaan hangat yang memandu Bunda untuk menulis transaksi cepat saja demi kepraktisan.`,
        temperature: 0.1, // Low temperature for consistent extraction
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isTransaction: {
              type: Type.BOOLEAN,
              description: "True jika pesan berhasil diuraikan menjadi sebuah transaksi keuangan."
            },
            transaction: {
              type: Type.OBJECT,
              description: "Objek transaksi jika isTransaction bernilai true.",
              properties: {
                Tipe: {
                  type: Type.STRING,
                  description: "Tipe transaksi, harus 'Expense' atau 'Income'."
                },
                Kategori: {
                  type: Type.STRING,
                  description: "Nama kategori terpilih dari daftar kategori yang tersedia."
                },
                Nominal: {
                  type: Type.INTEGER,
                  description: "Jumlah uang dalam bentuk angka murni (misal: 5000, 25000)."
                },
                Catatan: {
                  type: Type.STRING,
                  description: "Keterangan perincian/catatan transaksi (misal: 'bensin', 'makan siang')."
                }
              },
              required: ["Tipe", "Kategori", "Nominal", "Catatan"]
            },
            reply: {
              type: Type.STRING,
              description: "Kalimat balasan super imut khas BunyBot untuk dikembalikan ke layar percakapan Bunda."
            }
          },
          required: ["isTransaction", "reply"]
        }
      }
    });

    const resultText = response.text || "{}";
    const data = JSON.parse(resultText);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json({
      isTransaction: false,
      reply: "Aduh Bunda sayang, sepertinya jaringan BunyBot lagi tersangkut di wortel nih 🥕 Coba kirim pesan lagi sebentar ya, Bun! Semoga Bunda tetap ceria! 💕🌸"
    }, { status: 500 });
  }
}
