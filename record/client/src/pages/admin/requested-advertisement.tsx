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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, Pencil, Trash2, ChevronDown, Eye } from 'lucide-react';

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

export default function RequestedAdvertisement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [filters, setFilters] = useState({ 
    search: '', 
    page: 1, 
    limit: 10, 
    country: '', 
    state: '', 
    city: '', 
    status: '', 
    premium: '' 
  });
  const debouncedSearch = useDebounced(filters.search, 400);

  const params = useMemo(() => ({ 
    ...filters, 
    search: debouncedSearch,
    requested: 'true'
  }), [filters, debouncedSearch]);

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['/api/admin/ads', params],
  });

  const items = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination ?? { page: filters.page, limit: filters.limit, total: items.length, pages: 1 };

  const patchMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: any }) => {
      const res = await apiRequest('PATCH', `/api/admin/ads/${id}`, body);
      return res.json();
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
      toast({ title: 'Updated successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/ads/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Advertisement deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
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
    // optimistic update
    queryClient.setQueryData(['/api/admin/ads', params], (prev: any) => {
      if (!prev) return prev;
      const nextData = prev.data.map((it: any) => (it._id === row._id ? { ...it, active: next } : it));
      return { ...prev, data: nextData };
    });
    try {
      await patchMutation.mutateAsync({ id: row._id, body: { active: next } });
    } catch {
      // revert on error
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] });
    }
  };

  const onApprove = async (id: string) => {
    await patchMutation.mutateAsync({ id, body: { status: 'Approved' } });
  };

  const onReject = async (id: string, rejectedReason: string) => {
    await patchMutation.mutateAsync({ id, body: { status: 'Rejected', rejectedReason } });
  };

  const exportCsv = () => {
    const rows = items.map((r: any) => ({
      ID: r.id || r._id,
      Name: r.name,
      Description: r.description?.replace(/\n/g, ' '),
      User: r.user?.fullName || r.userId?.email || '-',
      Price: r.price,
      Country: r.country || '-',
      State: r.state || '-',
      City: r.city || '-',
      Premium: r.isPremium ? 'Yes' : 'No',
      Status: r.status,
      Active: r.active ? 'Yes' : 'No',
      RejectedReason: r.rejectedReason || '-',
      ExpiryDate: r.expiryDate || '-'
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'requested-advertisements.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const resetFilters = () => {
    setFilters({ 
      search: '', 
      page: 1, 
      limit: 10, 
      country: '', 
      state: '', 
      city: '', 
      status: '', 
      premium: '' 
    });
  };

  return (
    <AdminLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requested Advertisement</h1>
            <p className="text-gray-600">Manage requested advertisements</p>
          </div>
        </div>
      }
    >
      {/* Filter Bar */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <Select value={filters.status} onValueChange={v => setFilters({ ...filters, status: v, page: 1 })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Featured/Premium Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Featured/Premium:</span>
              <Select value={filters.premium} onValueChange={v => setFilters({ ...filters, premium: v, page: 1 })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="true">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Location Filters */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Country:</span>
              <Select value={filters.country} onValueChange={v => setFilters({ ...filters, country: v === 'ALL' ? '' : v, page: 1 })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="India">India</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">City:</span>
              <Select value={filters.city} onValueChange={v => setFilters({ ...filters, city: v === 'ALL' ? '' : v, page: 1 })}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Right side tools */}
            <div className="ml-auto flex items-center gap-2">
              <Input 
                placeholder="Search name, description, user..." 
                value={filters.search} 
                onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} 
                className="w-64" 
              />
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] })} 
                disabled={isRefetching}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button onClick={exportCsv}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
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
              <TableHead>Rejected Reason</TableHead>
              <TableHead>Expiry Date</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  {Array.from({ length: 16 }).map((__, j) => (
                    <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={16}>
                  <div className="py-10 text-center text-gray-600">
                    No advertisements found 
                    <Button variant="outline" className="ml-2" onClick={resetFilters}>
                      Reset Filters
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((row: any, index: number) => (
                <TableRow key={row._id || row.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <TableCell className="max-w-[140px] truncate font-mono text-xs">{row.id || row._id}</TableCell>
                  <TableCell className="font-medium max-w-[180px] truncate" title={row.name}>
                    {row.name}
                  </TableCell>
                  <TableCell className="max-w-[240px]">
                    <div className="line-clamp-2 text-gray-600">
                      {row.description}
                      {row.description && row.description.length > 100 && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <button className="text-blue-600 hover:text-blue-700 ml-1">View More</button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="text-sm">{row.description}</div>
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[180px]">
                    <div className="line-clamp-2" title={row.user?.fullName || row.userId?.email}>
                      {row.user?.fullName || row.userId?.email || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{formatINR(row.price || 0)}</TableCell>
                  <TableCell>
                    {row.image ? (
                      <img src={row.image} alt="thumbnail" className="w-12 h-12 rounded object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                        No image
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.otherImages && row.otherImages.length > 0 ? (
                      <div className="flex gap-1">
                        {row.otherImages.slice(0, 3).map((img: string, i: number) => (
                          <img key={i} src={img} alt={`thumb-${i}`} className="w-6 h-6 rounded object-cover" />
                        ))}
                        {row.otherImages.length > 3 && (
                          <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs">
                            +{row.otherImages.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-500 text-sm">0</span>
                    )}
                  </TableCell>
                  <TableCell>{row.country || '-'}</TableCell>
                  <TableCell>{row.state || '-'}</TableCell>
                  <TableCell>{row.city || '-'}</TableCell>
                  <TableCell>
                    {row.isPremium ? (
                      <Badge className="bg-purple-100 text-purple-800 border-purple-200">Premium</Badge>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        {row.status === 'Under Review' && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Under Review</Badge>}
                        {row.status === 'Approved' && <Badge className="bg-green-100 text-green-800 border-green-200">Approved</Badge>}
                        {row.status === 'Rejected' && <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>}
                        {row.status === 'Inactive' && <Badge className="bg-gray-100 text-gray-800 border-gray-200">Inactive</Badge>}
                        {!row.status && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Under Review</Badge>}
                      </div>
                      {row.status === 'Under Review' && (
                        <div className="flex gap-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => onApprove(row._id || row.id)}
                          >
                            Approve
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Advertisement</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejecting this advertisement.
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea 
                                placeholder="Enter rejection reason..." 
                                id={`reject-reason-${row._id}`}
                              />
                              <DialogFooter>
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    const textarea = document.getElementById(`reject-reason-${row._id}`) as HTMLTextAreaElement;
                                    const reason = textarea?.value || '';
                                    if (reason.trim()) {
                                      onReject(row._id || row.id, reason);
                                    } else {
                                      toast({ title: 'Please provide a reason', variant: 'destructive' });
                                    }
                                  }}
                                  className="text-red-600"
                                >
                                  Reject
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Switch 
                      checked={row.active || false} 
                      onCheckedChange={(v) => onToggleActive(row, v)} 
                    />
                  </TableCell>
                  <TableCell>
                    {row.rejectedReason ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-red-600 hover:text-red-700 text-sm max-w-[150px] truncate block">
                            {row.rejectedReason}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                          <div className="text-sm">{row.rejectedReason}</div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <span className="text-gray-500">–</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '–'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Drawer>
                        <DrawerTrigger asChild>
                          <Button variant="ghost" size="icon" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                        </DrawerTrigger>
                        <DrawerContent>
                          <DrawerHeader>
                            <DrawerTitle>Edit Advertisement</DrawerTitle>
                          </DrawerHeader>
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input 
                              defaultValue={row.name} 
                              placeholder="Name" 
                              onChange={(e) => (row.__edit = { ...(row.__edit||{}), name: e.target.value })} 
                            />
                            <Input 
                              defaultValue={row.price} 
                              type="number" 
                              placeholder="Price" 
                              onChange={(e) => (row.__edit = { ...(row.__edit||{}), price: Number(e.target.value||0) })} 
                            />
                            <Input 
                              defaultValue={row.country} 
                              placeholder="Country" 
                              onChange={(e) => (row.__edit = { ...(row.__edit||{}), country: e.target.value })} 
                            />
                            <Input 
                              defaultValue={row.state} 
                              placeholder="State" 
                              onChange={(e) => (row.__edit = { ...(row.__edit||{}), state: e.target.value })} 
                            />
                            <Input 
                              defaultValue={row.city} 
                              placeholder="City" 
                              onChange={(e) => (row.__edit = { ...(row.__edit||{}), city: e.target.value })} 
                            />
                            <Input 
                              defaultValue={row.expiryDate ? String(row.expiryDate).slice(0,10) : ''} 
                              type="date" 
                              onChange={(e) => (row.__edit = { ...(row.__edit||{}), expiryDate: e.target.value })} 
                            />
                            <div className="col-span-1 md:col-span-2">
                              <Textarea 
                                defaultValue={row.description} 
                                placeholder="Description" 
                                className="min-h-[100px]" 
                                onChange={(e) => (row.__edit = { ...(row.__edit||{}), description: e.target.value })} 
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <label className="text-sm">Premium</label>
                              <Switch 
                                defaultChecked={!!row.isPremium} 
                                onCheckedChange={(v) => (row.__edit = { ...(row.__edit||{}), isPremium: v })} 
                              />
                            </div>
                          </div>
                          <DrawerFooter>
                            <Button 
                              onClick={async () => { 
                                await patchMutation.mutateAsync({ id: row._id || row.id, body: row.__edit || {} }); 
                                queryClient.invalidateQueries({ queryKey: ['/api/admin/ads'] }); 
                              }}
                            >
                              Save Changes
                            </Button>
                            <DrawerClose asChild>
                              <Button variant="outline">Close</Button>
                            </DrawerClose>
                          </DrawerFooter>
                        </DrawerContent>
                      </Drawer>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Advertisement?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the advertisement.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => deleteMutation.mutate(row._id || row.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
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

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
        <div>
          Showing {Math.min((filters.page - 1) * filters.limit + 1, pagination.total)} to {Math.min(filters.page * filters.limit, pagination.total)} of {pagination.total} rows
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            disabled={filters.page <= 1} 
            onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
          >
            Previous
          </Button>
          <Button 
            variant="outline" 
            disabled={filters.page >= pagination.pages} 
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
