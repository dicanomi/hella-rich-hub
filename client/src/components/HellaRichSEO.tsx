/**
 * HellaRichSEO — per-page SEO meta tags
 * Sets document.title, meta description, and meta keywords for each product page.
 * Title format: "<Product Name> — hella.rich" (30–60 chars)
 */
import { useEffect } from 'react';

interface HellaRichSEOProps {
  title: string;
  description: string;
  keywords: string;
}

export function HellaRichSEO({ title, description, keywords }: HellaRichSEOProps) {
  useEffect(() => {
    // Title: "Product Name — hella.rich"
    document.title = `${title} — hella.rich`;

    // Description
    let descMeta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!descMeta) {
      descMeta = document.createElement('meta');
      descMeta.name = 'description';
      document.head.appendChild(descMeta);
    }
    descMeta.content = description;

    // Keywords
    let kwMeta = document.querySelector<HTMLMetaElement>('meta[name="keywords"]');
    if (!kwMeta) {
      kwMeta = document.createElement('meta');
      kwMeta.name = 'keywords';
      document.head.appendChild(kwMeta);
    }
    kwMeta.content = keywords;

    // OG tags
    const ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = `${title} — hella.rich`;
    const ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = description;

    // Restore on unmount
    return () => {
      document.title = 'hella.rich — AI-Native Product Lab';
    };
  }, [title, description, keywords]);

  return null;
}
