
import React, { useState, useEffect } from 'react';
import { Product, SiteSettings, AppState } from '../types';
import { generateProductContent, askAiAssistant } from '../services/geminiService';

interface AdminPanelProps {
  onAddProduct: (product: Product, blogContent: { title: string, content: string, excerpt: string }) => void;
  onUpdateProduct: (product: Product) => void;
  editingProduct: Product | null;
  onCancelEdit: () => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onUpdateCategories: (categories: string[]) => void;
  settings: SiteSettings;
  onUpdateSettings: (settings: SiteSettings) => void;
  onUpdateBlog: (id: string, content: string) => void;
  allBlogs: any[];
  fullState: AppState;
  onImportState: (state: AppState) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onAddProduct, onUpdateProduct, editingProduct, onCancelEdit, 
  categories, onAddCategory, onUpdateCategories, settings, 
  onUpdateSettings, onUpdateBlog, allBlogs, fullState, onImportState
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'design' | 'system' | 'ai'>('products');
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [newCatInput, setNewCatInput] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  // AI State
  const [aiPrompt, setAiPrompt] = useState('');

  // Form States
  const [formData, setFormData] = useState({ name: '', price: '', imageUrl: '', affiliateLink: '', category: categories[0] || '', shortDescription: '' });
  const [blogData, setBlogData] = useState({ title: '', excerpt: '', content: '' });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name, price: editingProduct.price,
        imageUrl: editingProduct.imageUrl, affiliateLink: editingProduct.affiliateLink,
        category: editingProduct.category, shortDescription: editingProduct.description || ''
      });
      setActiveTab('products');
    }
  }, [editingProduct]);

  const sendToTelegram = async (product: Product, excerpt: string) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) {
      console.warn('Telegram settings missing');
      return false;
    }

    const cleanChatId = settings.telegramChatId.startsWith('@') 
      ? settings.telegramChatId 
      : `@${settings.telegramChatId.replace('@','')}`;

    const message = `
<b>${product.name}</b> ✨

${excerpt}

💎 <b>Harga:</b> ${product.price}
🔗 <b>Link Produk:</b> <a href="${product.affiliateLink}">Klik di sini untuk beli</a>

#BynuRecommendation #${product.category.replace(/\s/g, '').replace(/[^\w]/g, '')}
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: cleanChatId,
          photo: product.imageUrl,
          caption: message,
          parse_mode: 'HTML'
        })
      });
      const data = await response.json();
      if (!data.ok) throw new Error(data.description);
      return true;
    } catch (error) {
      console.error('Telegram Error:', error);
      alert('Gagal kirim ke Telegram: ' + (error instanceof Error ? error.message : 'Cek bot token/ID channel kamu ya!'));
      return false;
    }
  };

  const handleAiAction = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    setAiError(null);
    try {
      const res = await askAiAssistant(aiPrompt, { settings, categories, blogs: allBlogs });
      const newSettings = { ...settings };
      if (res.siteName) newSettings.siteName = res.siteName;
      if (res.primaryColor) newSettings.primaryColor = res.primaryColor;
      onUpdateSettings(newSettings);
      if (res.categoryUpdate) onUpdateCategories(res.categoryUpdate);
      setAiPrompt('');
    } catch (e) { setAiError("Error updating data."); }
    finally { setLoading(false); }
  };

  const addManualCategory = () => {
    if (newCatInput.trim() && !categories.includes(newCatInput.trim())) {
      onUpdateCategories([...categories, newCatInput.trim()]);
      setNewCatInput('');
    }
  };

  return (
    <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-8 md:p-14 max-w-5xl mx-auto border-4 border-slate-50 relative overflow-hidden">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black flex items-center gap-3 animate-in slide-in-from-top-10">
          <span>🚀 Success! Posted to Telegram & Website! ✨</span>
          <button onClick={() => setShowToast(false)}>×</button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        {(['products', 'design', 'system', 'ai'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-slate-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-slate-600 bg-slate-50'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div className="animate-in fade-in duration-300">
           <form onSubmit={async (e) => {
             e.preventDefault();
             setLoading(true);
             try {
               const aiRes = await generateProductContent(formData.name, formData.category);
               setBlogData({ title: aiRes.blogTitle, excerpt: aiRes.blogExcerpt, content: aiRes.blogContent });
               setFormData(f => ({...f, shortDescription: aiRes.shortDescription}));
               setReviewMode(true);
             } catch (err) {
               alert("AI lagi malu-malu, coba lagi ya!");
             } finally {
               setLoading(false);
             }
           }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" placeholder="Product Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <select className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" placeholder="Image URL (Gunakan link gambar langsung)" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
              <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" placeholder="Price (e.g. Rp 25.000)" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
              <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" placeholder="Affiliate Link" value={formData.affiliateLink} onChange={e => setFormData({...formData, affiliateLink: e.target.value})} />
              <button disabled={loading} type="submit" className="w-full py-6 rounded-3xl bg-slate-900 text-white font-black text-lg hover:bg-black transition-all disabled:opacity-50">
                {loading ? 'AI is Writing... ✨' : 'Generate Diary & Review 📖'}
              </button>
           </form>
        </div>
      )}
      
      {activeTab === 'design' && (
        <div className="space-y-6 animate-in slide-in-from-right-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Site Name</label>
                <input className="w-full rounded-xl ring-1 ring-slate-100 px-5 py-3 font-bold" value={settings.siteName} onChange={e => onUpdateSettings({...settings, siteName: e.target.value})} />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hero Title</label>
                <input className="w-full rounded-xl ring-1 ring-slate-100 px-5 py-3 font-bold" value={settings.heroTitle} onChange={e => onUpdateSettings({...settings, heroTitle: e.target.value})} />
              </div>
           </div>
           <div className="flex gap-6">
             <div className="flex-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Theme Color</label>
               <input type="color" className="w-full h-14 rounded-xl cursor-pointer" value={settings.primaryColor} onChange={e => onUpdateSettings({...settings, primaryColor: e.target.value})} />
             </div>
             <div className="flex-1">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">BG Color</label>
               <input type="color" className="w-full h-14 rounded-xl cursor-pointer" value={settings.backgroundColor} onChange={e => onUpdateSettings({...settings, backgroundColor: e.target.value})} />
             </div>
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-8 animate-in slide-in-from-right-4">
          <div className="bg-white p-8 rounded-[2rem] border-2 border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Manual Category Manager 📁</h4>
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full group hover:bg-red-50 transition-colors">
                  <span className="text-sm font-bold text-slate-700">{cat}</span>
                  <button onClick={() => onUpdateCategories(categories.filter(c => c !== cat))} className="text-slate-400 hover:text-red-500 font-black text-xs">×</button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input type="text" value={newCatInput} onChange={e => setNewCatInput(e.target.value)} placeholder="Tambah kategori..." className="flex-1 rounded-xl ring-1 ring-slate-100 bg-slate-50 px-5 py-3 font-bold text-sm" />
              <button onClick={addManualCategory} className="px-6 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest">Add</button>
            </div>
          </div>

          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-sm">
            <h4 className="font-black text-indigo-900 text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
              Telegram Auto-Post 🚀 <span className="text-[10px] bg-indigo-200 text-indigo-700 px-2 py-0.5 rounded">ACTIVE</span>
            </h4>
            <p className="text-xs text-indigo-400 mb-6 font-medium">Postingan diary kamu akan otomatis terkirim ke channel Telegram.</p>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">Bot Token (from @BotFather)</label>
                <input 
                  type="password"
                  className="w-full rounded-xl ring-1 ring-indigo-100 bg-white px-5 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-400 outline-none" 
                  placeholder="123456789:ABCDefGhIjkLmNoPqRsTuVwXyZ" 
                  value={settings.telegramBotToken || ''}
                  onChange={e => onUpdateSettings({...settings, telegramBotToken: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest ml-2">Channel ID (e.g. @Bynurecommendation)</label>
                <input 
                  className="w-full rounded-xl ring-1 ring-indigo-100 bg-white px-5 py-3 font-bold text-sm focus:ring-2 focus:ring-indigo-400 outline-none" 
                  placeholder="@Bynurecommendation" 
                  value={settings.telegramChatId || ''}
                  onChange={e => onUpdateSettings({...settings, telegramChatId: e.target.value})}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
             <h3 className="text-2xl font-serif font-black mb-6">System Architect AI 🪄</h3>
             {aiError && <p className="text-red-400 text-xs mb-4">{aiError}</p>}
             <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-white/5 border-none ring-1 ring-white/10 rounded-2xl px-6 py-5 mb-4 font-bold placeholder:text-white/20" placeholder="Contoh: 'Tambahkan kategori Makeup 💄'" rows={3} />
             <button onClick={handleAiAction} disabled={loading || !aiPrompt} className="w-full bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50">{loading ? 'Updating...' : 'Confirm Evolution 🍓'}</button>
           </div>
        </div>
      )}

      {reviewMode && (
        <div className="fixed inset-0 z-[100] bg-white p-10 overflow-y-auto animate-in zoom-in-95">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-serif font-black italic">Reviewing Your Diary Post 📖</h2>
              <p className="text-slate-400 font-bold">Silakan edit teks jika ada yang kurang pas sebelum dipublish.</p>
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-2">Blog Title</label>
               <input className="w-full text-2xl font-black border-none ring-1 ring-slate-100 p-6 rounded-2xl focus:ring-pink-300" value={blogData.title} onChange={e => setBlogData({...blogData, title: e.target.value})} />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-300 ml-2">Blog Content</label>
               <textarea className="w-full min-h-[400px] border-none ring-1 ring-slate-100 p-8 rounded-2xl font-medium leading-relaxed focus:ring-pink-300" value={blogData.content} onChange={e => setBlogData({...blogData, content: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button disabled={isPublishing} onClick={() => setReviewMode(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 font-black uppercase tracking-widest text-xs">Cancel</button>
              <button disabled={isPublishing} onClick={async () => {
                setIsPublishing(true);
                const p: Product = { id: crypto.randomUUID(), ...formData, description: formData.shortDescription, createdAt: Date.now() };
                
                // STEP 1: Add to Site
                onAddProduct(p, blogData);
                
                // STEP 2: Auto Send to Telegram
                const success = await sendToTelegram(p, blogData.excerpt);
                
                if (success) {
                   setShowToast(true);
                   setTimeout(() => setShowToast(false), 5000);
                }
                
                setIsPublishing(false);
                setReviewMode(false);
                setFormData({ name: '', price: '', imageUrl: '', affiliateLink: '', category: categories[0] || '', shortDescription: '' });
              }} className="flex-[2] py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-2xl disabled:opacity-70">
                {isPublishing ? 'Posting to Telegram... 🚀' : 'Confirm & Publish ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
