
export const sendToTelegram = async (
  botToken: string,
  chatId: string,
  product: { name: string; price: string; imageUrl: string; affiliateLink: string; description: string },
  blogLink: string
) => {
  if (!botToken || !chatId) return;

  // Bersihkan Chat ID jika berupa link
  const finalChatId = chatId.includes('t.me/') 
    ? '@' + chatId.split('t.me/')[1] 
    : chatId;

  const caption = `
✨ *NEW RECOMMENDATION!* ✨

🛍 *${product.name}*
💰 Harga: ${product.price}

📝 ${product.description}

🔗 *Link Produk:* ${product.affiliateLink}
📖 *Baca Diary Bynu:* ${blogLink}

Happy shopping, Babe! 🍓
  `.trim();

  try {
    // Jika imageUrl adalah base64, kita kirim sebagai dokumen/photo berbeda, 
    // tapi untuk kemudahan dan reliabilitas, kita gunakan sendPhoto jika itu URL
    // Jika base64, Telegram API butuh multipart form data.
    
    const isBase64 = product.imageUrl.startsWith('data:');
    
    if (isBase64) {
      // Untuk base64, kita kirim pesan teks saja dulu sebagai fallback jika upload rumit,
      // namun di sini kita usahakan kirim teks dengan link gambar jika memungkinkan.
      // Namun cara terbaik adalah sendPhoto dengan Blob.
      const blob = await (await fetch(product.imageUrl)).blob();
      const formData = new FormData();
      formData.append('chat_id', finalChatId);
      formData.append('photo', blob, 'product.jpg');
      formData.append('caption', caption);
      formData.append('parse_mode', 'Markdown');

      await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        body: formData,
      });
    } else {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: finalChatId,
          text: `${caption}\n\n🖼 ${product.imageUrl}`,
          parse_mode: 'Markdown',
        }),
      });
    }
    console.log("Telegram notification sent! 🚀");
  } catch (error) {
    console.error("Gagal kirim ke Telegram:", error);
  }
};
