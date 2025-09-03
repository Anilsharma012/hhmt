import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Badge } from '@/components/ui/badge';

export default function AdminFaqs() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [form, setForm] = useState({ question: '', answer: '', category: '', status: 'active', showInFooter: false });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isFetching } = useQuery({ queryKey: ['/api/admin/faqs', { search, status, page, limit: 10 }] });
  const items = (data as any)?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
    queryClient.invalidateQueries({ queryKey: ['/api/faqs'] });
    queryClient.invalidateQueries({ queryKey: ['/api/faqs/footer'] });
    queryClient.invalidateQueries({ queryKey: ['/api/faqs/version'] });
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!form.question || !form.answer) throw new Error('Question and answer are required');
      if (form.answer.length > 4000) throw new Error('Answer too long');
      const res = await apiRequest('POST', '/api/admin/faqs', form);
      return res.json();
    },
    onSuccess: () => { setForm({ question: '', answer: '', category: '', status: 'active', showInFooter: false }); invalidate(); },
  });

  const toggle = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest('PATCH', `/api/admin/faqs/${id}/toggle`); return res.json(); },
    onSuccess: invalidate,
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest('DELETE', `/api/admin/faqs/${id}`); return res.json(); },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, patch }: any) => { const res = await apiRequest('PUT', `/api/admin/faqs/${id}`, patch); return res.json(); },
    onSuccess: invalidate,
  });

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
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>FAQs</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Input placeholder="Search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                  <select className="border rounded px-2" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                    <option value="">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <Button variant="outline" onClick={() => invalidate()}>Refresh</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-1">
              <CardHeader><CardTitle>Add FAQ</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />
                <Textarea placeholder="Answer (HTML allowed)" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} />
                <div className="text-xs text-muted-foreground">{form.answer.length}/4000</div>
                <Input placeholder="Category (optional)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <select className="border rounded px-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                  <label className="text-xs text-muted-foreground flex items-center gap-2">
                    <input type="checkbox" checked={form.showInFooter} onChange={(e) => setForm({ ...form, showInFooter: e.target.checked })} />
                    Show in footer
                  </label>
                </div>
                <Button disabled={create.isPending} onClick={() => create.mutate()}>Create</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader><CardTitle>All FAQs</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left">
                        <th className="p-2">ID</th>
                        <th className="p-2">Question</th>
                        <th className="p-2">Answer</th>
                        <th className="p-2">Status</th>
                        <th className="p-2">Order</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((f: any) => (
                        <tr key={f._id} className="border-t">
                          <td className="p-2 text-xs">{String(f._id).slice(-6)}</td>
                          <td className="p-2 max-w-[220px] truncate" title={f.question}>{f.question}</td>
                          <td className="p-2 max-w-[280px] truncate" title={f.answer?.replace(/<[^>]+>/g,'')}>{f.answer?.replace(/<[^>]+>/g,'')}</td>
                          <td className="p-2">{f.status === 'active' ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</td>
                          <td className="p-2">{f.sortOrder}</td>
                          <td className="p-2 flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => toggle.mutate(f._id)}>{f.status === 'active' ? 'Deactivate' : 'Activate'}</Button>
                            <Button variant="outline" size="sm" onClick={() => { const v = prompt('New order', String(f.sortOrder)); if (!v) return; const n = parseInt(v, 10); if (!isNaN(n)) update.mutate({ id: f._id, patch: { sortOrder: n } }); }}>Order</Button>
                            <Button variant="destructive" size="sm" onClick={() => { if (confirm('Delete this FAQ?')) del.mutate(f._id); }}>Delete</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
