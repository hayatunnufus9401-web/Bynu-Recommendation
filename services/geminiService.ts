
import { GoogleGenAI, Type } from "@google/genai";

// Pastikan API Key tersedia secara aman
const getAiInstance = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "" || apiKey === "undefined") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateProductContent = async (productName: string, category: string) => {
  try {
    const ai = getAiInstance();
    const prompt = `
      Act as a professional affiliate marketer and storyteller for "Bynu's Recommendation".
      User is uploading a product called "${productName}" in the category "${category}".
      
      Tugas kamu adalah membuat konten promosi yang menarik:
      1. Short Description: Deskripsi singkat (maks 2 kalimat) yang "catchy" untuk kartu produk.
      2. Blog Post: Artikel blog yang persuasif tapi santai.
      
      TONE & STYLE:
      - Gunakan Bahasa Indonesia yang santai, bubbly, ceria, dan TIDAK KAKU.
      - Gunakan gaya bahasa anak muda/Gen Z yang estetik (Indoglish).

      Return the response in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortDescription: { type: Type.STRING },
            blogTitle: { type: Type.STRING },
            blogExcerpt: { type: Type.STRING },
            blogContent: { type: Type.STRING }
          },
          required: ["shortDescription", "blogTitle", "blogExcerpt", "blogContent"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw new Error("API Key belum diset di Vercel, Babe! ✨");
    console.error("AI Error:", error);
    return { shortDescription: "Produk gemes!", blogTitle: "Wajib Punya!", blogExcerpt: "Cek yuk!", blogContent: "Bagus banget!" };
  }
};

export const askAiAssistant = async (userRequest: string, currentState: any) => {
  try {
    const ai = getAiInstance();
    const prompt = `
      ROLE: SYSTEM ARCHITECT (INTELLIGENT MODE)
      You are the technical backend of Bynu's website. You process user requests even with typos.
      
      USER REQUEST: "${userRequest}" (Note: Handle typos like 'aketgori' -> 'category', 'warna' -> 'color', etc.)
      
      CURRENT SITE STATE:
      - Site Name: ${currentState.settings.siteName}
      - Primary Color: ${currentState.settings.primaryColor}
      - Categories: ${JSON.stringify(currentState.categories)}

      INSTRUCTIONS:
      1. Interpret the user's intent. If they say "tambahkan aketgori", they mean "add category".
      2. If adding categories, return the NEW FULL ARRAY of categories in "categoryUpdate".
      3. If changing colors, return "primaryColor" or "backgroundColor".
      4. If changing site name, return "siteName".
      5. "textResponse" must be a bubbly confirmation of what you actually did.
      
      Return valid JSON only.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            textResponse: { type: Type.STRING },
            siteName: { type: Type.STRING },
            primaryColor: { type: Type.STRING },
            backgroundColor: { type: Type.STRING },
            heroTitle: { type: Type.STRING },
            categoryUpdate: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["textResponse"]
        }
      },
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    if (error.message === "API_KEY_MISSING") throw new Error("API Key hilang! Cek Environment Variables ya. 🔑");
    console.error("Architect AI Error:", error);
    throw new Error("Gagal memproses perintah. Coba perjelas kalimatnya ya Babe! ✨");
  }
};
