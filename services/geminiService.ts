
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateProductContent = async (productName: string, category: string) => {
  const prompt = `
    Act as a professional affiliate marketer and storyteller for "Bynu's Recommendation".
    User is uploading a product called "${productName}" in the category "${category}".
    
    Tugas kamu adalah membuat konten promosi yang menarik:
    1. Short Description: Deskripsi singkat (maks 2 kalimat) yang "catchy" untuk kartu produk.
    2. Blog Post: Artikel blog yang persuasif tapi santai.
    
    TONE & STYLE:
    - Gunakan Bahasa Indonesia yang santai, bubbly, ceria, dan TIDAK KAKU.
    - Gunakan gaya bahasa anak muda/Gen Z yang estetik.
    - Sesekali campurkan istilah English yang umum (Indoglish).

    Return the response in JSON format.
  `;

  try {
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
  } catch (error) {
    console.error("AI Error:", error);
    return { shortDescription: "Produk gemes!", blogTitle: "Wajib Punya!", blogExcerpt: "Cek yuk!", blogContent: "Bagus banget!" };
  }
};

export const askAiAssistant = async (userRequest: string, currentState: any) => {
  const prompt = `
    ROLE: SYSTEM ARCHITECT (DATA MODE)
    You are the technical backend of Bynu's website. You do NOT just talk; you EXECUTE data changes.
    
    USER REQUEST: "${userRequest}"
    
    CURRENT SITE STATE:
    - Site Name: ${currentState.settings.siteName}
    - Primary Color: ${currentState.settings.primaryColor}
    - Categories: ${JSON.stringify(currentState.categories)}

    INSTRUCTIONS:
    1. If the request is about categories (adding, changing), return ALL resulting categories in "categoryUpdate".
    2. If it's about colors, return new "primaryColor" or "backgroundColor".
    3. If it's about site name, return "siteName".
    4. Keep "textResponse" bubbly, short, and confirming what you changed.
    
    IMPORTANT: You must ALWAYS return a valid JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", // Changed to flash for better stability in quick JSON responses
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
    const result = JSON.parse(response.text || "{}");
    return result;
  } catch (error) {
    console.error("Architect AI Error:", error);
    throw new Error("Maaf Babe, AI lagi pusing. Coba cek API Key di Vercel atau perjelas perintahnya ya! ✨");
  }
};
