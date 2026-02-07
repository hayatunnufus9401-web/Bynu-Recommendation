
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
  const [imageMode, setImageMode] = useState<'url' | 'file'>('url');
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local states
  const [newCatInput, setNewCatInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [socialInputs, setSocialInputs] = useState(settings.socialLinks || { telegram: '', whatsapp: '', instagram: '' });
  const [teleBotToken, setTeleBotToken] = useState(settings.telegramBotToken || '');
  const [teleChatId, setTeleChatId] = useState(settings.telegramChatId || '');

  // Form States
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    imageUrls: [] as string[], 
    urlInput: '',
    affiliateLink: '', 
    category: categories[0] || '', 
    shortDescription: '' 
  });
  const [blogData, setBlogData] = useState({ title: '', excerpt: '', content: '' });

  useEffect(() => {
    if (editingProduct) {
      setFormData({
        name: editingProduct.name, price: editingProduct.price,
        imageUrls: editingProduct.imageUrls || [], urlInput: '',
        affiliateLink: editingProduct.affiliateLink,
        category: editingProduct.category, shortDescription: editingProduct.description || ''
      });
      setActiveTab('products');
    }
  }, [editingProduct]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        if (file.size > 2 * 1024 * 1024) {
          alert(`File "${file.name}" kegedean Babe! Maksimal 2MB ya. ✨`);
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, imageUrls: [...prev.imageUrls, reader.result as string] }));
        };
        reader.readAsDataURL(file);
      });
    }
    // Reset input agar bisa pilih file yang sama lagi
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addUrlImage = () => {
    if (formData.urlInput.trim()) {
      setFormData(prev => ({ 
        ...prev, 
        imageUrls: [...prev.imageUrls, prev.urlInput.trim()],
        urlInput: '' 
      }));
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index)
    }));
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
      alert(res.textResponse || "Berhasil diperbarui! ✨");
    } catch (e: any) { 
      setAiError(e.message); 
    } finally { setLoading(false); }
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
    alert("Data JSON berhasil disalin! 📋");
  };

  const handleManualAddCategory = () => {
    if (!newCatInput.trim()) return;
    if (categories.includes(newCatInput.trim())) {
      alert("Kategori sudah ada, Babe! ✨");
      return;
    }
    onAddCategory(newCatInput.trim());
    setNewCatInput('');
  };

  const handleManualDeleteCategory = (catToDelete: string) => {
    if (confirm(`Yakin mau hapus kategori "${catToDelete}"? Produk di kategori ini nggak akan hilang.`)) {
      const updated = categories.filter(c => c !== catToDelete);
      onUpdateCategories(updated);
    }
  };

  const handleChangePassword = () => {
    if (!newPassword || newPassword.length < 4) {
      alert("Password minimal 4 karakter ya, Babe! ✨");
      return;
    }
    onUpdateSettings({ ...settings, ownerPassword: newPassword });
    setNewPassword('');
    alert("Password Magic Key berhasil diganti! 🔑");
  };

  const handleSaveSocials = () => {
    onUpdateSettings({ ...settings, socialLinks: socialInputs });
    alert("Social links berhasil diupdate! 🌸");
  };

  const handleSaveTeleBot = () => {
    onUpdateSettings({ ...settings, telegramBotToken: teleBotToken, telegramChatId: teleChatId });
    alert("Konfigurasi Bot Telegram berhasil disimpan! 🤖");
  };

  const handleResetData = () => {
    if (confirm("⚠️ PERINGATAN KERAS! Ini bakal hapus SEMUA produk, blog, dan settingan kamu. Web bakal kembali ke nol. Kamu yakin banget?")) {
      localStorage.removeItem('bynu_site_state_v3');
      window.location.reload();
    }
  };

  const currentUrl = window.location.origin + window.location.pathname;

  return (
    <div className="bg-white rounded-[3.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.1)] p-8 md:p-14 max-w-5xl mx-auto border-4 border-slate-50 relative overflow-hidden">
      {showToast && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] bg-pink-500 text-white px-8 py-4 rounded-2xl shadow-2xl font-black flex items-center gap-3 animate-in slide-in-from-top-10">
          <span>🚀 Success! Produk sudah live! ✨</span>
          <button onClick={() => setShowToast(false)}>×</button>
        </div>
      )}

      {/* Main Tab Navigation */}
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
             if (formData.imageUrls.length === 0) { alert("Masukin minimal satu foto dulu ya! 📸"); return; }
             setLoading(true);
             try {
               const aiRes = await generateProductContent(formData.name, formData.category);
               setBlogData({ title: aiRes.blogTitle, excerpt: aiRes.blogExcerpt, content: aiRes.blogContent });
               setFormData(f => ({...f, shortDescription: aiRes.shortDescription}));
               setReviewMode(true);
             } catch (err) {
               alert("AI lagi sibuk, coba bentar lagi ya!");
             } finally {
               setLoading(false);
             }
           }} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nama Produk</label>
                  <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold focus:ring-4 focus:ring-pink-100 transition-all outline-none" placeholder="Contoh: Lampu Tidur Awan" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Kategori</label>
                  <select className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Foto Produk (Bisa banyak! ✨)</label>
                <div className="space-y-6">
                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                    <button type="button" onClick={() => setImageMode('url')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${imageMode === 'url' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>URL Website</button>
                    <button type="button" onClick={() => setImageMode('file')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${imageMode === 'file' ? 'bg-white shadow-sm' : 'text-slate-400'}`}>Upload File</button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {imageMode === 'url' ? (
                      <div className="flex gap-2">
                        <input className="flex-1 rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold text-sm outline-none" placeholder="Paste link gambar..." value={formData.urlInput} onChange={e => setFormData({...formData, urlInput: e.target.value})} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrlImage())} />
                        <button type="button" onClick={addUrlImage} className="px-6 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase">Add</button>
                      </div>
                    ) : (
                      <div className="relative">
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" multiple className="hidden" />
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full py-4 rounded-2xl border-4 border-dashed border-slate-100 text-slate-400 font-black hover:border-pink-200 hover:text-pink-400 transition-all flex flex-col items-center justify-center gap-1 group">
                          <span className="text-xl group-hover:scale-125 transition-transform">📸</span>
                          <span className="text-[10px] uppercase tracking-widest">Pilih Gambar (Banyak)</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Previews Grid */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                    {formData.imageUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 group">
                        <img src={url} className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => removeImage(idx)} 
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {formData.imageUrls.length === 0 && (
                      <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-50 rounded-[2rem] text-slate-300 font-black uppercase text-[10px] tracking-widest">
                        Belum ada foto terpilih... 🖼️
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Harga</label>
                  <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold outline-none" placeholder="Rp 0" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Link Affiliate</label>
                  <input required className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold outline-none" placeholder="https://..." value={formData.affiliateLink} onChange={e => setFormData({...formData, affiliateLink: e.target.value})} />
                </div>
              </div>

              <button disabled={loading} type="submit" className="w-full py-7 rounded-[2rem] bg-slate-900 text-white font-black text-xl hover:bg-black hover:scale-[1.02] transition-all disabled:opacity-50 shadow-2xl active:scale-95">
                {loading ? 'AI lagi nulis Diary... ✨' : 'Generate Diary & Publish 📖'}
              </button>
           </form>
        </div>
      )}

      {/* ... (Tab AI, SYSTEM, DESIGN tetap sama) */}
      {activeTab === 'ai' && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4">
           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] p-10 md:p-14 text-white shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
             <h3 className="text-3xl font-serif font-black mb-2 relative z-10">Magic System Architect 🪄</h3>
             <p className="text-slate-400 text-xs font-medium mb-8 uppercase tracking-[0.2em] relative z-10">Kendalikan web kamu cuma lewat chat!</p>
             
             {aiError && (
               <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl text-xs font-black mb-6 animate-in slide-in-from-top-2">
                 ⚠️ ERROR: {aiError}
               </div>
             )}

             <textarea 
               value={aiPrompt} 
               onChange={e => setAiPrompt(e.target.value)} 
               className="w-full bg-white/5 border-none ring-1 ring-white/10 rounded-3xl px-8 py-6 mb-6 font-bold text-lg placeholder:text-slate-600 focus:ring-white/20 transition-all outline-none" 
               placeholder="Contoh: 'Tambahkan aketgori Skincare 🧴' atau 'Ganti tema jadi Ungu 🍇'" 
               rows={4} 
             />
             
             <button onClick={handleAiAction} disabled={loading || !aiPrompt} className="w-full bg-indigo-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] shadow-xl active:scale-95 transition-all disabled:opacity-20 flex items-center justify-center gap-4">
               {loading ? (
                 <>
                   <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                   <span>Processing Evolution...</span>
                 </>
               ) : (
                 <>
                   <span>Confirm Evolution 🍓</span>
                 </>
               )}
             </button>
           </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="space-y-10 animate-in slide-in-from-right-4 pb-20">
          <div className="bg-pink-50 p-8 rounded-[3rem] border-2 border-pink-100 shadow-sm">
            <h4 className="font-black text-pink-500 text-sm uppercase tracking-widest mb-4">Share Center 🍓</h4>
            <p className="text-slate-500 text-xs mb-6 font-medium leading-relaxed">
              Babe, kalau link kamu minta login Vercel, masuk ke <b>Vercel Dashboard > Settings > Deployment Protection</b> lalu matikan <b>"Vercel Authentication"</b> ya! ✨
            </p>
            <div className="bg-white rounded-2xl p-4 flex items-center justify-between border border-pink-100 gap-4">
              <span className="text-[10px] font-bold text-slate-400 truncate">{currentUrl}</span>
              <button 
                onClick={() => { navigator.clipboard.writeText(currentUrl); alert("Link website kamu berhasil disalin! 🍓"); }}
                className="px-4 py-2 bg-pink-500 text-white text-[10px] font-black rounded-lg uppercase whitespace-nowrap"
              >
                Copy Link
              </button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-1">Maintenance Mode 😴</h4>
              <p className="text-slate-400 text-[10px] font-bold">Aktifkan untuk menyembunyikan web sementara.</p>
            </div>
            <button 
              onClick={() => onUpdateSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
              className={`w-16 h-8 rounded-full transition-all relative ${settings.maintenanceMode ? 'bg-pink-500' : 'bg-slate-200'}`}
            >
              <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${settings.maintenanceMode ? 'left-9' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Manual Category Manager 📁</h4>
            <div className="flex flex-wrap gap-3 mb-8">
              {categories.map(cat => (
                <div key={cat} className="flex items-center gap-2 px-5 py-2 rounded-full bg-slate-50 border border-slate-100 text-sm font-bold text-slate-600">
                  <span>{cat}</span>
                  <button onClick={() => handleManualDeleteCategory(cat)} className="text-red-300 hover:text-red-500 transition-colors">🗑️</button>
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <input value={newCatInput} onChange={e => setNewCatInput(e.target.value)} className="flex-1 rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold outline-none" placeholder="Nama kategori baru..." onKeyDown={e => e.key === 'Enter' && handleManualAddCategory()} />
              <button onClick={handleManualAddCategory} className="px-8 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest hover:bg-black transition-all">ADD ➕</button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Social Links Manager 📸</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Telegram URL</label>
                 <input className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold text-sm outline-none" value={socialInputs.telegram} onChange={e => setSocialInputs({...socialInputs, telegram: e.target.value})} placeholder="https://t.me/..." />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4">WhatsApp Link</label>
                 <input className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold text-sm outline-none" value={socialInputs.whatsapp} onChange={e => setSocialInputs({...socialInputs, whatsapp: e.target.value})} placeholder="https://wa.me/..." />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Instagram URL</label>
                 <input className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold text-sm outline-none" value={socialInputs.instagram} onChange={e => setSocialInputs({...socialInputs, instagram: e.target.value})} placeholder="https://instagram.com/..." />
               </div>
            </div>
            <button onClick={handleSaveSocials} className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest">Update Social Links ✨</button>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Telegram Auto-Post Bot 🤖</h4>
            <div className="grid grid-cols-1 gap-6 mb-8">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Telegram Bot Token</label>
                 <input className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold text-sm outline-none" value={teleBotToken} onChange={e => setTeleBotToken(e.target.value)} placeholder="000000000:AAxxxxxxxxx..." />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Telegram Chat ID</label>
                 <input className="w-full rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold text-sm outline-none" value={teleChatId} onChange={e => setTeleChatId(e.target.value)} placeholder="-100xxxxxxxxxx" />
               </div>
            </div>
            <button onClick={handleSaveTeleBot} className="w-full py-4 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg">Save Bot Config 🤖</button>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Security (Magic Key) 🔑</h4>
            <div className="flex gap-3">
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="flex-1 rounded-2xl ring-1 ring-slate-100 bg-slate-50 px-6 py-4 font-bold outline-none" placeholder="Masukkan password baru..." />
              <button onClick={handleChangePassword} className="px-8 rounded-2xl bg-indigo-500 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all">CHANGE 🔑</button>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-sm">
            <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest mb-6">Backup & Data 🛡️</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={handleExportData} className="py-4 rounded-xl border-2 border-slate-900 font-black text-xs uppercase tracking-widest hover:bg-slate-50">Download Backup</button>
              <button onClick={handleCopyJson} className="py-4 rounded-xl bg-slate-900 text-white font-black text-xs uppercase tracking-widest shadow-lg">Copy JSON</button>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-[3rem] border-2 border-red-100 shadow-sm">
            <h4 className="font-black text-red-500 text-sm uppercase tracking-widest mb-6">Danger Zone ⚠️</h4>
            <button onClick={handleResetData} className="w-full py-5 rounded-2xl bg-red-500 text-white font-black text-xs uppercase tracking-widest shadow-lg hover:bg-red-600 transition-all">Factory Reset (Hapus Semua) 🧨</button>
          </div>
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

      {reviewMode && (
        <div className="fixed inset-0 z-[100] bg-white p-10 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-4xl font-serif font-black text-center">Review Diary Post 📖</h2>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Blog Title</label>
               <input className="w-full text-2xl font-black border-none ring-1 ring-slate-100 p-6 rounded-2xl outline-none" value={blogData.title} onChange={e => setBlogData({...blogData, title: e.target.value})} />
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-300">Blog Content</label>
               <textarea className="w-full min-h-[400px] border-none ring-1 ring-slate-100 p-8 rounded-2xl font-medium leading-relaxed outline-none" value={blogData.content} onChange={e => setBlogData({...blogData, content: e.target.value})} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setReviewMode(false)} className="flex-1 py-5 rounded-2xl bg-slate-100 font-black uppercase tracking-widest text-xs">Cancel</button>
              <button disabled={isPublishing} onClick={async () => {
                setIsPublishing(true);
                const p: Product = { 
                  id: crypto.randomUUID(), 
                  name: formData.name,
                  price: formData.price,
                  imageUrls: formData.imageUrls,
                  affiliateLink: formData.affiliateLink,
                  category: formData.category,
                  description: formData.shortDescription, 
                  createdAt: Date.now() 
                };
                onAddProduct(p, blogData);
                setIsPublishing(false);
                setReviewMode(false);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
                setFormData({ name: '', price: '', imageUrls: [], urlInput: '', affiliateLink: '', category: categories[0] || '', shortDescription: '' });
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
