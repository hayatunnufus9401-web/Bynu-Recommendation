
import React, { useState, useEffect, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Aduhh kegedean Babe! Maksimal 2MB ya biar webnya nggak lemot. ✨");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const sendToTelegram = async (product: Product, excerpt: string) => {
    if (!settings.telegramBotToken || !settings.telegramChatId) return true;
    const cleanChatId = settings.telegramChatId.startsWith('@') ? settings.telegramChatId : `@${settings.telegramChatId.replace('@','')}`;
    const message = `<b>${product.name}</b> ✨\n\n${excerpt}\n\n💎 <b>Harga:</b> ${product.price}\n🔗 <b>Link:</b> <a href="${product.affiliateLink}">Beli di Sini</a>`.trim();
    try {
      // If it's a base64 image, we might need to send it differently, but for now we'll try sending text only if base64 fails
      await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: cleanChatId, text: message, parse_mode: 'HTML' })
      });
      return true;
    } catch (error) { return false; }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullState, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `bynu_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(fullState, null, 2));
    alert("Data berhasil di-copy! Paste data ini ke dalam file App.tsx bagian INITIAL_PRODUCTS/BLOGS jika ingin update permanen untuk publik. ✨");
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
      if (res.backgroundColor) newSettings.backgroundColor = res.backgroundColor;
      if (res.heroTitle) newSettings.heroTitle = res.heroTitle;
      onUpdateSettings(newSettings);
      if (res.categoryUpdate) onUpdateCategories(res.categoryUpdate);
      setAiPrompt('');
      alert(res.textResponse || "Sistem berhasil diupdate! ✨");
    } catch (e: any) { 
      setAiError(e.message || "Gagal mengupdate sistem. Pastikan API Key sudah benar!"); 
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-8 md:p-14 max-w-5xl mx-auto border-4 border-slate-50 relative overflow-hidden">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black flex items-center gap-3 animate-in slide-in-from-top-10">
          <span>🚀 Success! Posted to Website! ✨</span>
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
            {tab === 'ai' ? 'Magic AI 🪄' : tab}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (
        <div className="animate-in fade-in duration-300">
           <form onSubmit={async (e) => {
             e.preventDefault();
             if (!formData.imageUrl) { alert("Masukin fotonya dulu dong Babe! 📸"); return; }
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
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nama Produk</label>
                  <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" placeholder="Contoh: Lipstik Gemes" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Kategori</label>
                  <select className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Foto Produk</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <input className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold text-sm" placeholder="Paste Link Gambar (URL)" value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} />
                    <div className="relative">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2">
                        <span>📸 Upload from Gallery</span>
                      </button>
                    </div>
                  </div>
                  <div className="border-2 border-slate-50 rounded-3xl bg-slate-50 min-h-[140px] flex items-center justify-center overflow-hidden">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} className="w-full h-full object-cover" alt="Preview" />
                    ) : (
                      <span className="text-slate-300 font-black uppercase text-[10px] tracking-widest">No Image Preview</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Harga</label>
                  <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" placeholder="Rp 25.000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Link Affiliate</label>
                  <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold" placeholder="https://shope.ee/..." value={formData.affiliateLink} onChange={e => setFormData({...formData, affiliateLink: e.target.value})} />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full py-6 rounded-3xl bg-slate-900 text-white font-black text-lg hover:bg-black transition-all disabled:opacity-50 shadow-2xl shadow-slate-200">
                {loading ? 'AI lagi ngetik Diary... ✨' : 'Generate Diary & Review 📖'}
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
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Backup & Export Data 🛡️</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={handleExportData} className="py-4 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50">Download Backup File</button>
              <button onClick={handleCopyJson} className="py-4 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg">Copy Full Data JSON</button>
            </div>
          </div>

          <div className="bg-indigo-50 p-8 rounded-[2.5rem] border-2 border-indigo-100 shadow-sm">
            <h4 className="font-black text-indigo-900 text-sm uppercase tracking-widest mb-2">Telegram Settings 🚀</h4>
            <div className="space-y-4 mt-6">
              <input type="password" className="w-full rounded-xl border-none ring-1 ring-indigo-100 bg-white px-5 py-3 font-bold text-sm" placeholder="Bot Token" value={settings.telegramBotToken || ''} onChange={e => onUpdateSettings({...settings, telegramBotToken: e.target.value})} />
              <input className="w-full rounded-xl border-none ring-1 ring-indigo-100 bg-white px-5 py-3 font-bold text-sm" placeholder="Channel ID (@channel)" value={settings.telegramChatId || ''} onChange={e => onUpdateSettings({...settings, telegramChatId: e.target.value})} />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2.5rem] p-10 text-white shadow-2xl">
             <h3 className="text-2xl font-serif font-black mb-6">System Architect AI 🪄</h3>
             {aiError && <p className="text-red-400 text-xs font-black mb-4 uppercase tracking-widest">{aiError}</p>}
             <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="w-full bg-white/5 border-none ring-1 ring-white/10 rounded-2xl px-6 py-5 mb-4 font-bold text-sm placeholder:text-slate-500" placeholder="Contoh: 'Tambahkan kategori Skincare 🧴' atau 'Ubah nama website jadi Bynu Corner'" rows={3} />
             <button onClick={handleAiAction} disabled={loading || !aiPrompt} className="w-full bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
               {loading ? 'Sistem lagi berpikir... ✨' : 'Confirm Evolution 🍓'}
             </button>
           </div>
        </div>
      )}

      {reviewMode && (
        <div className="fixed inset-0 z-[100] bg-white p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl font-serif font-black text-center">Review Diary Post 📖</h2>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Blog Title</label>
               <input className="w-full text-2xl font-black border-none ring-1 ring-slate-100 p-6 rounded-2xl" value={blogData.title} onChange={e => setBlogData({...blogData, title: e.target.value})} />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Blog Content</label>
               <textarea className="w-full min-h-[400px] border-none ring-1 ring-slate-100 p-8 rounded-2xl font-medium leading-relaxed" value={blogData.content} onChange={e => setBlogData({...blogData, content: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setReviewMode(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 font-black uppercase tracking-widest text-xs">Cancel</button>
              <button disabled={isPublishing} onClick={async () => {
                setIsPublishing(true);
                const p: Product = { id: crypto.randomUUID(), ...formData, description: formData.shortDescription, createdAt: Date.now() };
                onAddProduct(p, blogData);
                await sendToTelegram(p, blogData.excerpt);
                setIsPublishing(false);
                setReviewMode(false);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
                setFormData({ name: '', price: '', imageUrl: '', affiliateLink: '', category: categories[0] || '', shortDescription: '' });
              }} className="flex-[2] py-5 rounded-2xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-2xl">
                {isPublishing ? 'Publishing... ✨' : 'Confirm & Publish ✨'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
