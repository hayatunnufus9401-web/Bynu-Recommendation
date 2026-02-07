
/**
 * PERMANENT TELEGRAM CONFIGURATION
 * Locked and non-editable as requested.
 */
const TELEGRAM_CONFIG = {
  BOT_TOKEN: '8374171711:AAH_vE6esv1O54RzfhFsZ2b6kWUm-8dqHpo',
  CHAT_ID: '@Bynurecommendation'
};

/**
 * Helper to escape HTML characters for Telegram's HTML mode.
 */
const escapeHtml = (text: string) => {
  if (!text) return "";
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
};

export const sendToTelegram = async (
  product: { name: string; price: string; imageUrls: string[]; affiliateLink: string; description: string },
  blogLink: string
) => {
  const { BOT_TOKEN, CHAT_ID } = TELEGRAM_CONFIG;

  if (!product.imageUrls || product.imageUrls.length === 0) {
    console.warn("⚠️ Data Telegram tidak lengkap (Image kosong).");
    return;
  }

  // Caption in HTML mode
  const caption = `
<b>✨ NEW RECOMMENDATION! ✨</b>

🛍 <b>${escapeHtml(product.name)}</b>
💰 Harga: <code>${escapeHtml(product.price)}</code>

📝 ${escapeHtml(product.description)}

🔗 <a href="${product.affiliateLink}">Link Produk</a>
🙆🏼‍♀️ <a href="${blogLink}">Review By Bynu</a>

Happy shopping, Babe! 🍓
  `.trim();

  try {
    let response;
    
    // Multiple images
    if (product.imageUrls.length > 1) {
      const media = product.imageUrls.slice(0, 10).map((url, index) => ({
        type: 'photo',
        media: url,
        caption: index === 0 ? caption : '',
        parse_mode: 'HTML'
      }));

      response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMediaGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          media: media
        }),
      });
    } else {
      // Single image
      const imageUrl = product.imageUrls[0];
      const isBase64 = imageUrl.startsWith('data:');
      
      if (isBase64) {
        // Handle Base64 Upload
        const blob = await (await fetch(imageUrl)).blob();
        const formData = new FormData();
        formData.append('chat_id', CHAT_ID);
        formData.append('photo', blob, 'product.jpg');
        formData.append('caption', caption);
        formData.append('parse_mode', 'HTML');

        response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          body: formData,
        });
      } else {
        // Handle URL
        response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: CHAT_ID,
            photo: imageUrl,
            caption: caption,
            parse_mode: 'HTML',
          }),
        });
      }
    }

    const result = await response.json();
    if (!result.ok) {
      console.error("❌ Telegram API Error:", result.description);
    } else {
      console.log("✅ Berhasil dikirim ke Channel Telegram! 🚀");
    }
  } catch (error) {
    console.error("❌ Network Error ke Telegram:", error);
  }
};
