import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { sanitizeHtml } from '@/lib/utils';
import { Link } from 'wouter';

export default function Blogs() {
  const [page, setPage] = useState(1);
  const { data: ver } = useQuery({ queryKey: ['/api/blogs/version'] });
  const { data } = useQuery({ queryKey: ['/api/blogs', { page, limit: 9, v: (ver as any)?.version || 0 }], enabled: !!ver });
  const items = (data as any)?.data || [];
  const total = (data as any)?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Blog</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((b: any) => (
            <Link key={b._id} to={`/blog/${b.slug}`} className="block border rounded overflow-hidden hover:shadow">
              {b.imageUrl && <img src={b.imageUrl} alt={b.title} className="w-full h-40 object-cover" />}
              <div className="p-4">
                <h2 className="font-semibold text-lg mb-2">{b.title}</h2>
                <div className="text-xs text-muted-foreground mb-2">{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : ''}</div>
                <p className="text-sm text-muted-foreground line-clamp-3">{String(b.excerpt || '').trim()}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {(b.tags || []).map((t: string) => <span key={t} className="text-xs bg-muted px-2 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex items-center justify-between mt-6">
          <div className="text-xs text-muted-foreground">Page {page}</div>
          <div className="flex gap-2">
            <button className="border rounded px-3 py-1" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</button>
            <button className="border rounded px-3 py-1" disabled={(page*9)>=total} onClick={() => setPage(p=>p+1)}>Load more</button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
