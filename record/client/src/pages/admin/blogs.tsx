import { useState, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import RichEditor from '@/components/admin/RichEditor';
import { Badge } from '@/components/ui/badge';

function Dropzone({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const fileInput = useRef<HTMLInputElement>(null);
  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = async () => {
      const body = { filename: file.name, data: String(reader.result) };
      const res = await fetch('/api/admin/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
      const json = await res.json();
      if (json?.url) onChange(json.url);
    };
    reader.readAsDataURL(file);
  }
  return (
    <div className="border rounded p-3 flex items-center gap-3">
      <div className="w-20 h-20 bg-muted flex items-center justify-center overflow-hidden rounded">
        {value ? <img src={value} alt="cover" className="object-cover w-full h-full" /> : <span className="text-xs text-muted-foreground">256×256 ok</span>}
      </div>
      <div className="flex-1">
        <div className="text-xs text-muted-foreground mb-1">Cover Image</div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => fileInput.current?.click()}>Upload</Button>
          {value && <Button type="button" variant="ghost" onClick={() => onChange('')}>Remove</Button>}
        </div>
        <input ref={fileInput} type="file" accept="image/*" className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>
    </div>
  );
}

function TagsInput({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (!value.includes(v)) onChange([...value, v]);
    setInput('');
  };
  const remove = (t: string) => onChange(value.filter(x => x !== t));
  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Input placeholder="Add tag and press Enter" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button type="button" onClick={add}>Add</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map(t => (
          <span key={t} className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded text-xs">
            {t}
            <button onClick={() => remove(t)} className="text-muted-foreground hover:text-foreground">×</button>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function AdminBlogs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [mode, setMode] = useState<'list' | 'edit'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', slug: '', imageUrl: '', tags: [] as string[], descriptionHtml: '', status: 'published' as 'draft'|'published' });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('-createdAt');
  const [page, setPage] = useState(1);

  const { data: ver } = useQuery({ queryKey: ['/api/blogs/version'] });
  const { data, isFetching } = useQuery({ queryKey: ['/api/admin/blogs', { search, status, page, limit: 10, sort, v: (ver as any)?.version || 0 }], enabled: mode === 'list' && !!user });
  const items = (data as any)?.data || [];
  const total = (data as any)?.total || 0;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/blogs'] });
    queryClient.invalidateQueries({ queryKey: ['/api/blogs'] });
    queryClient.invalidateQueries({ queryKey: ['/api/blogs/version'] });
  };

  const wordCount = useMemo(() => String(form.descriptionHtml || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length, [form.descriptionHtml]);

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title || !form.descriptionHtml) throw new Error('Title and description are required');
      const res = await apiRequest('POST', '/api/admin/blogs', form);
      return res.json();
    },
    onSuccess: () => { setMode('list'); setForm({ title: '', slug: '', imageUrl: '', tags: [], descriptionHtml: '', status: 'published' }); invalidate(); },
  });

  const update = useMutation({
    mutationFn: async () => {
      if (!editingId) throw new Error('No blog selected');
      const res = await apiRequest('PUT', `/api/admin/blogs/${editingId}`, form);
      return res.json();
    },
    onSuccess: () => { setMode('list'); setEditingId(null); invalidate(); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest('DELETE', `/api/admin/blogs/${id}`); return res.json(); },
    onSuccess: invalidate,
  });

  const startEdit = async (id?: string) => {
    if (!id) {
      const auto = String(form.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setForm((f) => ({ ...f, slug: auto }));
      setMode('edit'); setEditingId(null);
      return;
    }
    const res = await apiRequest('GET', `/api/admin/blogs/${id}`);
    const json = await res.json();
    setForm({ title: json.title || '', slug: json.slug || '', imageUrl: json.imageUrl || '', tags: json.tags || [], descriptionHtml: json.descriptionHtml || '', status: json.status || 'published' });
    setEditingId(id); setMode('edit');
  };

  const saveAndBack = () => {
    if (editingId) update.mutate();
    else create.mutate();
  };

  const exportCsv = () => {
    const headers = ['ID','Title','Slug','Image','Tags','Status','PublishedAt'];
    const rows = items.map((b: any) => [b._id, b.title, b.slug, b.imageUrl || '', (b.tags||[]).join('|'), b.status, b.publishedAt ? new Date(b.publishedAt).toISOString() : '']);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'blogs.csv'; a.click(); URL.revokeObjectURL(url);
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card><CardContent className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Access Denied</h1><Button onClick={() => setLocation('/')}>Go Home</Button></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Blogs</CardTitle>
                  {mode === 'list' && <Button onClick={() => { setForm({ title: '', slug: '', imageUrl: '', tags: [], descriptionHtml: '', status: 'published' }); setEditingId(null); setMode('edit'); }}>+ Add Blog</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {mode === 'list' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
                      <Input placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                      <select className="border rounded px-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                        <option value="">All</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                      <select className="border rounded px-2" value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="-createdAt">Newest</option>
                        <option value="createdAt">Oldest</option>
                        <option value="-publishedAt">Recently Published</option>
                        <option value="publishedAt">Least Recently Published</option>
                        <option value="title">Title A-Z</option>
                        <option value="-title">Title Z-A</option>
                      </select>
                      <div className="flex gap-2">
                        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/blogs'] })}>Refresh</Button>
                        <Button variant="outline" onClick={exportCsv}>Export CSV</Button>
                      </div>
                    </div>
                    <div className="overflow-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left">
                            <th className="p-2">ID</th>
                            <th className="p-2">Title</th>
                            <th className="p-2">Slug</th>
                            <th className="p-2">Description</th>
                            <th className="p-2">Image</th>
                            <th className="p-2">Tags</th>
                            <th className="p-2">Date</th>
                            <th className="p-2">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((b: any) => (
                            <tr key={b._id} className="border-t">
                              <td className="p-2 text-xs">{String(b._id).slice(-6)}</td>
                              <td className="p-2 max-w-[220px] truncate" title={b.title}>{b.title}</td>
                              <td className="p-2 max-w-[200px] truncate" title={b.slug}>{b.slug}</td>
                              <td className="p-2 max-w-[300px]">
                                <div className="line-clamp-2 text-muted-foreground" title={(b.excerpt || '').trim()}>
                                  {(b.excerpt || '').trim()}
                                </div>
                                <button className="text-xs text-blue-600" onClick={() => alert((b.descriptionHtml || '').replace(/<[^>]+>/g,' ').trim())}>View more</button>
                              </td>
                              <td className="p-2">
                                {b.imageUrl ? <img src={b.imageUrl} alt="thumb" className="w-12 h-12 object-cover rounded" /> : <span className="text-xs text-muted-foreground">—</span>}
                              </td>
                              <td className="p-2">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                  {(b.tags || []).map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                                </div>
                              </td>
                              <td className="p-2 text-xs">{b.publishedAt ? new Date(b.publishedAt).toLocaleDateString() : ''}</td>
                              <td className="p-2 flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => startEdit(b._id)}>Edit ✏️</Button>
                                <Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete this blog?')) del.mutate(b._id); }}>Delete 🗑️</Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-xs text-muted-foreground">Page {page}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" disabled={page<=1} onClick={() => setPage((p)=>p-1)}>Prev</Button>
                        <Button variant="outline" disabled={(page*10)>=total} onClick={() => setPage((p)=>p+1)}>Next</Button>
                      </div>
                    </div>
                  </>
                )}

                {mode === 'edit' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground">Title*</label>
                        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'') })} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Slug*</label>
                        <div className="flex gap-2">
                          <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} onFocus={() => { if (!editingId || !form.slug) return; const ok = confirm('Editing the slug can break links. Continue?'); if (!ok) { (document.activeElement as HTMLElement)?.blur(); } }} />
                        </div>
                      </div>
                    </div>
                    <Dropzone value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />
                    <div>
                      <label className="text-xs text-muted-foreground">Tags</label>
                      <TagsInput value={form.tags} onChange={(tags) => setForm({ ...form, tags })} />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Description*</label>
                      <RichEditor value={form.descriptionHtml} onChange={(html) => setForm({ ...form, descriptionHtml: html })} />
                      <div className="text-xs text-muted-foreground text-right mt-1">{wordCount} words</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className="border rounded px-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={saveAndBack} disabled={create.isPending || update.isPending}>Save and Back</Button>
                      <Button variant="outline" onClick={() => setMode('list')}>Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
