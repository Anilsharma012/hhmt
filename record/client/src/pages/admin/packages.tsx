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

export default function AdminPackages() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [form, setForm] = useState({ id: '', name: '', basePrice: 0, featured: false, urgent: false, boostDays: 0, maxListings: 1 });

  const { data: packages } = useQuery({ queryKey: ['/api/packages'] });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        basePrice: Number(form.basePrice),
        features: { featured: form.featured, urgent: form.urgent, boostDays: Number(form.boostDays), maxListings: Number(form.maxListings) }
      };
      const res = await apiRequest(form.id ? 'PUT' : 'POST', form.id ? `/api/admin/packages/${form.id}` : '/api/admin/packages', payload);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Saved' });
      setForm({ id: '', name: '', basePrice: 0, featured: false, urgent: false, boostDays: 0, maxListings: 1 });
      queryClient.invalidateQueries({ queryKey: ['/api/packages'] });
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
                <CardTitle>Packages</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(packages || []).map((p: any) => (
                    <div key={p._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">Base ₹{p.basePrice}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setForm({ id: p._id, name: p.name, basePrice: p.basePrice, featured: p.features?.featured, urgent: p.features?.urgent, boostDays: p.features?.boostDays, maxListings: p.features?.maxListings })}>Edit</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{form.id ? 'Edit Package' : 'Create Package'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                <Input placeholder="Base Price" type="number" value={form.basePrice} onChange={e => setForm({ ...form, basePrice: Number(e.target.value) })} />
                <Input placeholder="Boost Days" type="number" value={form.boostDays} onChange={e => setForm({ ...form, boostDays: Number(e.target.value) })} />
                <Input placeholder="Max Listings" type="number" value={form.maxListings} onChange={e => setForm({ ...form, maxListings: Number(e.target.value) })} />
                <div className="flex gap-2">
                  <Button onClick={() => saveMutation.mutate()}>{form.id ? 'Update' : 'Create'}</Button>
                  <Button variant="outline" onClick={() => setForm({ id: '', name: '', basePrice: 0, featured: false, urgent: false, boostDays: 0, maxListings: 1 })}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
