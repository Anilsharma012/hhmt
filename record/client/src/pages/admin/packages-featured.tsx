import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, RefreshCw, Pencil, Trash2 } from 'lucide-react';
import { uploadImage } from '@/lib/api';

function useDebounced<T>(v: T, d = 400) { const [s, setS] = useState(v); useEffect(() => { const t = setTimeout(() => setS(v), d); return () => clearTimeout(t); }, [v, d]); return s; }
const inr = (n: number) => { try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n); } catch { return `₹${n}`; } };

export default function AdminFeaturedPackages() {
  const { user } = useAuth(); const [, setLocation] = useLocation(); const { toast } = useToast();
  const [search, setSearch] = useState(''); const dSearch = useDebounced(search, 400);
  const [page, setPage] = useState(1); const limit = 10;
  const [editing, setEditing] = useState<any | null>(null);

  const { data, isLoading, isRefetching } = useQuery({ queryKey: ['/api/admin/packages'], enabled: !!user && user.role === 'admin', onError:(e:any)=>{ if(String(e?.message||'').startsWith('401')){ setLocation('/admin/login'); } } });
  const all = (data as any)?.data || [];
  const featuredOnly = useMemo(() => all.filter((p: any) => p?.features?.featured === true), [all]);
  const filtered = useMemo(() => featuredOnly.filter((p: any) => !dSearch || p.name.toLowerCase().includes(dSearch.toLowerCase())), [featuredOnly, dSearch]);
  const pages = Math.max(1, Math.ceil(filtered.length / limit)); const rows = filtered.slice((page - 1) * limit, page * limit);
  useEffect(() => { setPage(1); }, [dSearch]);

  const patch = useMutation({ mutationFn: async ({ id, body }: { id: string; body: any }) => (await apiRequest('PUT', `/api/admin/packages/${id}`, body)).json(), onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] }) });
  const create = useMutation({ mutationFn: async (body: any) => (await apiRequest('POST', '/api/admin/packages', body)).json(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] }) });
  const del = useMutation({ mutationFn: async (id: string) => (await apiRequest('DELETE', `/api/admin/packages/${id}`)).json(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] }) });

  if (!user || user.role !== 'admin') return (<div className='min-h-screen bg-background flex items-center justify-center'><Card><CardContent className='p-8 text-center'><div className='text-2xl font-bold mb-4'>Access Denied</div><Button onClick={() => setLocation('/')}>Go Home</Button></CardContent></Card></div>);

  const exportCsv = () => { const header = ['ID', 'Image', 'Name', 'Price', 'Discount %', 'Final Price', 'Days', 'Advertisement Limit', 'Status']; const body = rows.map((p: any) => [p._id, p.image || '', p.name, p.price ?? p.basePrice ?? 0, p.discountPercent ?? 0, p.finalPrice ?? p.price ?? p.basePrice ?? 0, p.days ?? '∞', p.adLimit ?? '∞', p.isActive ? 'Active' : 'Inactive']); const csv = [header.join(','), ...body.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n'); const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'featured-packages.csv'; a.click(); URL.revokeObjectURL(url); };

  return (
    <AdminLayout
      header={
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Feature Advertisement Package</h1>
            <p className='text-gray-600'>Create and manage Featured Ad packages</p>
          </div>
          <div className='flex gap-2'>
            <Input placeholder='Search…' value={search} onChange={e => setSearch(e.target.value)} className='w-64' />
            <Button variant='outline' onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] })} disabled={isRefetching}><RefreshCw className='w-4 h-4 mr-2' />Refresh</Button>
            <Button onClick={exportCsv}><Download className='w-4 h-4 mr-2' />Export</Button>
          </div>
        </div>
      }
    >
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        <Card className='lg:col-span-1'>
          <CardContent className='p-4'>
            <PackageForm key={editing?._id||'new'} initial={editing} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); toast({ title: 'Published' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] }); }} />
          </CardContent>
        </Card>
        <Card className='lg:col-span-2'>
          <CardContent className='p-0'>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Discount in(%)</TableHead>
                    <TableHead>Final Price</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Advertisement Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? Array.from({ length: 10 }).map((_, i) => (<TableRow key={i}>{Array.from({ length: 10 }).map((__, j) => (<TableCell key={j}><div className='h-4 bg-gray-100 rounded' /></TableCell>))}</TableRow>)) : rows.length === 0 ? (
                    <TableRow><TableCell colSpan={10}><div className='py-10 text-center text-gray-600'>No packages found <Button variant='outline' className='ml-2' onClick={() => setSearch('')}>Reset Search</Button></div></TableCell></TableRow>
                  ) : rows.map((p: any) => (
                    <TableRow key={p._id}>
                      <TableCell className='max-w-[140px] truncate'>{p._id}</TableCell>
                      <TableCell>{p.image ? <img src={p.image} className='w-12 h-12 rounded object-cover' /> : <div className='w-12 h-12 rounded bg-gray-100' />}</TableCell>
                      <TableCell className='font-medium'>{p.name}</TableCell>
                      <TableCell>{inr(p.price ?? p.basePrice ?? 0)}</TableCell>
                      <TableCell>{p.discountPercent ?? 0}</TableCell>
                      <TableCell>{inr(p.finalPrice ?? p.price ?? p.basePrice ?? 0)}</TableCell>
                      <TableCell>{p.days ?? '∞'}</TableCell>
                      <TableCell>{p.adLimit ?? '∞'}</TableCell>
                      <TableCell>
                        <Switch checked={!!p.isActive} onCheckedChange={async (v) => { const prev = p.isActive; p.isActive = v; queryClient.setQueryData(['/api/admin/packages'], (old: any) => old); try { await patch.mutateAsync({ id: p._id, body: { isActive: v } }); } catch { p.isActive = prev; queryClient.invalidateQueries({ queryKey: ['/api/admin/packages'] }); toast({ title: 'Failed to update status', variant: 'destructive' }); } }} />
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button variant='ghost' size='icon' onClick={() => setEditing(p)}><Pencil className='w-4 h-4' /></Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><Button variant='ghost' size='icon' className='text-red-600'><Trash2 className='w-4 h-4' /></Button></AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader><AlertDialogTitle>Delete Package?</AlertDialogTitle></AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={async () => { await del.mutateAsync(p._id); toast({ title: 'Deleted' }); }}>Delete</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className='p-3 flex items-center justify-between text-sm text-gray-600'>
              <div>Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filtered.length)} of {filtered.length} rows</div>
              <div className='flex gap-2'>
                <Button variant='outline' disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                {Array.from({ length: pages }).slice(0, 5).map((_, i) => (<Button key={i} variant={page === i + 1 ? 'default' : 'outline'} onClick={() => setPage(i + 1)}>{i + 1}</Button>))}
                <Button variant='outline' disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function PackageForm({ initial, onSaved, onCancel }: { initial?: any; onSaved: () => void; onCancel: () => void }) {
  const { toast } = useToast();
  const [name, setName] = useState(initial?.name || '');
  const [iosProductId, setIos] = useState(initial?.iosProductId || '');
  const [price, setPrice] = useState<number>(initial?.price ?? initial?.basePrice ?? 0);
  const [discountPercent, setDiscount] = useState<number>(initial?.discountPercent ?? 0);
  const calcFinal = (p: number, d: number) => Math.max(0, Math.round((p - (p * d / 100)) * 100) / 100);
  const [finalPrice, setFinalPrice] = useState<number>(initial?.finalPrice ?? calcFinal(price, discountPercent));
  const [image, setImage] = useState<string>(initial?.image || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [daysMode, setDaysMode] = useState<'limited' | 'unlimited'>(initial?.days ? 'limited' : 'unlimited');
  const [days, setDays] = useState<number>(initial?.days || 0);
  const [adsMode, setAdsMode] = useState<'limited' | 'unlimited'>(initial?.adLimit ? 'limited' : 'unlimited');
  const [adLimit, setAdLimit] = useState<number>(initial?.adLimit || 0);
  const [active, setActive] = useState<boolean>(!!initial?.isActive);

  useEffect(() => { setFinalPrice(calcFinal(price, discountPercent)); }, [price, discountPercent]);

  const saving = useMutation({
    mutationFn: async () => {
      if (!name || !image || !description) { throw new Error('Please fill all required fields'); }
      if (price < 0) throw new Error('Price must be ≥ 0');
      if (discountPercent < 0 || discountPercent > 100) { throw new Error('Discount must be 0–100'); }
      const body: any = { name, iosProductId, price, discountPercent, finalPrice, image, description, days: daysMode === 'limited' ? (days > 0 ? days : null) : null, adLimit: adsMode === 'limited' ? (adLimit > 0 ? adLimit : null) : null, isActive: active, basePrice: price, features: { featured: true } };
      const method = initial ? 'PUT' : 'POST'; const url = initial ? `/api/admin/packages/${initial._id}` : '/api/admin/packages';
      const res = await apiRequest(method, url, body); return res.json();
    },
    onSuccess: () => { toast({ title: initial ? 'Updated' : 'Added' }); onSaved(); reset(); },
    onError: (e: any) => toast({ title: 'Save failed', description: e.message, variant: 'destructive' })
  });

  const reset = () => { setName(''); setIos(''); setPrice(0); setDiscount(0); setFinalPrice(0); setImage(''); setDescription(''); setDaysMode('unlimited'); setDays(0); setAdsMode('unlimited'); setAdLimit(0); setActive(true); onCancel(); };

  const onPickFile = async (file: File) => { try { const url = await uploadImage(file); setImage(url); } catch {} };

  return (
    <div className='space-y-3'>
      <div className='font-semibold text-gray-900 mb-2'>{initial ? 'Edit Package' : 'Add Package'}</div>
      <label className='text-sm'>Name*</label>
      <Input value={name} onChange={e => setName(e.target.value)} />
      <label className='text-sm'>IOS Product ID</label>
      <Input value={iosProductId} onChange={e => setIos(e.target.value)} />
      <div className='grid grid-cols-2 gap-2'>
        <div>
          <label className='text-sm'>Price (₹)*</label>
          <Input type='number' value={price} onChange={e => setPrice(Number(e.target.value || 0))} />
        </div>
        <div>
          <label className='text-sm'>Discount (%)*</label>
          <Input type='number' value={discountPercent} onChange={e => setDiscount(Math.max(0, Math.min(100, Number(e.target.value || 0))))} />
        </div>
      </div>
      <div>
        <label className='text-sm'>Final Price (₹)*</label>
        <Input type='number' value={finalPrice} onChange={e => setFinalPrice(Number(e.target.value || 0))} />
      </div>
      <div>
        <label className='text-sm'>Image*</label>
        <div className='flex gap-2'>
          <Input placeholder='Image URL' value={image} onChange={e => setImage(e.target.value)} />
          <input type='file' accept='image/*' onChange={e => { const f = e.target.files?.[0]; if (f) onPickFile(f); }} />
        </div>
        {image ? <img src={image} className='mt-2 w-20 h-20 rounded object-cover' /> : null}
      </div>
      <div>
        <label className='text-sm'>Description*</label>
        <textarea className='w-full border border-gray-200 rounded px-3 py-2 min-h-[80px]' value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div>
        <label className='text-sm'>Days</label>
        <div className='flex items-center gap-3'>
          <label className='text-sm flex items-center gap-2'><input type='radio' name='days' checked={daysMode === 'limited'} onChange={() => setDaysMode('limited')} /> Days</label>
          <label className='text-sm flex items-center gap-2'><input type='radio' name='days' checked={daysMode === 'unlimited'} onChange={() => setDaysMode('unlimited')} /> Unlimited</label>
        </div>
        {daysMode === 'limited' && (<Input type='number' value={days || 0} onChange={e => setDays(Math.max(0, Number(e.target.value || 0)))} />)}
      </div>
      <div>
        <label className='text-sm'>Advertisement Limit</label>
        <div className='flex items-center gap-3'>
          <label className='text-sm flex items-center gap-2'><input type='radio' name='ads' checked={adsMode === 'limited'} onChange={() => setAdsMode('limited')} /> Limited</label>
          <label className='text-sm flex items-center gap-2'><input type='radio' name='ads' checked={adsMode === 'unlimited'} onChange={() => setAdsMode('unlimited')} /> Unlimited</label>
        </div>
        {adsMode === 'limited' && (<Input type='number' value={adLimit || 0} onChange={e => setAdLimit(Math.max(0, Number(e.target.value || 0)))} />)}
      </div>
      <div className='flex items-center gap-2'><span className='text-sm'>Active</span><Switch checked={active} onCheckedChange={setActive} /></div>
      <div className='flex gap-2'>
        <Button onClick={() => saving.mutate()}>{initial ? 'Update Package' : 'Add Package'}</Button>
        {initial && <Button variant='outline' onClick={reset}>Cancel</Button>}
      </div>
    </div>
  );
}
