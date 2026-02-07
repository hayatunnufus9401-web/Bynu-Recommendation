
import { AppState } from '../types';

// Variabel ini diambil dari Environment Variables di Vercel
const SB_URL = (window as any).process?.env?.SUPABASE_URL || '';
const SB_KEY = (window as any).process?.env?.SUPABASE_ANON_KEY || '';
const TABLE_URL = `${SB_URL}/rest/v1/site_data`;

/**
 * Mengambil data terbaru dari Cloud Database.
 * Menggunakan baris tunggal dengan ID 1 sebagai penyimpan seluruh state website.
 */
export const fetchCloudState = async (): Promise<AppState | null> => {
  if (!SB_URL || !SB_KEY) return null;

  try {
    const response = await fetch(`${TABLE_URL}?id=eq.1&select=content`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`
      }
    });
    const data = await response.json();
    if (data && data[0]) {
      return data[0].content as AppState;
    }
  } catch (error) {
    console.error("Gagal mengambil data dari cloud:", error);
  }
  return null;
};

/**
 * Menyimpan/Update state website ke Cloud Database agar bisa dilihat semua orang.
 */
export const saveCloudState = async (state: AppState) => {
  if (!SB_URL || !SB_KEY) return;

  try {
    // Gunakan POST dengan header UPSERT agar otomatis update jika ID 1 sudah ada
    await fetch(TABLE_URL, {
      method: 'POST',
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        id: 1,
        content: state
      })
    });
  } catch (error) {
    console.error("Gagal sinkronisasi ke cloud:", error);
  }
};
