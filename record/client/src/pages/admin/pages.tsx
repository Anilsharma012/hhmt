import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation, Link } from 'wouter';

export default function AdminPages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
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

  const { data: list } = useQuery({ queryKey: ['/api/admin/pages'] });
  const pages = (list as any)?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/pages'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    queryClient.invalidateQueries({ queryKey: ['/api/pages', { footer: true }] });
    queryClient.invalidateQueries({ queryKey: ['/api/pages/version'] });
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
      toast({ title: 'Page saved' });
      setForm({ id: '', title: '', slug: '', contentHtml: '', status: 'draft', showInFooter: true, footerOrder: 1, seoTitle: '', seoDescription: '', ogImage: '' });
      invalidate();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (form.status === 'published' && (!form.title || !form.contentHtml)) {
        throw new Error('Title and content are required to publish');
      }
      const res = await apiRequest('PUT', `/api/admin/pages/${form.id}`, form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Page updated' });
      setForm({ id: '', title: '', slug: '', contentHtml: '', status: 'draft', showInFooter: true, footerOrder: 1, seoTitle: '', seoDescription: '', ogImage: '' });
      invalidate();
    }
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
  };

  const publishToggle = async (p: any) => {
    const next = p.status === 'published' ? 'draft' : 'published';
    if (next === 'published' && (!p.title || !p.contentHtml)) {
      toast({ title: 'Please add title and content before publishing.' });
      return;
    }
    await apiRequest('PUT', `/api/admin/pages/${p._id}`, { status: next });
    invalidate();
  };

  const onPreview = (p: any) => {
    const to = p.slug ? `/p/${p.slug}` : '/';
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
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Pages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pages.map((p: any) => (
                    <div key={p._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.title} {p.status === 'published' ? <span className="text-xs text-green-700 ml-2">(published)</span> : <span className="text-xs text-yellow-700 ml-2">(draft)</span>}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onPreview(p)}>Preview</Button>
                        <Button variant="outline" size="sm" onClick={() => publishToggle(p)}>{p.status === 'published' ? 'Unpublish' : 'Publish'}</Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(p)}>Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{form.id ? 'Edit Page' : 'Create Page'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
                <Input placeholder="Slug (e.g., about)" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
                <Textarea placeholder="Content (HTML)" value={form.contentHtml} onChange={e => setForm({ ...form, contentHtml: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-2">
                    <input type="checkbox" checked={form.showInFooter} onChange={e => setForm({ ...form, showInFooter: e.target.checked })} />
                    Show in footer
                  </label>
                  <Input type="number" placeholder="Footer order" value={form.footerOrder} onChange={e => setForm({ ...form, footerOrder: Number(e.target.value || 1) })} />
                </div>
                <Input placeholder="SEO title" value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} />
                <Textarea placeholder="SEO description" value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} />
                <Input placeholder="OG image URL" value={form.ogImage} onChange={e => setForm({ ...form, ogImage: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={() => (form.id ? updateMutation.mutate() : createMutation.mutate())}>
                    {form.id ? 'Update' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={() => setForm({ id: '', title: '', slug: '', contentHtml: '', status: 'draft', showInFooter: true, footerOrder: 1, seoTitle: '', seoDescription: '', ogImage: '' })}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
