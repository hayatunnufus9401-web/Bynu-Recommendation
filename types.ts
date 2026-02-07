
export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  affiliateLink: string;
  category: string;
  createdAt: number;
}

export interface BlogPost {
  id: string;
  productId: string;
  title: string;
  content: string;
  excerpt: string;
  createdAt: number;
}

export interface SiteSettings {
  logoUrl: string;
  siteName: string;
  primaryColor: string;
  backgroundColor: string;
  fontFamily: 'serif' | 'sans';
  heroTitle: string;
  heroSubtitle: string;
  customCss?: string;
  telegramBotToken?: string;
  telegramChatId?: string;
  // Added missing properties
  ownerPassword?: string;
  maintenanceMode?: boolean;
  socialLinks?: {
    telegram: string;
    whatsapp: string;
    instagram: string;
  };
  features: {
    showPrice: boolean;
    showCategories: boolean;
    enableAnimations: boolean;
    blogLayout: 'classic' | 'modern';
  };
}

export interface AppState {
  products: Product[];
  blogs: BlogPost[];
  categories: string[];
  settings: SiteSettings;
}