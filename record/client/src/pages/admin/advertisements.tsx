import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, Pencil, Trash2, ChevronDown } from 'lucide-react';

function formatINR(n: number) {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);
  } catch {
    return `₹${n}`;
  }
}

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function AdminAdvertisements() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [filters, setFilters] = useState({ search: '', page: 1, limit: 10, country: '', state: '', city: '', isPremium: '' as '' | 'true' });
  const debouncedSearch = useDebounced(filters.search, 400);

  const params = useMemo(() => ({ ...filters, search: debouncedSearch }), [filters, debouncedSearch]);

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['/api/admin/advertisements', params],
  });

  const items = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination ?? { page: filters.page, limit: filters.limit, total: items.length, pages: 1 };

  const patchMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const res = await apiRequest('PATCH', `/api/admin/advertisements/${id}`, body);
      return res.json();
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/advertisements/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Advertisement deleted' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
    },
    onError: (e: any) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card><CardContent className="p-8 text-center"><div className="text-2xl font-bold mb-4">Access Denied</div><Button onClick={() => setLocation('/')}>Go Home</Button></CardContent></Card>
      </div>
    );
  }

  const onToggleActive = async (row: any, next: boolean) => {
    // optimistic
    queryClient.setQueryData(['/api/admin/advertisements', params], (prev: any) => {
      if (!prev) return prev;
      const nextData = prev.data.map((it: any) => (it._id === row._id ? { ...it, status: next ? 'active' : 'draft' } : it));
      return { ...prev, data: nextData };
    });
    try {
      await patchMutation.mutateAsync({ id: row._id, body: { active: next } });
    } catch {
      // revert
      queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] });
    }
  };

  const exportCsv = () => {
    const rows = items.map((r: any) => ({
      ID: r._id,
      Name: r.title,
      Description: r.description?.replace(/\n/g, ' '),
      User: `${r.userId?.firstName || ''} ${r.userId?.lastName || ''}`.trim(),
      Price: r.price,
      City: r.location?.city || '',
      State: r.location?.state || '',
      Premium: r.isPremium ? 'Yes' : 'No',
      Featured: r.isFeatured ? 'Yes' : 'No',
      Status: r.status,
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'advertisements.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Advertisements</h1>
            <p className="text-gray-600">Manage all advertisements</p>
          </div>
          <div className="flex gap-2">
            <Input placeholder="Search..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} className="w-64" />
            <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] })} disabled={isRefetching}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
            <Button onClick={exportCsv}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>
      }
    >
      <Card className="mb-4">
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Featured / Premium:</span>
            <div className="flex gap-2">
              <Button size="sm" variant={filters.isPremium === '' ? 'default' : 'outline'} onClick={() => setFilters({ ...filters, isPremium: '', page: 1 })}>All</Button>
              <Button size="sm" variant={filters.isPremium === 'true' ? 'default' : 'outline'} onClick={() => setFilters({ ...filters, isPremium: 'true', page: 1 })}>Premium</Button>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Select value={filters.country} onValueChange={v => setFilters({ ...filters, country: v === 'ALL' ? '' : v, page: 1 })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Country" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.state} onValueChange={v => setFilters({ ...filters, state: v === 'ALL' ? '' : v, page: 1 })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="State" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.city} onValueChange={v => setFilters({ ...filters, city: v === 'ALL' ? '' : v, page: 1 })}>
              <SelectTrigger className="w-40"><SelectValue placeholder="City" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Other Images</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>State</TableHead>
              <TableHead>City</TableHead>
              <TableHead>Featured/Premium</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 15 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-100 rounded" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={15}>
                <div className="py-10 text-center text-gray-600">No advertisements found <Button variant="outline" className="ml-2" onClick={() => setFilters({ search: '', page: 1, limit: 10, country: '', state: '', city: '', isPremium: '' })}>Reset Filters</Button></div>
              </TableCell></TableRow>
            ) : (
              items.map((row: any) => (
                <TableRow key={row._id}>
                  <TableCell className="max-w-[140px] truncate">{row._id}</TableCell>
                  <TableCell className="font-medium">{row.title}</TableCell>
                  <TableCell className="max-w-[240px]"><div className="line-clamp-2 text-gray-600">{row.description}</div></TableCell>
                  <TableCell className="max-w-[180px]"><div className="line-clamp-2">{`${row.userId?.firstName || ''} ${row.userId?.lastName || ''}`.trim() || row.userId?.email || '-'}</div></TableCell>
                  <TableCell>{formatINR(row.price)}</TableCell>
                  <TableCell>
                    {row.images?.[0] ? (
                      <img src={row.images[0]} alt="thumb" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100" />
                    )}
                  </TableCell>
                  <TableCell>{Math.max(0, (row.images?.length || 0) - 1)}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{row.location?.state || '-'}</TableCell>
                  <TableCell>{row.location?.city || '-'}</TableCell>
                  <TableCell>
                    {row.isPremium ? <Badge className="bg-purple-100 text-purple-800">Premium</Badge> : <span className="text-gray-500">-</span>}
                  </TableCell>
                  <TableCell>
                    {row.status === 'active' && <Badge className="bg-green-100 text-green-800">Approved</Badge>}
                    {row.status === 'draft' && <Badge className="bg-gray-100 text-gray-800">Pending</Badge>}
                    {row.status === 'rejected' && <Badge className="bg-red-100 text-red-800">Rejected</Badge>}
                  </TableCell>
                  <TableCell>
                    <Switch checked={row.status === 'active'} onCheckedChange={(v) => onToggleActive(row, v)} />
                  </TableCell>
                  <TableCell>{row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '–'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button variant="ghost" size="icon"><Pencil className="w-4 h-4" /></Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>Edit Advertisement</DrawerTitle>
                          </DrawerHeader>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input defaultValue={row.title} placeholder="Name" onChange={(e) => (row.__edit = { ...(row.__edit||{}), name: e.target.value })} />
                            <Input defaultValue={row.price} type="number" placeholder="Price" onChange={(e) => (row.__edit = { ...(row.__edit||{}), price: Number(e.target.value||0) })} />
                            <Input defaultValue={row.location?.state} placeholder="State" onChange={(e) => (row.__edit = { ...(row.__edit||{}), state: e.target.value })} />
                            <Input defaultValue={row.location?.city} placeholder="City" onChange={(e) => (row.__edit = { ...(row.__edit||{}), city: e.target.value })} />
                            <Input defaultValue={row.expiryDate ? String(row.expiryDate).slice(0,10) : ''} type="date" onChange={(e) => (row.__edit = { ...(row.__edit||{}), expiryDate: e.target.value })} />
                            <div className="col-span-1 md:col-span-2">
                              <textarea defaultValue={row.description} placeholder="Description" className="w-full border border-gray-200 rounded px-3 py-2 min-h-[100px]" onChange={(e) => (row.__edit = { ...(row.__edit||{}), description: e.target.value })} />
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="text-sm">Premium</label>
                              <Switch defaultChecked={!!row.isPremium} onCheckedChange={(v) => (row.__edit = { ...(row.__edit||{}), isPremium: v })} />
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="text-sm">Featured</label>
                              <Switch defaultChecked={!!row.isFeatured} onCheckedChange={(v) => (row.__edit = { ...(row.__edit||{}), isFeatured: v })} />
                            </div>
                          </div>
                          <DrawerFooter>
                            <Button onClick={async () => { await patchMutation.mutateAsync({ id: row._id, body: row.__edit || {} }); toast({ title: 'Saved' }); queryClient.invalidateQueries({ queryKey: ['/api/admin/advertisements'] }); }}>
                              Save
                            </Button>
                            <DrawerClose asChild>
                              <Button variant="outline">Close</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Advertisement?</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(row._id)}>Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>Page {pagination.page} of {pagination.pages} • {pagination.total} results</div>
        <div className="flex gap-2">
          <Button variant="outline" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Prev</Button>
          <Button variant="outline" disabled={filters.page >= pagination.pages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</Button>
        </div>
      </div>
    </AdminLayout>
  );
}
