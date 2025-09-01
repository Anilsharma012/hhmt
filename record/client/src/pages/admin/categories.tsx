import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, Plus, Pencil, Trash2, List } from 'lucide-react';

function useDebounced<T>(value: T, delay = 400) { const [v, setV] = useState(value); useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]); return v; }

export default function AdminCategories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const dSearch = useDebounced(search, 400);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showOrder, setShowOrder] = useState(false);
  const [subsCat, setSubsCat] = useState<any | null>(null);
  const [subs, setSubs] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, { sub: number; ads: number }>>({});

  const { data, isLoading, isRefetching } = useQuery({ queryKey: ['/api/admin/categories', { search: dSearch }] });
  const raw = (data as any)?.data || [];
  const filtered = useMemo(() => raw.filter((c: any) => !dSearch || c.name.toLowerCase().includes(dSearch.toLowerCase())), [raw, dSearch]);
  const pages = Math.max(1, Math.ceil(filtered.length / limit));
  const rows = filtered.slice((page - 1) * limit, page * limit);

  useEffect(() => { setPage(1); }, [dSearch]);
  useEffect(() => { (async () => { // counts for current page
    const subPairs = await Promise.all(rows.map(async (c: any) => { const r = await fetch(`/api/categories/${c._id}/subcategories`); const j = await r.json(); return [c._id, (j || []).length] as const; }));
    const adPairs = await Promise.all(rows.map(async (c: any) => { const r = await fetch(`/api/listings?category=${c._id}&limit=1`); const j = await r.json(); return [c._id, Number(j?.pagination?.total || 0)] as const; }));
    const next: Record<string, { sub: number; ads: number }> = {}; subPairs.forEach(([id, n]) => { next[id] = { sub: n, ads: 0 }; }); adPairs.forEach(([id, n]) => { next[id] = { ...(next[id]||{sub:0,ads:0}), ads: n }; }); setCounts(p => ({ ...p, ...next })); })(); }, [rows.map(r => r._id).join(',')]);

  const putCat = useMutation({ mutationFn: async ({ id, body }: { id: string; body: any }) => (await apiRequest('PUT', `/api/admin/categories/${id}`, body)).json(), onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] }) });
  const postCat = useMutation({ mutationFn: async (body: any) => (await apiRequest('POST', `/api/admin/categories`, body)).json(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] }) });
  const delCat = useMutation({ mutationFn: async (id: string) => (await apiRequest('DELETE', `/api/admin/categories/${id}`)).json(), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] }) });

  if (!user || user.role !== 'admin') {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><Card><CardContent className="p-8 text-center"><div className="text-2xl font-bold mb-4">Access Denied</div><Button onClick={() => setLocation('/')}>Go Home</Button></CardContent></Card></div>);
  }

  const exportCsv = () => {
    const header = ['ID','Name','Image','Subcategories','Custom Fields','Advertisement Count','Active'];
    const body = rows.map((c: any) => [c._id, c.name, c.image || c.icon || '', counts[c._id]?.sub ?? 0, 0, counts[c._id]?.ads ?? 0, c.isActive ? 'Yes' : 'No']);
    const csv = [header.join(','), ...body.map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='categories.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const saveOrder = async (ordered: any[]) => { for (let i = 0; i < ordered.length; i++) { await putCat.mutateAsync({ id: ordered[i]._id, body: { order: i } }); } toast({ title: 'Order saved' }); setShowOrder(false); };

  const loadSubs = async (cat: any) => { setSubsCat(cat); const res = await fetch(`/api/admin/subcategories?categoryId=${cat._id}`, { credentials: 'include' }); const js = await res.json(); setSubs(js?.data || []); };

  return (
    <AdminLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Button variant="outline" onClick={() => setShowOrder(true)}>+ Set Order of Categories</Button></div>
          <div className="flex items-center gap-2">
            <Input placeholder="Search categories..." value={search} onChange={e => setSearch(e.target.value)} className="w-64" />
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] })} disabled={isRefetching}><RefreshCw className="w-4 h-4 mr-2" />Refresh</Button>
            <Button onClick={exportCsv}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
            <Drawer>
              <DrawerTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Add Category</Button></DrawerTrigger>
              <DrawerContent>
                <DrawerHeader><DrawerTitle>Add Category</DrawerTitle></DrawerHeader>
                <CatForm onSave={async (body) => { await postCat.mutateAsync(body); toast({ title: 'Created' }); }} />
                <DrawerFooter><DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose></DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>
      }
    >
      <div className="overflow-x-auto bg-white rounded-lg border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Subcategories</TableHead>
              <TableHead>Custom Fields</TableHead>
              <TableHead>Advertisement Count</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 10 }).map((_, i) => (<TableRow key={i}>{Array.from({ length: 8 }).map((__, j) => (<TableCell key={j}><div className="h-4 bg-gray-100 rounded" /></TableCell>))}</TableRow>)) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={8}><div className="py-10 text-center text-gray-600">No categories found <Button variant="outline" className="ml-2" onClick={() => setSearch('')}>Reset Search</Button></div></TableCell></TableRow>
            ) : rows.map((c: any) => (
              <TableRow key={c._id}>
                <TableCell className="max-w-[140px] truncate">{c._id}</TableCell>
                <TableCell className="font-medium">{c.name}</TableCell>
                <TableCell>{(c.image || c.icon)?.startsWith('http') ? <img src={c.image || c.icon} className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 rounded bg-gray-100" />}</TableCell>
                <TableCell><button className="text-blue-600 hover:underline" onClick={() => loadSubs(c)}>{counts[c._id]?.sub ?? 0} Sub Categories</button></TableCell>
                <TableCell><a className="text-blue-600 hover:underline" href={`/admin/categories/fields?categoryId=${c._id}`}>{0} Custom Fields</a></TableCell>
                <TableCell>{counts[c._id]?.ads ?? 0}</TableCell>
                <TableCell><Switch checked={!!c.isActive} onCheckedChange={async (v) => { const prev = c.isActive; c.isActive = v; queryClient.setQueryData(['/api/admin/categories', { search: dSearch }], (old: any) => old); try { await putCat.mutateAsync({ id: c._id, body: { isActive: v } }); } catch { c.isActive = prev; queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] }); } }} /></TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Drawer>
                      <DrawerTrigger asChild><Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button></DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader><DrawerTitle>Edit Category</DrawerTitle></DrawerHeader>
                        <CatForm initial={c} onSave={async (body) => { await putCat.mutateAsync({ id: c._id, body }); toast({ title: 'Saved' }); }} />
                        <DrawerFooter><DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose></DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                    <Button variant="ghost" size="icon" onClick={() => loadSubs(c)}><List className="w-4 h-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-600"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                          <AlertDialogDescription>{(counts[c._id]?.ads ?? 0) > 0 ? 'This category has ads.' : 'This action cannot be undone.'}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={async () => { await delCat.mutateAsync(c._id); toast({ title: 'Deleted' }); }}>Delete</AlertDialogAction>
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

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>Page {page} of {pages} • {filtered.length} results</div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={page<=1} onClick={() => setPage(p => p-1)}>Prev</Button>
          {Array.from({ length: pages }).slice(0,5).map((_, i) => (<Button key={i} variant={page===i+1?'default':'outline'} onClick={() => setPage(i+1)}>{i+1}</Button>))}
          <Button variant="outline" disabled={page>=pages} onClick={() => setPage(p => p+1)}>Next</Button>
        </div>
      </div>

      {showOrder && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white rounded-lg w-full max-w-md p-4"><div className="font-semibold mb-3">Reorder Categories</div><OrderList items={filtered} onClose={() => setShowOrder(false)} onSave={saveOrder} /></div></div>)}

      {subsCat && (<div className="fixed inset-0 bg-black/30 z-40" onClick={() => setSubsCat(null)} />)}
      {subsCat && (
        <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white border-l z-50 flex flex-col">
          <div className="p-4 border-b flex items-center justify-between"><div className="font-semibold">Subcategories of {subsCat.name}</div><Button variant="outline" onClick={() => setSubsCat(null)}>Close</Button></div>
          <div className="p-4">
            <Button className="mb-3" onClick={() => setSubs(s => [{ __new: true, name: '', slug: '', image: '', isActive: true, categoryId: subsCat._id }, ...s])}>+ Add Subcategory</Button>
            <div className="space-y-2">
              {subs.map((s: any, idx) => (
                <div key={s._id || idx} className="grid grid-cols-12 items-center gap-2 p-2 border rounded">
                  <Input className="col-span-4" placeholder="Name" defaultValue={s.name} onChange={e => subs[idx] = { ...subs[idx], name: e.target.value, slug: (e.target.value||'').toLowerCase().replace(/[^a-z0-9]+/g,'-') }} />
                  <Input className="col-span-4" placeholder="Image URL" defaultValue={s.image} onChange={e => subs[idx] = { ...subs[idx], image: e.target.value }} />
                  <div className="col-span-2"><Switch defaultChecked={!!s.isActive} onCheckedChange={v => subs[idx] = { ...subs[idx], isActive: v }} /></div>
                  <div className="col-span-2 flex gap-2 justify-end">
                    <Button size="sm" variant="outline" onClick={async () => { if (s.__new) { await (await apiRequest('POST', '/api/admin/subcategories', { categoryId: subsCat._id, name: s.name, slug: s.slug, image: s.image, isActive: s.isActive })).json(); } else { await (await apiRequest('PUT', `/api/admin/subcategories/${s._id}`, { name: s.name, slug: s.slug, image: s.image, isActive: s.isActive })).json(); } await loadSubs(subsCat); toast({ title: 'Saved' }); }}>Save</Button>
                    <Button size="sm" variant="outline" className="text-red-600" onClick={async () => { if (!s.__new) await (await apiRequest('DELETE', `/api/admin/subcategories/${s._id}`)).json(); setSubs(subs.filter((_, i) => i!==idx)); await loadSubs(subsCat); }}>Delete</Button>
                  </div>
                </div>
              ))}
              {subs.length === 0 && <div className="text-sm text-gray-600">No subcategories</div>}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function CatForm({ initial, onSave }: { initial?: any; onSave: (b: any) => Promise<any> }) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [image, setImage] = useState(initial?.image || initial?.icon || '');
  const [isActive, setIsActive] = useState(!!initial?.isActive);
  useEffect(() => { setSlug(name ? name.toLowerCase().replace(/[^a-z0-9]+/g,'-') : ''); }, [name]);
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
      <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
      <Input placeholder="Slug" value={slug} onChange={e => setSlug(e.target.value)} />
      <Input placeholder="Image URL" value={image} onChange={e => setImage(e.target.value)} className="md:col-span-2" />
      <div className="flex items-center gap-3 md:col-span-2"><span className="text-sm">Active</span><Switch checked={isActive} onCheckedChange={setIsActive} /></div>
      <div className="md:col-span-2"><Button onClick={async () => { await onSave({ name, slug, image, isActive }); queryClient.invalidateQueries({ queryKey: ['/api/admin/categories'] }); }}>Save</Button></div>
    </div>
  );
}

function OrderList({ items, onSave, onClose }: { items: any[]; onSave: (arr: any[]) => void; onClose: () => void }) {
  const [list, setList] = useState(items.slice().sort((a,b) => (a.order||0) - (b.order||0)));
  const onDragStart = (e: React.DragEvent, idx: number) => e.dataTransfer.setData('text/plain', String(idx));
  const onDrop = (e: React.DragEvent, idx: number) => { const from = Number(e.dataTransfer.getData('text/plain')); const next = list.slice(); const [m] = next.splice(from,1); next.splice(idx,0,m); setList(next); };
  return (
    <div>
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {list.map((c, i) => (
          <div key={c._id} className="p-2 border rounded flex items-center justify-between" draggable onDragStart={(e)=>onDragStart(e,i)} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>onDrop(e,i)}>
            <div className="flex items-center gap-2"><span className="cursor-grab">⋮⋮</span><span>{c.name}</span></div>
            <div className="text-xs text-gray-500">{c._id}</div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(list)}>Save</Button>
      </div>
    </div>
  );
}
