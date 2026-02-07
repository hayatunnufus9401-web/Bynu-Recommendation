
export const sendToTelegram = async (
  botToken: string,
  chatId: string,
  product: { name: string; price: string; imageUrls: string[]; affiliateLink: string; description: string },
  blogLink: string
) => {
  if (!botToken || !chatId || !product.imageUrls || product.imageUrls.length === 0) return;

  const finalChatId = chatId.includes('t.me/') 
    ? '@' + chatId.split('t.me/')[1] 
    : chatId;

  const caption = `
✨ *NEW RECOMMENDATION!* ✨

🛍 *${product.name}*
💰 Harga: ${product.price}

📝 ${product.description}

🔗 *Link Produk:* ${product.affiliateLink}
🙆🏼‍♀️ *Link Review By me:* ${blogLink}

Happy shopping, Babe! 🍓
  `.trim();

  try {
    // Jika lebih dari 1 gambar, kirim sebagai Media Group
    if (product.imageUrls.length > 1) {
      const media = product.imageUrls.slice(0, 10).map((url, index) => ({
        type: 'photo',
        media: url,
        caption: index === 0 ? caption : '',
        parse_mode: 'Markdown'
      }));

      await fetch(`https://api.telegram.org/bot${botToken}/sendMediaGroup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: finalChatId,
          media: media
        }),
      });
    } else {
      // Jika hanya 1 gambar
      const imageUrl = product.imageUrls[0];
      const isBase64 = imageUrl.startsWith('data:');
      
      if (isBase64) {
        const blob = await (await fetch(imageUrl)).blob();
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
        await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: finalChatId,
            photo: imageUrl,
            caption: caption,
            parse_mode: 'Markdown',
          }),
        });
      }
    }
    console.log("Telegram notification sent! 🚀");
  } catch (error) {
    console.error("Gagal kirim ke Telegram:", error);
  }
};
