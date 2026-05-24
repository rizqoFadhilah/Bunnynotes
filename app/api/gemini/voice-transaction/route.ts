import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: "Kunci API (GEMINI_API_KEY) belum dikonfigurasi di panel Secrets. Silakan setel terlebih dahulu di Settings app.",
      }, { status: 400 });
    }

    const { audioBase64, mimeType, availableCategories } = await req.json();

    if (!audioBase64) {
      return NextResponse.json({
        success: false,
        error: "Data audio tidak boleh kosong.",
      }, { status: 400 });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const categoryListStr = availableCategories && Array.isArray(availableCategories)
      ? availableCategories.map((c: any) => `- ID: "${c.ID || c.id || c.Nama}", Nama: "${c.Nama}"`).join("\n")
      : "- ID: \"Food\", Nama: \"Makanan/Minuman\"\n- ID: \"Household\", Nama: \"Rumah Tangga\"\n- ID: \"Kids\", Nama: \"Anak-anak\"";

    const promptText = `Analisislah suara rekaman transaksi keuangan berikut. Anda harus mendeteksi nominal transaksi, tipe transaksi (pemasukan atau pengeluaran), catatan/deskripsi transaksi, serta menyarankan kategori terbaik dari daftar kategori yang tersedia di bawah ini.

Daftar kategori yang tersedia di database saat ini:
${categoryListStr}

Harap pilih Kategori Terbaik berdasarkan nama atau ID di atas jika cocok. Jika tidak ada yang cocok, Bunda bisa merekomendasikan salah satu ID di atas, atau menyarankan nama kategori yang logis.

Ketentuan pengisian nilai kembalian:
1. nominal: Angka bulat positif nominal transaksi (contoh: 50000, 15000, 250000). Jangan ada simbol Rp atau tanda titik/koma ribuan.
2. tipe: Harus bernilai tepat "Income" jika transaksi merupakan pemasukan/pendapatan, atau "Expense" jika transaksi merupakan pengeluaran/belanja.
3. kategori_rekomendasi: Berisi ID atau Nama kategori yang paling cocok dari daftar kategori di atas.
4. catatan: Deskripsi singkat dan ramah (misal: "Beli sate ayam", "Gaji bulanan ayah", "Susu SGM anak").

Harap keluarkan hasil analisis dalam format JSON terstruktur.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mimeType || "audio/webm",
            data: audioBase64,
          },
        },
        promptText
      ],
      config: {
        systemInstruction: "Anda adalah BunyBot, asisten keuangan cerdas, ramah, dan solutif untuk Bunda Indonesia. Tugas utama Anda adalah mendengarkan suara rekaman cerita harian Bunda tentang pengeluaran/pemasukannya, memahaminya, dan menyusunnya menjadi data keuangan terstruktur dalam format JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nominal: {
              type: Type.NUMBER,
              description: "Nominal uang transaksi dalam angka bulat (misal: 25000)"
            },
            tipe: {
              type: Type.STRING,
              description: "Harus berupa 'Income' untuk pemasukan, atau 'Expense' untuk pengeluaran."
            },
            kategori_rekomendasi: {
              type: Type.STRING,
              description: "ID atau Nama kategori yang paling cocok."
            },
            catatan: {
              type: Type.STRING,
              description: "Catatan penjelasan pengeluaran/pemasukan yang dinarasikan, misal: 'Beli sayuran di pasar' atau 'Gaji bulanan'"
            }
          },
          required: ["nominal", "tipe", "kategori_rekomendasi", "catatan"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) {
      throw new Error("Gemini tidak mengembalikan teks hasil analisis.");
    }

    const parsedData = JSON.parse(resultText);

    return NextResponse.json({
      success: true,
      data: parsedData
    });

  } catch (error: any) {
    console.error("Error analyzing voice transaction:", error);
    return NextResponse.json({
      success: false,
      error: error.message || "Gagal memproses suara transaksi."
    }, { status: 500 });
  }
}
