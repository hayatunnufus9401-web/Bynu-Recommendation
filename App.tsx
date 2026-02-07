
import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { Product, BlogPost, AppState, SiteSettings } from './types';
import AdminPanel from './components/AdminPanel';
import ProductCard from './components/ProductCard';
import SeoEngine from './components/SeoEngine';
import { sendToTelegram } from './services/telegramService';

const INITIAL_SETTINGS: SiteSettings = {
  logoUrl: '✨',
  siteName: "Bynu's.rec",
  primaryColor: '#FF85A1',
  backgroundColor: '#FFFDF9',
  fontFamily: 'serif',
  heroTitle: 'Picked with love.',
  heroSubtitle: 'Welcome to my cozy corner! Here are all the lovely things I’ve found that I think you’ll adore. Happy browsing! 🍓',
  ownerPassword: '090401',
  maintenanceMode: false,
  socialLinks: {
    telegram: 'https://t.me/Bynurecommendation',
    whatsapp: '',
    instagram: ''
  },
  features: {
    showPrice: true,
    showCategories: true,
    enableAnimations: true,
    blogLayout: 'classic'
  }
};

const INITIAL_CATEGORIES = ['Tech ✨', 'Lifestyle 🌸', 'Fashion 👗', 'Home 🏠'];
const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Kawaii Mechanical Keyboard',
    description: 'Typing feels like clouds with these soft switches and pastel milk colors.',
    price: '$129.00',
    imageUrls: ['https://images.unsplash.com/photo-1595225476474-87563907a212?q=80&w=800&auto=format&fit=crop'],
    affiliateLink: 'https://example.com',
    category: 'Tech ✨',
    createdAt: Date.now() - 100000
  }
];

const INITIAL_BLOGS: BlogPost[] = [
  {
    id: 'b1',
    productId: '1',
    title: 'Your Desk Needs a Pastel Makeover! 🎀',
    excerpt: 'Is your desk looking a bit gray? This keyboard is the sparkle you need.',
    content: '# Typing in a Dreamland\n\nEver felt like your work is just... boring? It might be your tools! Switching to this mechanical keyboard changed everything for me.\n\n### Why it\'s a MUST-HAVE:\n- **The Sound**: It sounds like soft raindrops on a window.\n- **The Look**: It’s basically a piece of candy for your eyes.\n- **The Feel**: High quality build that lasts forever.\n\nTreat yourself to some sparkle today! ✨',
    createdAt: Date.now() - 100000
  }
];

const Header: React.FC<{ isAdmin: boolean; onLogoClick: () => void; onLogout: () => void; settings: SiteSettings }> = ({ isAdmin, onLogoClick, onLogout, settings }) => (
  <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-pink-100/30">
    <div className="container mx-auto px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button 
          onClick={onLogoClick}
          className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl transform hover:rotate-12 transition-transform shadow-lg active:scale-90"
          style={{ backgroundColor: settings.primaryColor }}
        >
          {settings.logoUrl}
        </button>
        <Link to="/" className={`text-2xl ${settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'} font-black tracking-tight text-slate-900`}>
          {settings.siteName.split('.')[0]}<span style={{ color: settings.primaryColor }}>.{settings.siteName.split('.')[1] || 'rec'}</span>
        </Link>
      </div>
      <nav className="flex items-center gap-6 md:gap-8">
        <Link to="/" className="text-sm font-bold text-slate-500 hover:text-pink-500 transition-colors">Favorites</Link>
        <Link to="/blogs" className="text-sm font-bold text-slate-500 hover:text-pink-500 transition-colors">Diary</Link>
        {isAdmin && (
          <button onClick={onLogout} className="text-[10px] font-black px-4 py-2 rounded-xl bg-slate-900 text-white shadow-md hover:bg-black transition-all">
            EXIT OWNER MODE
          </button>
        )}
      </nav>
    </div>
  </header>
);

const AdminPasswordModal: React.FC<{ isOpen: boolean; onClose: () => void; onSuccess: () => void; requiredPass: string }> = ({ isOpen, onClose, onSuccess, requiredPass }) => {
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  if (!isOpen) return null;
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pass === (requiredPass || "090401")) { onSuccess(); setPass(''); setError(false); }
    else { setError(true); setPass(''); }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md transition-all">
      <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center text-pink-500 text-3xl mx-auto mb-4">🔑</div>
          <h2 className="text-2xl font-serif font-black text-slate-800">Owner Access</h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Please enter your magic key, Bynu. ✨</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input autoFocus type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false); }} className={`w-full bg-slate-50 border-none ring-2 ${error ? 'ring-red-300' : 'ring-slate-100'} rounded-2xl px-6 py-4 text-center text-lg font-bold tracking-[0.5em] focus:ring-4 focus:ring-pink-300 transition-all`} placeholder="••••••" />
          {error && <p className="text-red-400 text-xs font-black text-center uppercase tracking-widest animate-bounce">Wrong key! 🌸</p>}
          <button type="submit" className="w-full py-4 rounded-2xl bg-pink-500 text-white font-black uppercase tracking-widest text-sm shadow-lg shadow-pink-200 hover:bg-pink-600 transition-all active:scale-95">Unlock Magic</button>
          <button type="button" onClick={onClose} className="w-full text-slate-300 text-[10px] font-black uppercase tracking-widest">Cancel</button>
        </form>
      </div>
    </div>
  );
};

const MaintenanceScreen: React.FC<{ settings: SiteSettings; onSecretTrigger: () => void }> = ({ settings, onSecretTrigger }) => (
  <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-10 text-center text-white overflow-hidden relative">
    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
       <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-pink-500 rounded-full blur-[120px] animate-pulse"></div>
       <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full blur-[150px] animate-pulse delay-1000"></div>
    </div>
    <button 
      onClick={onSecretTrigger}
      className="text-8xl mb-8 floating cursor-default hover:scale-110 transition-transform"
    >
      😴
    </button>
    <h1 className="text-5xl font-serif font-black mb-4 tracking-tight">Bynu is Dreaming...</h1>
    <p className="text-slate-400 font-medium max-w-md mx-auto leading-relaxed">
      Web lagi Bynu dekor ulang supaya makin estetik buat kamu! Cek lagi nanti ya, <span className="text-pink-400 font-bold">Babe! ✨</span>
    </p>
    <div className="mt-12 flex gap-4">
      {settings.socialLinks?.telegram && (
         <a href={settings.socialLinks.telegram} target="_blank" className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all">Telegram</a>
      )}
    </div>
  </div>
);

const SearchBar: React.FC<{ value: string; onChange: (v: string) => void; placeholder: string; primaryColor: string }> = ({ value, onChange, placeholder, primaryColor }) => (
  <div className="relative max-w-2xl mx-auto mb-12 group">
    <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
      <svg className="w-5 h-5 text-slate-400 group-focus-within:text-pink-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
      </svg>
    </div>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border-2 border-slate-100 rounded-[2rem] pl-14 pr-8 py-5 font-bold text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:border-transparent transition-all shadow-sm group-hover:shadow-md"
      style={{ '--tw-ring-color': `${primaryColor}33` } as any}
      placeholder={placeholder}
    />
    {value && (
      <button onClick={() => onChange('')} className="absolute inset-y-0 right-0 pr-6 flex items-center text-slate-300 hover:text-slate-500 transition-colors">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    )}
  </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('bynu_site_state_v3');
    return saved ? JSON.parse(saved) : {
      products: INITIAL_PRODUCTS,
      blogs: INITIAL_BLOGS,
      categories: INITIAL_CATEGORIES,
      settings: INITIAL_SETTINGS
    };
  });

  const [isAdmin, setIsAdmin] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem('bynu_site_state_v3', JSON.stringify(state));
    document.body.style.backgroundColor = state.settings.backgroundColor;
    
    const existingStyle = document.getElementById('bynu-custom-css');
    if (existingStyle) existingStyle.remove();
    if (state.settings.customCss) {
      const styleEl = document.createElement('style');
      styleEl.id = 'bynu-custom-css';
      styleEl.innerHTML = state.settings.customCss;
      document.head.appendChild(styleEl);
    }
  }, [state]);

  if (state.settings.maintenanceMode && !isAdmin) {
    return (
      <>
        <MaintenanceScreen settings={state.settings} onSecretTrigger={() => setClickCount(c => c+1)} />
        {clickCount >= 5 && (
          <AdminPasswordModal 
            isOpen={true} 
            onClose={() => setClickCount(0)} 
            requiredPass={state.settings.ownerPassword || "090401"}
            onSuccess={() => { setIsAdmin(true); setClickCount(0); }} 
          />
        )}
      </>
    );
  }

  const addProduct = (product: Product, blogContent: { title: string, content: string, excerpt: string }) => {
    const newBlog: BlogPost = { id: crypto.randomUUID(), productId: product.id, title: blogContent.title, content: blogContent.content, excerpt: blogContent.excerpt, createdAt: Date.now() };
    setState(prev => ({ ...prev, products: [product, ...prev.products], blogs: [newBlog, ...prev.blogs] }));
    
    const blogUrl = `${window.location.origin}${window.location.pathname}#/blog/${product.id}`;
    // Call permanent service (locked token & chatid)
    sendToTelegram(product, blogUrl);
  };

  const deleteProduct = (id: string) => {
    if (confirm("Yakin mau hapus produk dan diary ini, Babe? ✨")) {
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.id !== id),
        blogs: prev.blogs.filter(b => b.productId !== id)
      }));
    }
  };

  const updateProduct = (updated: Product) => setState(prev => ({ ...prev, products: prev.products.map(p => p.id === updated.id ? updated : p) }));
  const updateCategories = (categories: string[]) => setState(prev => ({ ...prev, categories }));
  const addCategory = (category: string) => setState(prev => ({ ...prev, categories: [...prev.categories, category] }));
  const updateSettings = (settings: SiteSettings) => setState(prev => ({ ...prev, settings }));
  const updateBlog = (id: string, content: string) => setState(prev => ({ ...prev, blogs: prev.blogs.map(b => b.id === id ? { ...b, content } : b) }));
  const importState = (newState: AppState) => setState(newState);

  return (
    <HashRouter>
      <div className={`min-h-screen ${state.settings.fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}>
        <Header settings={state.settings} isAdmin={isAdmin} onLogoClick={() => setClickCount(c => c+1)} onLogout={() => setIsAdmin(false)} />
        {clickCount >= 5 && <AdminPasswordModal requiredPass={state.settings.ownerPassword || "090401"} isOpen={true} onClose={() => setClickCount(0)} onSuccess={() => { setIsAdmin(true); setClickCount(0); }} />}

        <Routes>
          <Route path="/" element={
            <Home state={state} isAdmin={isAdmin} 
              onAddProduct={addProduct} 
              onUpdateProduct={updateProduct}
              onDeleteProduct={deleteProduct}
              onAddCategory={addCategory}
              onUpdateCategories={updateCategories}
              onUpdateSettings={updateSettings}
              onUpdateBlog={updateBlog}
              onImportState={importState}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          } />
          <Route path="/blogs" element={<BlogList blogs={state.blogs} products={state.products} settings={state.settings} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />} />
          <Route path="/blog/:id" element={<BlogView blogs={state.blogs} products={state.products} settings={state.settings} />} />
        </Routes>

        <footer className="bg-white border-t border-slate-50 py-20 mt-32 text-center">
          <div className="text-3xl font-black mb-4">{state.settings.siteName}</div>
          <p className="text-slate-400 font-medium mb-12">Handpicking happiness, one item at a time. 🌸</p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12 -mt-6">
            {state.settings.socialLinks?.telegram && (
              <a href={state.settings.socialLinks.telegram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-8 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 group shadow-sm hover:shadow-md">
                <span className="text-sm font-bold" style={{ color: state.settings.primaryColor }}>Join Telegram Bynu ✨</span>
              </a>
            )}
            {state.settings.socialLinks?.instagram && (
              <a href={state.settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 group shadow-sm hover:shadow-md">
                <span className="text-sm font-bold" style={{ color: state.settings.primaryColor }}>Instagram 📸</span>
              </a>
            )}
            {state.settings.socialLinks?.whatsapp && (
              <a href={state.settings.socialLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-all border border-slate-100 group shadow-sm hover:shadow-md">
                <span className="text-sm font-bold" style={{ color: state.settings.primaryColor }}>WhatsApp 💬</span>
              </a>
            )}
          </div>
          <div className="text-slate-300 text-[10px] font-black uppercase tracking-widest">© 2024 BYNU'S RECOMMENDATION</div>
        </footer>
      </div>
    </HashRouter>
  );
};

const Home: React.FC<{ state: AppState; isAdmin: boolean; onAddProduct: any; onUpdateProduct: any; onDeleteProduct: any; onAddCategory: any; onUpdateCategories: any; onUpdateSettings: any; onUpdateBlog: any; onImportState: any; searchQuery: string; setSearchQuery: (s: string) => void }> = ({ state, isAdmin, searchQuery, setSearchQuery, ...props }) => {
  const [selectedCat, setSelectedCat] = useState('All');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const navigate = useNavigate();

  const filteredProducts = useMemo(() => {
    let result = state.products;
    if (selectedCat !== 'All') result = result.filter(p => p.category === selectedCat);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => {
        const blog = state.blogs.find(b => b.productId === p.id);
        const nameMatch = p.name.toLowerCase().includes(q);
        const descMatch = p.description.toLowerCase().includes(q);
        const blogMatch = blog ? (blog.title.toLowerCase().includes(q) || blog.content.toLowerCase().includes(q)) : false;
        return nameMatch || descMatch || blogMatch;
      });
    }
    return result;
  }, [state.products, state.blogs, selectedCat, searchQuery]);

  return (
    <main className="container mx-auto px-6 py-12">
      <SeoEngine />
      <section className="mb-12 text-center max-w-4xl mx-auto relative py-20">
        <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 leading-[1.1]">
          {state.settings.heroTitle.split(' ').slice(0, -1).join(' ')} <span style={{ color: state.settings.primaryColor }} className="italic">{state.settings.heroTitle.split(' ').pop()}</span>
        </h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto mb-12">{state.settings.heroSubtitle}</p>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Cari produk atau intip diary Bynu... ✨" primaryColor={state.settings.primaryColor} />
      </section>

      {isAdmin && (
        <section className="mb-24">
          <AdminPanel onAddProduct={props.onAddProduct} onUpdateProduct={props.onUpdateProduct} editingProduct={editingProduct} onCancelEdit={() => setEditingProduct(null)} categories={state.categories} onAddCategory={props.onAddCategory} onUpdateCategories={props.onUpdateCategories} settings={state.settings} onUpdateSettings={props.onUpdateSettings} onUpdateBlog={props.onUpdateBlog} allBlogs={state.blogs} fullState={state} onImportState={props.onImportState} />
        </section>
      )}

      {state.settings.features.showCategories && (
        <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
          <button onClick={() => setSelectedCat('All')} className={`px-8 py-3 rounded-[2rem] text-sm font-black transition-all ${selectedCat === 'All' ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border border-slate-100'}`}>All Goodies</button>
          {state.categories.map(cat => <button key={cat} onClick={() => setSelectedCat(cat)} className={`px-8 py-3 rounded-[2rem] text-sm font-black transition-all ${selectedCat === cat ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-white text-slate-400 border border-slate-100'}`}>{cat}</button>)}
        </div>
      )}

      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {filteredProducts.map(p => <ProductCard key={p.id} product={p} isAdmin={isAdmin} showPrice={state.settings.features.showPrice} onEdit={() => {setEditingProduct(p); window.scrollTo(0,0);}} onDelete={() => props.onDeleteProduct(p.id)} onViewBlog={id => navigate(`/blog/${id}`)} />)}
        </div>
      ) : (
        <div className="text-center py-24 px-10 bg-pink-50/50 backdrop-blur-md rounded-[5rem] border-4 border-dashed border-pink-100 shadow-2xl shadow-pink-100/30 group animate-in zoom-in-95 duration-1000">
          <div className="relative inline-block mb-10">
            <div className="absolute inset-0 bg-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
            <img src="https://img.freepik.com/free-vector/sad-cute-rabbit-cartoon-vector-icon-illustration-animal-nature-icon-concept-isolated_138676-2139.jpg" alt="Cute Pink Sad Rabbit" className="w-56 h-56 object-contain rounded-full bg-white p-6 shadow-2xl border-[10px] border-white transform group-hover:scale-110 group-hover:rotate-2 transition-all duration-700 relative z-10" />
            <div className="absolute -bottom-4 -right-4 bg-pink-100 w-16 h-16 rounded-full flex items-center justify-center shadow-xl text-3xl animate-bounce border-4 border-white z-20">🎀</div>
          </div>
          <h3 className="text-3xl md:text-5xl font-serif font-bold text-pink-900/80 mb-6 tracking-tight leading-tight">Yah, Bynu belum nemu nih...</h3>
          <p className="text-xl text-pink-400/80 font-semibold max-w-sm mx-auto leading-relaxed italic">Coba cari pakai kata kunci lain ya, <span className="text-pink-500 font-black not-italic underline decoration-pink-200 underline-offset-8">Babe! ✨</span></p>
        </div>
      )}
    </main>
  );
};

const BlogList: React.FC<{ blogs: BlogPost[]; products: Product[]; settings: SiteSettings; searchQuery: string; setSearchQuery: (s: string) => void }> = ({ blogs, products, settings, searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const filteredBlogs = useMemo(() => {
    let activeBlogs = blogs.filter(blog => products.some(p => p.id === blog.productId));
    if (!searchQuery.trim()) return activeBlogs;
    const q = searchQuery.toLowerCase();
    return activeBlogs.filter(blog => {
      const product = products.find(p => p.id === blog.productId);
      const titleMatch = blog.title.toLowerCase().includes(q);
      const contentMatch = blog.content.toLowerCase().includes(q);
      const prodMatch = product ? product.name.toLowerCase().includes(q) : false;
      return titleMatch || contentMatch || prodMatch;
    });
  }, [blogs, products, searchQuery]);

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl">
      <SeoEngine title="The Pink Diary" description="Read the stories and reviews behind Bynu's favorite picks." />
      <div className="text-center mb-12">
        <h1 className="text-5xl font-black text-slate-900 mb-6">The Pink Diary 📖</h1>
        <p className="text-slate-400 font-medium mb-10">Stories behind every piece.</p>
        <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Cari di dalam diary... 🖊️" primaryColor={settings.primaryColor} />
      </div>

      {filteredBlogs.length > 0 ? (
        <div className={`grid grid-cols-1 ${settings.features.blogLayout === 'classic' ? 'md:grid-cols-2' : 'lg:grid-cols-3'} gap-12`}>
          {filteredBlogs.sort((a,b) => b.createdAt - a.createdAt).map(blog => {
            const product = products.find(p => p.id === blog.productId);
            return (
              <div key={blog.id} onClick={() => navigate(`/blog/${blog.productId}`)} className="group bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-slate-50">
                <div className="aspect-[16/10] overflow-hidden"><img src={product?.imageUrls[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                <div className="p-10">
                  <span className="text-xs font-black uppercase tracking-[0.2em] mb-4 block" style={{ color: settings.primaryColor }}>{product?.category}</span>
                  <h2 className="text-3xl font-black text-slate-800 mb-4 line-clamp-2">{blog.title}</h2>
                  <p className="text-slate-500 font-medium mb-8 line-clamp-2">{blog.excerpt}</p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-24 px-10 bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-100">
          <div className="text-6xl mb-6 opacity-20">📖</div>
          <h3 className="text-2xl font-black text-slate-300">Diary-nya belum ketemu atau kosong...</h3>
        </div>
      )}
    </div>
  );
};

const BlogView: React.FC<{ blogs: BlogPost[]; products: Product[]; settings: SiteSettings }> = ({ blogs, products, settings }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const blog = blogs.find(b => b.productId === id);
  const product = products.find(p => p.id === id);

  if (!blog || !product) {
    return (
      <div className="container mx-auto px-6 py-40 text-center max-w-md">
        <div className="text-8xl mb-8 animate-bounce">🌸</div>
        <h2 className="text-3xl font-black text-slate-800 mb-4">Diary Tidak Ditemukan</h2>
        <p className="text-slate-400 font-medium mb-12">Mungkin diary ini sudah Bynu hapus atau dipindah ke tempat lain, Babe. ✨</p>
        <button onClick={() => navigate('/')} className="w-full py-5 bg-pink-500 text-white rounded-2xl font-black shadow-xl shadow-pink-100 uppercase tracking-widest hover:scale-105 transition-all">Balik ke Home Yuk!</button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl animate-in fade-in duration-700">
      <SeoEngine title={blog.title} description={blog.excerpt} image={product.imageUrls[0]} product={product} blog={blog} />
      
      {/* Gallery Section */}
      <div className="space-y-6 mb-12">
        {product.imageUrls.map((url, idx) => (
          <img key={idx} src={url} className="w-full object-cover rounded-[3rem] shadow-2xl" alt={`${product.name} view ${idx+1}`} />
        ))}
      </div>

      <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight text-center">{blog.title}</h1>
      
      <article className="prose max-w-none mb-16 text-slate-600 leading-relaxed text-lg bg-white p-10 md:p-16 rounded-[3.5rem] shadow-sm border border-slate-50">
        {blog.content.split('\n').map((l, i) => <p key={i} className="mb-6">{l.replace(/#|\*|###/g, '')}</p>)}
      </article>

      <div className="rounded-[3rem] p-8 md:p-16 text-white text-center shadow-2xl sticky bottom-10" style={{ backgroundColor: settings.primaryColor }}>
        <h2 className="text-2xl md:text-3xl font-black mb-8">Suka Barangnya? ✨</h2>
        <a href={product.affiliateLink} target="_blank" className="inline-block bg-white text-slate-900 px-12 py-5 rounded-[2rem] font-black hover:scale-110 transition-all shadow-lg text-lg">Beli Sekarang 🍓</a>
      </div>
    </div>
  );
};

export default App;
