import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function AdminLocations() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [cityForm, setCityForm] = useState({ id: '', name: '', slug: '', state: '' });
  const [areaForm, setAreaForm] = useState({ id: '', cityId: '', name: '', slug: '', pincode: '' });

  const { data: cities } = useQuery({ queryKey: ['/api/locations/cities'] });
  const { data: areas } = useQuery({ queryKey: ['/api/locations/areas', areaForm.cityId ? { cityId: areaForm.cityId } : undefined] });

  const saveCity = useMutation({
    mutationFn: async () => {
      const payload = { name: cityForm.name, slug: cityForm.slug, state: cityForm.state };
      const res = await apiRequest(cityForm.id ? 'PUT' : 'POST', cityForm.id ? `/api/admin/locations/cities/${cityForm.id}` : '/api/admin/locations/cities', payload);
      return res.json();
    },
    onSuccess: () => {
      setCityForm({ id: '', name: '', slug: '', state: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/locations/cities'] });
    }
  });

  const saveArea = useMutation({
    mutationFn: async () => {
      const payload = { cityId: areaForm.cityId, name: areaForm.name, slug: areaForm.slug, pincode: areaForm.pincode };
      const res = await apiRequest(areaForm.id ? 'PUT' : 'POST', areaForm.id ? `/api/admin/locations/areas/${areaForm.id}` : '/api/admin/locations/areas', payload);
      return res.json();
    },
    onSuccess: () => {
      setAreaForm({ id: '', cityId: '', name: '', slug: '', pincode: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/locations/areas'] });
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
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {(cities || []).map((c: any) => (
                    <div key={c._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs text-muted-foreground">{c.state} • /{c.slug}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setCityForm({ id: c._id, name: c.name, slug: c.slug, state: c.state })}>Edit</Button>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input placeholder="Name" value={cityForm.name} onChange={e => setCityForm({ ...cityForm, name: e.target.value })} />
                  <Input placeholder="Slug" value={cityForm.slug} onChange={e => setCityForm({ ...cityForm, slug: e.target.value })} />
                  <Input placeholder="State" value={cityForm.state} onChange={e => setCityForm({ ...cityForm, state: e.target.value })} />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveCity.mutate()}>{cityForm.id ? 'Update' : 'Create'}</Button>
                  <Button variant="outline" onClick={() => setCityForm({ id: '', name: '', slug: '', state: '' })}>Clear</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Areas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Input placeholder="City Id" value={areaForm.cityId} onChange={e => setAreaForm({ ...areaForm, cityId: e.target.value })} />
                  <Input placeholder="Name" value={areaForm.name} onChange={e => setAreaForm({ ...areaForm, name: e.target.value })} />
                  <Input placeholder="Slug" value={areaForm.slug} onChange={e => setAreaForm({ ...areaForm, slug: e.target.value })} />
                  <Input placeholder="Pincode" value={areaForm.pincode} onChange={e => setAreaForm({ ...areaForm, pincode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  {(areas || []).map((a: any) => (
                    <div key={a._id} className="p-3 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">city: {a.cityId} • /{a.slug}</div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setAreaForm({ id: a._id, cityId: a.cityId, name: a.name, slug: a.slug, pincode: a.pincode })}>Edit</Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => saveArea.mutate()}>{areaForm.id ? 'Update' : 'Create'}</Button>
                  <Button variant="outline" onClick={() => setAreaForm({ id: '', cityId: '', name: '', slug: '', pincode: '' })}>Clear</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
