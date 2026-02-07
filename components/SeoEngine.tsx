
import React, { useEffect } from 'react';
import { Product, BlogPost } from '../types';

interface SeoEngineProps {
  title?: string;
  description?: string;
  image?: string;
  product?: Product;
  blog?: BlogPost;
}

const SeoEngine: React.FC<SeoEngineProps> = ({ title, description, image, product, blog }) => {
  useEffect(() => {
    // Update Document Title
    const siteTitle = title ? `${title} | Bynu's Recommendation` : "Bynu's Recommendation - Premium Product Curator";
    document.title = siteTitle;

    // Update Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      document.head.appendChild(metaDesc);
    }
    const finalDesc = description || "Handpicked product recommendations with love and ceria energy from Bynu.";
    metaDesc.setAttribute('content', finalDesc);

    // Update OpenGraph (Social Media Share)
    const updateOg = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    updateOg('og:title', siteTitle);
    updateOg('og:description', finalDesc);
    if (image) updateOg('og:image', image);

    // Schema.org Markup (JSON-LD) for Google
    const existingSchema = document.getElementById('bynu-schema');
    if (existingSchema) existingSchema.remove();

    if (product || blog) {
      const schemaData = product ? {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.name,
        "image": [product.imageUrl],
        "description": product.description,
        "brand": { "@type": "Brand", "name": "Bynu's Choice" },
        "offers": {
          "@type": "Offer",
          "price": product.price.replace(/[^0-9.-]+/g,""),
          "priceCurrency": "IDR",
          "availability": "https://schema.org/InStock",
          "url": window.location.href
        }
      } : {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": blog?.title,
        "description": blog?.excerpt,
        "image": image,
        "author": { "@type": "Person", "name": "Bynu" }
      };

      const script = document.createElement('script');
      script.id = 'bynu-schema';
      script.type = 'application/ld+json';
      script.text = JSON.stringify(schemaData);
      document.head.appendChild(script);
    }

  }, [title, description, image, product, blog]);

  return null;
};

export default SeoEngine;
