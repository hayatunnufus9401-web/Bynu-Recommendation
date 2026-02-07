
import React from 'react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  isAdmin: boolean;
  showPrice: boolean;
  onEdit: () => void;
  onViewBlog: (productId: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, isAdmin, showPrice, onEdit, onViewBlog }) => {
  return (
    <div className="group bg-white rounded-[3rem] overflow-hidden border border-[#FFD6E0]/30 hover:shadow-[0_30px_60px_-15px_rgba(255,133,161,0.2)] transition-all duration-700 flex flex-col h-full transform hover:-translate-y-2 relative">
      {isAdmin && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#FF85A1] shadow-lg hover:scale-110 transition-transform active:scale-95"
          title="Edit Product"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
        </button>
      )}
      
      <div className="relative aspect-[1/1] overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        {showPrice && (
          <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-5 py-2 rounded-2xl text-sm font-black shadow-lg text-slate-800">
            {product.price}
          </div>
        )}
        <div className="absolute top-6 left-6 bg-[#7BDFF2] text-white px-4 py-1.5 rounded-2xl text-[10px] font-black tracking-widest uppercase shadow-md">
          {product.category}
        </div>
      </div>
      
      <div className="p-10 flex flex-col flex-1">
        <h3 className="text-2xl font-serif font-black mb-3 text-slate-800 line-clamp-1 group-hover:text-[#FF85A1] transition-colors">{product.name}</h3>
        <p className="text-slate-400 font-medium text-sm mb-8 line-clamp-2 flex-1 leading-relaxed">
          {product.description}
        </p>
        
        <div className="grid grid-cols-1 gap-3 mt-auto">
          <button
            onClick={() => onViewBlog(product.id)}
            className="w-full py-4 rounded-2xl border-2 border-[#FFD6E0] font-black text-[#FF85A1] hover:bg-[#FFD6E0]/10 transition-all text-sm uppercase tracking-widest active:scale-95"
          >
            Why Bynu Loves It ✨
          </button>
          <a
            href={product.affiliateLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center py-4 rounded-2xl bg-slate-900 text-white font-black hover:bg-black transition-all transform shadow-xl active:scale-95 text-sm uppercase tracking-widest"
          >
            Get it Now 🍓
          </a>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
