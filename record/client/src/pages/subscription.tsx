import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';

export default function Subscription() {
  const { user } = useAuth();
  const [selection, setSelection] = useState({ packageId: '', cityId: '', areaId: '' });

  const { data: packages } = useQuery({ queryKey: ['/api/packages'] });
  const { data: cities } = useQuery({ queryKey: ['/api/locations/cities'] });
  const { data: areas } = useQuery({ queryKey: ['/api/locations/areas', selection.cityId ? { cityId: selection.cityId } : undefined] });
  const { data: rules } = useQuery({ queryKey: ['/api/pricing/rules'] });

  const pkg = (packages || []).find((p: any) => p._id === selection.packageId);

  const computedPrice = (() => {
    if (!pkg) return 0;
    const rule = (rules || []).find((r: any) =>
      (selection.areaId && r.scope === 'area' && r.refId === selection.areaId && r.packageId === selection.packageId) ||
      (selection.cityId && r.scope === 'city' && r.refId === selection.cityId && r.packageId === selection.packageId)
    );
    return rule ? rule.price : pkg.basePrice;
  })();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/orders/checkout', { packageId: selection.packageId, price: computedPrice, cityId: selection.cityId || undefined, areaId: selection.areaId || undefined });
      return res.json();
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Subscription Plans</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input placeholder="Package Id" value={selection.packageId} onChange={e => setSelection({ ...selection, packageId: e.target.value })} />
              <Input placeholder="City Id (optional)" value={selection.cityId} onChange={e => setSelection({ ...selection, cityId: e.target.value, areaId: '' })} />
              <Input placeholder="Area Id (optional)" value={selection.areaId} onChange={e => setSelection({ ...selection, areaId: e.target.value })} />
            </div>
            <div className="text-sm text-muted-foreground">Price: ₹{computedPrice}</div>
            <Button disabled={!user || !selection.packageId} onClick={() => checkoutMutation.mutate()}>{checkoutMutation.isPending ? 'Processing...' : 'Checkout'}</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Available Packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(packages || []).map((p: any) => (
              <div key={p._id} className="p-3 border rounded flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">Base ₹{p.basePrice} • max {p.features?.maxListings} listings</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelection({ ...selection, packageId: p._id })}>Select</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(cities || []).map((c: any) => (
              <div key={c._id} className="p-3 border rounded flex items-center justify-between">
                <div>{c.name}</div>
                <Button variant="outline" size="sm" onClick={() => setSelection({ ...selection, cityId: c._id, areaId: '' })}>Use</Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {selection.cityId && (
          <Card>
            <CardHeader>
              <CardTitle>Areas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(areas || []).map((a: any) => (
                <div key={a._id} className="p-3 border rounded flex items-center justify-between">
                  <div>{a.name}</div>
                  <Button variant="outline" size="sm" onClick={() => setSelection({ ...selection, areaId: a._id })}>Use</Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
      <Footer />
    </div>
  );
}
