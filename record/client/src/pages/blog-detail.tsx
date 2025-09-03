import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sanitizeHtml } from '@/lib/utils';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useRoute } from 'wouter';

export default function BlogDetail() {
  const [, params] = useRoute('/blog/:slug');
  const slug = params?.slug;

  const { data: ver } = useQuery({ queryKey: ['/api/blogs/version'] });
  const { data, isError } = useQuery({ queryKey: ['/api/blogs/' + slug, { v: (ver as any)?.version || 0 }], enabled: !!slug && !!ver });

  useEffect(() => {
    if (!data) return;
    const title = String((data as any).title || 'Blog');
    const desc = String((data as any).excerpt || '').slice(0, 200);
    document.title = `${title} – Posttrr`;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name','description'); document.head.appendChild(meta); }
    meta.setAttribute('content', desc);
    const imageUrl = (data as any).imageUrl;
    const ogt = document.querySelector('meta[property="og:title"]') || document.createElement('meta');
    ogt.setAttribute('property','og:title'); ogt.setAttribute('content', title); if (!ogt.parentElement) document.head.appendChild(ogt);
    const ogd = document.querySelector('meta[property="og:description"]') || document.createElement('meta');
    ogd.setAttribute('property','og:description'); ogd.setAttribute('content', desc); if (!ogd.parentElement) document.head.appendChild(ogd);
    if (imageUrl) {
      const ogi = document.querySelector('meta[property="og:image"]') || document.createElement('meta');
      ogi.setAttribute('property','og:image'); ogi.setAttribute('content', imageUrl); if (!ogi.parentElement) document.head.appendChild(ogi);
    }
  }, [data]);

  if (!slug) return null;
  if (isError || !data) return (
    <div className="min-h-screen bg-background"><Header /><main className="max-w-3xl mx-auto p-6"><h1 className="text-2xl font-bold">Not found</h1></main><Footer /></div>
  );

  const safe = sanitizeHtml(String((data as any).descriptionHtml || ''));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-2">{(data as any).title}</h1>
        <div className="text-sm text-muted-foreground mb-4">{(data as any).publishedAt ? new Date((data as any).publishedAt).toLocaleDateString() : ''}</div>
        {(data as any).imageUrl && <img src={(data as any).imageUrl} alt={(data as any).title} className="w-full h-72 object-cover rounded mb-6" />}
        <div className="flex flex-wrap gap-2 mb-6">{((data as any).tags || []).map((t: string) => <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded">{t}</span>)}</div>
        <article className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: safe }} />
      </main>
      <Footer />
    </div>
  );
}
