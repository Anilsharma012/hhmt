import { useState, useMemo } from '@/../../node_modules/react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import TinyEditor from '@/components/admin/TinyEditor';

export default function AdminSettings() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [pageIndex, setPageIndex] = useState(1);
  const [form, setForm] = useState({
    id: '',
    title: '',
    slug: '',
    contentHtml: '',
    status: 'draft' as 'draft' | 'published',
    showInFooter: true,
    footerOrder: 1,
    seoTitle: '',
    seoDescription: '',
    ogImage: ''
  });
  const [slugLocked, setSlugLocked] = useState(true);

  const { data } = useQuery({
    queryKey: ['/api/admin/pages', { q, status: status === 'all' ? '' : status, page: pageIndex, limit: 10 }],
  });
  const items = data?.data || [];
  const totalPages = data?.pages || 1;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pages', { footer: true }] });
    queryClient.invalidateQueries({ queryKey: ['/api/pages/version'] });
  };

  const toast = (opts: { title: string }) => {
    try { (window as any).__TOASTER?.(opts.title); } catch {}
    console.log(opts.title);
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      if (form.status === 'published' && (!form.title || !form.contentHtml)) {
        throw new Error('Title and content are required to publish');
      }
      const res = await apiRequest('POST', '/api/admin/pages', form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Page created' });
      setForm({ id: '', title: '', slug: '', contentHtml: '', status: 'draft', showInFooter: true, footerOrder: 1, seoTitle: '', seoDescription: '', ogImage: '' });
      setSlugLocked(true);
      invalidate();
    },
    onError: (e: any) => toast({ title: e?.message || 'Failed to create' })
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!form.id) throw new Error('Select a page to update');
      if (form.status === 'published' && (!form.title || !form.contentHtml)) {
        throw new Error('Title and content are required to publish');
      }
      const res = await apiRequest('PUT', `/api/admin/pages/${form.id}`, form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Page updated' });
      invalidate();
    },
    onError: (e: any) => toast({ title: e?.message || 'Failed to update' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/pages/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Page deleted' });
      if (form.id) setForm({ id: '', title: '', slug: '', contentHtml: '', status: 'draft', showInFooter: true, footerOrder: 1, seoTitle: '', seoDescription: '', ogImage: '' });
      invalidate();
    },
    onError: (e: any) => toast({ title: e?.message || 'Failed to delete' })
  });

  const handleEdit = (p: any) => {
    setForm({
      id: p._id,
      title: p.title || '',
      slug: p.slug || '',
      contentHtml: p.contentHtml || '',
      status: p.status || 'draft',
      showInFooter: !!p.showInFooter,
      footerOrder: p.footerOrder ?? 1,
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || '',
      ogImage: p.ogImage || ''
    });
    setSlugLocked(true);
  };

  const onPreview = async () => {
    const res = await apiRequest('GET', '/api/admin/pages/preview-token/new');
    const json = await res.json();
    const token = json.token;
    const to = `/p/${form.slug}?preview=1&token=${encodeURIComponent(token)}`;
    window.open(to, '_blank');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
            <Button onClick={() => setLocation('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Site Settings</CardTitle>
              </CardHeader>
              <CardContent>
                Manage non-secret configuration options.
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-3">
                  <Input placeholder="Search title or slug" value={q} onChange={e => { setQ(e.target.value); setPageIndex(1); }} />
                  <select className="border rounded px-2" value={status} onChange={e => { setStatus(e.target.value as any); setPageIndex(1); }}>
                    <option value="all">All</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                  </select>
                  <Button onClick={() => { setForm({ id: '', title: '', slug: '', contentHtml: '', status: 'draft', showInFooter: true, footerOrder: 1, seoTitle: '', seoDescription: '', ogImage: '' }); setSlugLocked(true); }}>Create</Button>
                </div>
                <div className="space-y-2">
                  {items.map((p: any) => (
                    <div key={p._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.title} {p.status === 'published' ? <span className="text-xs text-green-700 ml-2">(published)</span> : <span className="text-xs text-yellow-700 ml-2">(draft)</span>}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>Edit</Button>
                        <Button variant="outline" size="sm" onClick={() => deleteMutation.mutate(p._id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="text-xs text-muted-foreground">Page {data?.page || 1} of {totalPages}</div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" disabled={(data?.page || 1) <= 1} onClick={() => setPageIndex((p) => Math.max(1, p - 1))}>Prev</Button>
                    <Button variant="outline" size="sm" disabled={(data?.page || 1) >= totalPages} onClick={() => setPageIndex((p) => p + 1)}>Next</Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{form.id ? 'Edit Page' : 'Create Page'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <div className="flex gap-2">
                  <Input placeholder="Slug" value={form.slug} readOnly={slugLocked} onChange={e => setForm({ ...form, slug: e.target.value })} />
                  <Button type="button" variant="outline" onClick={() => { if (slugLocked) { if (confirm('Edit slug? This may affect links.')) setSlugLocked(false); } else setSlugLocked(true); }}>{slugLocked ? 'Edit' : 'Lock'}</Button>
                </div>
                <Wysiwyg value={form.contentHtml} onChange={(html) => setForm({ ...form, contentHtml: html })} />
                <div className="grid grid-cols-2 gap-2">
                  <select className="border rounded px-2" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                  <label className="text-xs text-muted-foreground flex items-center gap-2">
                    <input type="checkbox" checked={form.showInFooter} onChange={e => setForm({ ...form, showInFooter: e.target.checked })} />
                    Show in footer
                  </label>
                </div>
                <Input type="number" placeholder="Footer order" value={form.footerOrder} onChange={e => setForm({ ...form, footerOrder: Number(e.target.value || 1) })} />
                <Input placeholder="SEO title" value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} />
                <Input placeholder="SEO description" value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} />
                <Input placeholder="OG image URL" value={form.ogImage} onChange={e => setForm({ ...form, ogImage: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={() => (form.id ? updateMutation.mutate() : createMutation.mutate())}>
                    {form.id ? 'Update' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={() => setForm({ id: '', title: '', slug: '', contentHtml: '', status: 'draft', showInFooter: true, footerOrder: 1, seoTitle: '', seoDescription: '', ogImage: '' })}>Clear</Button>
                  <Button variant="outline" onClick={onPreview} disabled={!form.slug}>Preview</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
