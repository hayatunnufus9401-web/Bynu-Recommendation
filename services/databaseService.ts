
import { AppState } from '../types';

// Mengambil variabel langsung agar Vite bisa menggantinya saat build
const SB_URL = process.env.SUPABASE_URL || '';
const SB_KEY = process.env.SUPABASE_ANON_KEY || '';
const TABLE_URL = `${SB_URL}/rest/v1/site_data`;

/**
 * Mengambil data terbaru dari Cloud Database.
 */
export const fetchCloudState = async (): Promise<AppState | null> => {
  if (!SB_URL || !SB_KEY) {
    console.warn("Supabase URL atau Key belum diset!");
    return null;
  }

  try {
    const response = await fetch(`${TABLE_URL}?id=eq.1&select=content`, {
      headers: {
        'apikey': SB_KEY,
        'Authorization': `Bearer ${SB_KEY}`
      }
    });
    
    if (!response.ok) {
      console.error("Database Response Error:", response.statusText);
      return null;
    }

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
 * Menyimpan/Update state website ke Cloud Database.
 */
export const saveCloudState = async (state: AppState) => {
  if (!SB_URL || !SB_KEY) return;

  try {
    const response = await fetch(TABLE_URL, {
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

    if (!response.ok) {
      const err = await response.json();
      console.error("Simpan ke Cloud Gagal:", err);
    } else {
      console.log("Cloud Sync Success! ✨");
    }
  } catch (error) {
    console.error("Gagal sinkronisasi ke cloud:", error);
  }
};
