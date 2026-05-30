/**
 * HellaRichSEO — SEO meta tags stub
 * Sets document title and meta description for product pages.
 */
import { useEffect } from 'react';

interface HellaRichSEOProps {
  title?: string;
  description?: string;
  image?: string;
}

export function HellaRichSEO({ title, description }: HellaRichSEOProps) {
  useEffect(() => {
    if (title) document.title = `${title} — hella.rich`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta && description) meta.setAttribute('content', description);
  }, [title, description]);
  return null;
}
