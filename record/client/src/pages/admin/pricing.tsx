import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useLocation } from 'wouter';

export default function AdminPricing() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ id: '', scope: 'city', refId: '', packageId: '', price: 0 });

  const { data: packages } = useQuery({ queryKey: ['/api/packages'] });
  const { data: cities } = useQuery({ queryKey: ['/api/locations/cities'] });
  const { data: rules } = useQuery({ queryKey: ['/api/pricing/rules'] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { scope: form.scope, refId: form.refId, packageId: form.packageId, price: Number(form.price) };
      const res = await apiRequest(form.id ? 'PUT' : 'POST', form.id ? `/api/admin/pricing/rules/${form.id}` : '/api/admin/pricing/rules', payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Saved' });
      setForm({ id: '', scope: 'city', refId: '', packageId: '', price: 0 });
      queryClient.invalidateQueries({ queryKey: ['/api/pricing/rules'] });
    }
  });

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
                <CardTitle>Pricing Rules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(rules || []).map((r: any) => (
                    <div key={r._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{r.scope} • ₹{r.price}</div>
                        <div className="text-xs text-muted-foreground">refId: {r.refId} • package: {r.packageId}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setForm({ id: r._id, scope: r.scope, refId: r.refId, packageId: r.packageId, price: r.price })}>Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{form.id ? 'Edit Rule' : 'Create Rule'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Scope (city|area|category)" value={form.scope} onChange={e => setForm({ ...form, scope: e.target.value })} />
                <Input placeholder="Ref Id (cityId/areaId/categoryId)" value={form.refId} onChange={e => setForm({ ...form, refId: e.target.value })} />
                <Input placeholder="Package Id" value={form.packageId} onChange={e => setForm({ ...form, packageId: e.target.value })} />
                <Input placeholder="Price" type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate()}>{form.id ? 'Update' : 'Create'}</Button>
                  <Button variant="outline" onClick={() => setForm({ id: '', scope: 'city', refId: '', packageId: '', price: 0 })}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
