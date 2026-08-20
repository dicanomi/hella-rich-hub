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
    const canonicalUrl = `https://hella.rich${window.location.pathname}`;

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
    const ogUrl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrl) ogUrl.content = canonicalUrl;
    const twitterUrl = document.querySelector<HTMLMetaElement>('meta[name="twitter:url"]');
    if (twitterUrl) twitterUrl.content = canonicalUrl;
    const twitterTitle = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = `${title} — hella.rich`;
    const twitterDesc = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.content = description;

    let canonical = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    // Restore on unmount
    return () => {
      document.title = 'hella.rich — AI-Native Product Lab';
    };
  }, [title, description, keywords]);

  return null;
}
