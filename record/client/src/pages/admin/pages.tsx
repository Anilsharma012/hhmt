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
import { useLocation } from 'wouter';

export default function AdminPages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ id: '', title: '', slug: '', content: '', isActive: true });

  const { data: pages } = useQuery({ queryKey: ['/api/pages'] });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/admin/pages', form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Page saved' });
      setForm({ id: '', title: '', slug: '', content: '', isActive: true });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('PUT', `/api/admin/pages/${form.id}`, form);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Page updated' });
      setForm({ id: '', title: '', slug: '', content: '', isActive: true });
      queryClient.invalidateQueries({ queryKey: ['/api/pages'] });
    }
  });

  const handleEdit = (p: any) => {
    setForm({ id: p._id, title: p.title, slug: p.slug, content: p.content, isActive: p.isActive });
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
                  {(pages || []).map((p: any) => (
                    <div key={p._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.title}</div>
                        <div className="text-xs text-muted-foreground">/{p.slug}</div>
                      </div>
                      <div className="flex gap-2">
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
                <Textarea placeholder="Content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} />
                <div className="flex gap-2">
                  <Button onClick={() => (form.id ? updateMutation.mutate() : createMutation.mutate())}>
                    {form.id ? 'Update' : 'Create'}
                  </Button>
                  <Button variant="outline" onClick={() => setForm({ id: '', title: '', slug: '', content: '', isActive: true })}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
