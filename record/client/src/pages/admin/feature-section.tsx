import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Download, RefreshCw, Pencil, Trash2, GripVertical, Columns, Search } from 'lucide-react';

function useDebounced<T>(value: T, delay = 400) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// Style options with thumbnail representations
const STYLE_OPTIONS = [
  { key: 'style_card', label: 'Card Style', thumbnail: '🃏' },
  { key: 'style_carousel', label: 'Carousel Style', thumbnail: '🎠' },
  { key: 'style_grid_2', label: 'Grid 2 Columns', thumbnail: '⊞' },
  { key: 'style_grid_3', label: 'Grid 3 Columns', thumbnail: '⚏' },
  { key: 'style_masonry', label: 'Masonry Style', thumbnail: '🧱' },
  { key: 'style_stack', label: 'Stack Style', thumbnail: '📚' }
];

const FILTER_OPTIONS = [
  'Most Liked',
  'Most Viewed', 
  'Featured Ads',
  'Latest Ads',
  'Nearby',
  'Category:Cars',
  'Category:Mobiles'
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim();
}

interface FeatureSectionForm {
  title: string;
  slug: string;
  filters: string;
  style: string;
  description: string;
}

interface FeatureSectionData extends FeatureSectionForm {
  _id: string;
  id: string;
  sequence: number;
}

export default function FeatureSection() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [filters, setFilters] = useState({ 
    search: '', 
    page: 1, 
    limit: 10 
  });
  const debouncedSearch = useDebounced(filters.search, 400);

  const [form, setForm] = useState<FeatureSectionForm>({
    title: '',
    slug: '',
    filters: 'Most Liked',
    style: '',
    description: ''
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const params = useMemo(() => ({ 
    ...filters, 
    search: debouncedSearch,
    sort: 'sequence:asc'
  }), [filters, debouncedSearch]);

  const { data, isLoading, isRefetching } = useQuery({
    queryKey: ['/api/admin/feature-sections', params],
  });

  const items = (data as any)?.data ?? [];
  const pagination = (data as any)?.pagination ?? { page: filters.page, limit: filters.limit, total: items.length, pages: 1 };

  // Auto-generate slug from title
  useEffect(() => {
    if (form.title && !editingId) {
      setForm(prev => ({ ...prev, slug: generateSlug(prev.title) }));
    }
  }, [form.title, editingId]);

  const createMutation = useMutation({
    mutationFn: async (data: FeatureSectionForm) => {
      const res = await apiRequest('POST', '/api/admin/feature-sections', data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Feature section created successfully' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-sections'] });
    },
    onError: (e: any) => toast({ title: 'Create failed', description: e.message, variant: 'destructive' }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FeatureSectionForm }) => {
      const res = await apiRequest('PATCH', `/api/admin/feature-sections/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Feature section updated successfully' });
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-sections'] });
    },
    onError: (e: any) => toast({ title: 'Update failed', description: e.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest('DELETE', `/api/admin/feature-sections/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Deleted', description: 'Feature section deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-sections'] });
    },
    onError: (e: any) => toast({ title: 'Delete failed', description: e.message, variant: 'destructive' }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest('PATCH', '/api/admin/feature-sections/order', { ids });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Order updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-sections'] });
    },
    onError: (e: any) => toast({ title: 'Reorder failed', description: e.message, variant: 'destructive' }),
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card><CardContent className="p-8 text-center"><div className="text-2xl font-bold mb-4">Access Denied</div><Button onClick={() => setLocation('/')}>Go Home</Button></CardContent></Card>
      </div>
    );
  }

  const resetForm = () => {
    setForm({
      title: '',
      slug: '',
      filters: 'Most Liked',
      style: '',
      description: ''
    });
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!form.title.trim()) {
      toast({ title: 'Validation Error', description: 'Title is required', variant: 'destructive' });
      return;
    }
    if (!form.slug.trim()) {
      toast({ title: 'Validation Error', description: 'Slug is required', variant: 'destructive' });
      return;
    }
    if (!form.style) {
      toast({ title: 'Validation Error', description: 'Style selection is required', variant: 'destructive' });
      return;
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleEdit = (item: FeatureSectionData) => {
    setForm({
      title: item.title,
      slug: item.slug,
      filters: item.filters,
      style: item.style,
      description: item.description
    });
    setEditingId(item._id || item.id);
  };

  const exportCsv = () => {
    const rows = items.map((r: FeatureSectionData) => ({
      ID: r.id || r._id,
      Title: r.title,
      Slug: r.slug,
      Filters: r.filters,
      Style: r.style,
      Description: r.description,
      Sequence: r.sequence
    }));
    const header = Object.keys(rows[0] || {}).join(',');
    const csv = [header, ...rows.map(r => Object.values(r).map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'feature-sections.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const newOrder = [...items];
    const draggedIndex = newOrder.findIndex(item => (item._id || item.id) === draggedItem);
    const targetIndex = newOrder.findIndex(item => (item._id || item.id) === targetId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Reorder items
    const [draggedElement] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedElement);

    // Extract ordered IDs
    const orderedIds = newOrder.map(item => item._id || item.id);
    
    // Optimistically update the query data
    queryClient.setQueryData(['/api/admin/feature-sections', params], (prev: any) => {
      if (!prev) return prev;
      return { ...prev, data: newOrder };
    });

    // Update server
    reorderMutation.mutate(orderedIds);
    setDraggedItem(null);
  };

  const resetFilters = () => {
    setFilters({ search: '', page: 1, limit: 10 });
  };

  return (
    <AdminLayout
      header={
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Feature Section</h1>
            <p className="text-gray-600">Manage home screen feature sections</p>
          </div>
        </div>
      }
    >
      {/* A) Create Feature Section Form */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingId ? 'Edit Feature Section' : 'Create Feature Section'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter title"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Slug */}
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  placeholder="auto-generated-slug"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>

              {/* Filters */}
              <div className="space-y-2">
                <Label htmlFor="filters">Filters *</Label>
                <Select value={form.filters} onValueChange={(v) => setForm(prev => ({ ...prev, filters: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILTER_OPTIONS.map(option => (
                      <SelectItem key={option} value={option}>{option}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Style Selection */}
            <div className="space-y-2">
              <Label>Select Style for APP Section *</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {STYLE_OPTIONS.map(style => (
                  <div
                    key={style.key}
                    className={`p-4 border-2 rounded-lg cursor-pointer text-center transition-colors ${
                      form.style === style.key 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setForm(prev => ({ ...prev, style: style.key }))}
                  >
                    <div className="text-2xl mb-2">{style.thumbnail}</div>
                    <div className="text-xs font-medium">{style.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter description (optional)"
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? 'Update' : 'Submit'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* B) Feature Sections List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Feature Sections List</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input 
                  placeholder="Search title, slug, filter..." 
                  value={filters.search} 
                  onChange={e => setFilters({ ...filters, search: e.target.value, page: 1 })} 
                  className="w-64 pl-8" 
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-sections'] })} 
                disabled={isRefetching}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh
              </Button>
              <Button variant="outline">
                <Columns className="w-4 h-4 mr-2" /> Columns
              </Button>
              <Button onClick={exportCsv}>
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
            </div>
          </div>
          <p className="text-sm text-gray-600">* To change the order, Drag the Table column Up & Down</p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto bg-white rounded-lg border border-gray-100">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Style</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Filters</TableHead>
                  <TableHead>Sequence</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}><div className="h-4 bg-gray-100 rounded animate-pulse" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <div className="py-10 text-center text-gray-600">
                        No feature sections found 
                        <Button variant="outline" className="ml-2" onClick={resetFilters}>
                          Reset Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((row: FeatureSectionData, index: number) => (
                    <TableRow 
                      key={row._id || row.id} 
                      className={`${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'} cursor-move hover:bg-gray-100`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, row._id || row.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, row._id || row.id)}
                    >
                      <TableCell>
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.id || row._id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{STYLE_OPTIONS.find(s => s.key === row.style)?.thumbnail || '📄'}</span>
                          <span className="text-xs text-gray-600">{row.style}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{row.title}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={row.description}>
                        {row.description || '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{row.filters}</Badge>
                      </TableCell>
                      <TableCell>{row.sequence || index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(row)} title="Edit">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-red-600" title="Delete">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Feature Section?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the feature section "{row.title}".
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
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
