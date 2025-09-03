import { useEffect, useMemo, useState } from 'react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append('file', file, file.name);
  const res = await fetch('/api/admin/uploads', { method: 'POST', body: fd, credentials: 'include' });
  if (!res.ok) throw new Error('Upload failed: ' + res.status);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error('Expected JSON');
  const data = await res.json();
  return data.url as string;
}

function Dropzone({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const onFile = async (file: File) => {
    const url = await uploadImage(file);
    if (url) onChange(url);
  };
  return (
    <div className="border rounded p-3">
      <div className="text-xs text-muted-foreground mb-1">Include Image (optional)</div>
      <div className="flex items-center gap-3">
        <div className="w-20 h-20 bg-muted overflow-hidden rounded">
          {value ? <img src={value} alt="img" className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground">256×256 ok</span>}
        </div>
        <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
        {value && <Button variant="ghost" onClick={() => onChange('')}>Remove</Button>}
      </div>
    </div>
  );
}

export default function AdminSendNotification() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [segment, setSegment] = useState<'all'|'selected'>('all');
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [adId, setAdId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: usersData } = useQuery({ queryKey: ['/api/admin/users', { search, page, limit: 10 }], enabled: segment === 'selected' });
  const users = (usersData as any)?.data || [];
  const { data: notifs } = useQuery({ queryKey: ['/api/admin/notifications', { page: 1, limit: 10 }] });
  const sent = (notifs as any)?.data || [];
  const { data: listings } = useQuery({ queryKey: ['/api/admin/listings', { page: 1, limit: 50 }] });

  const submit = useMutation({
    mutationFn: async () => {
      if (!title || !message) throw new Error('Title and message required');
      if (title.length > 60) throw new Error('Title too long');
      if (message.length > 200) throw new Error('Message too long');
      const userIds = segment === 'selected' ? Object.keys(selected).filter(id => selected[id]) : [];
      if (segment === 'selected' && userIds.length === 0) throw new Error('Select at least one user');
      const res = await apiRequest('POST', '/api/admin/notifications/send', { segment, userIds, title, message, imageUrl, adId });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Expected JSON');
      return res.json();
    },
    onSuccess: () => { setTitle(''); setMessage(''); setImageUrl(''); setAdId(''); setSegment('all'); setSelected({}); queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] }); },
  });

  const del = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest('DELETE', `/api/admin/notifications/${id}`); return res.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] }),
  });

  if (!user || user.role !== 'admin') return (
    <div className="min-h-screen bg-background flex items-center justify-center"><Card><CardContent className="p-8 text-center"><h1 className="text-2xl font-bold mb-4">Access Denied</h1><Button onClick={() => setLocation('/')}>Go Home</Button></CardContent></Card></div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>Send Notification</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="space-y-3 lg:col-span-2">
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-xs text-muted-foreground">Send To</label>
                      <select className="border rounded px-2" value={segment} onChange={(e) => setSegment(e.target.value as any)}>
                        <option value="all">All</option>
                        <option value="selected">Selected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Title*</label>
                      <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
                      <div className="text-xs text-muted-foreground text-right">{title.length}/60</div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground">Message*</label>
                      <Input value={message} onChange={(e) => setMessage(e.target.value)} maxLength={200} />
                      <div className="text-xs text-muted-foreground text-right">{message.length}/200</div>
                    </div>
                    <Dropzone value={imageUrl} onChange={setImageUrl} />
                    <div>
                      <label className="text-xs text-muted-foreground">Advertisement (optional)</label>
                      <select className="border rounded px-2 w-full" value={adId} onChange={(e) => setAdId(e.target.value)}>
                        <option value="">None</option>
                        {((listings as any)?.data || []).map((l: any) => (
                          <option key={l._id} value={l._id}>{l.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={() => submit.mutate()} disabled={submit.isPending}>Submit</Button>
                      <Button variant="outline" onClick={() => { setTitle(''); setMessage(''); setImageUrl(''); setAdId(''); }}>Cancel</Button>
                    </div>
                  </div>

                  {segment === 'selected' && (
                    <div className="lg:col-span-1 border rounded p-3">
                      <div className="flex gap-2 mb-2">
                        <Input placeholder="Search users" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
                        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] })}>Refresh</Button>
                      </div>
                      <div className="max-h-[360px] overflow-auto">
                        <table className="w-full text-sm">
                          <thead><tr><th className="p-2">Sel</th><th className="p-2 text-left">Name</th><th className="p-2 text-left">Email</th></tr></thead>
                          <tbody>
                            {users.map((u: any) => (
                              <tr key={u._id} className="border-t">
                                <td className="p-2"><input type="checkbox" checked={!!selected[u._id]} onChange={(e) => setSelected({ ...selected, [u._id]: e.target.checked })} /></td>
                                <td className="p-2">{u.name}</td>
                                <td className="p-2">{u.email}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="flex justify-between mt-2">
                        <Button variant="outline" onClick={() => setSelected(users.reduce((acc: any, u: any) => (acc[u._id]=true, acc), {}))}>Select All</Button>
                        <div className="flex gap-2">
                          <Button variant="outline" disabled={page<=1} onClick={() => setPage(p=>p-1)}>Prev</Button>
                          <Button variant="outline" onClick={() => setPage(p=>p+1)}>Next</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader><CardTitle>Sent Notifications</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left"><th className="p-2">ID</th><th className="p-2">Title</th><th className="p-2">Message</th><th className="p-2">Image</th><th className="p-2">Send To</th><th className="p-2">Date</th><th className="p-2">Stats</th><th className="p-2">Action</th></tr>
                    </thead>
                    <tbody>
                      {sent.map((n: any) => (
                        <tr key={n._id} className="border-t">
                          <td className="p-2 text-xs">{String(n._id).slice(-6)}</td>
                          <td className="p-2">{n.title}</td>
                          <td className="p-2 max-w-[260px] truncate" title={n.message}>{n.message}</td>
                          <td className="p-2">{n.imageUrl ? <img src={n.imageUrl} className="w-12 h-12 object-cover rounded" /> : '—'}</td>
                          <td className="p-2">{n.segment}</td>
                          <td className="p-2 text-xs">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</td>
                          <td className="p-2 text-xs">{n.stats?.success || 0}✓ / {n.stats?.failed || 0}✗</td>
                          <td className="p-2"><Button size="sm" variant="destructive" onClick={() => { if (confirm('Delete?')) del.mutate(n._id); }}>Delete</Button></td>
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
