import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function AdminCategories() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [catForm, setCatForm] = useState({ id: '', name: '', slug: '', icon: '' });
  const [subForm, setSubForm] = useState({ id: '', categoryId: '', name: '', slug: '' });
  const { data: categories = [] } = useQuery({ queryKey: ['/api/categories'] });
  const { data: subcategories = [] } = useQuery({ queryKey: ['/api/categories/' + (subForm.categoryId || 'none') + '/subcategories'], enabled: !!subForm.categoryId });

  const saveCategory = useMutation({
    mutationFn: async () => {
      const payload = { name: catForm.name, slug: catForm.slug, icon: catForm.icon };
      const res = await apiRequest(catForm.id ? 'PUT' : 'POST', catForm.id ? `/api/admin/categories/${catForm.id}` : '/api/admin/categories', payload);
      return res.json();
    },
    onSuccess: () => {
      setCatForm({ id: '', name: '', slug: '', icon: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    }
  });

  const saveSubcategory = useMutation({
    mutationFn: async () => {
      const payload = { categoryId: subForm.categoryId, name: subForm.name, slug: subForm.slug };
      const res = await apiRequest(subForm.id ? 'PUT' : 'POST', subForm.id ? `/api/admin/subcategories/${subForm.id}` : '/api/admin/subcategories', payload);
      return res.json();
    },
    onSuccess: () => {
      setSubForm({ id: '', categoryId: '', name: '', slug: '' });
      queryClient.invalidateQueries({ queryKey: ['/api/categories/' + (subForm.categoryId || 'none') + '/subcategories'] });
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
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Categories Management</h1>
                <p className="text-gray-600">Manage product categories and subcategories</p>
              </div>
              <Button 
                onClick={() => setCatForm({ id: '', name: '', slug: '', icon: '' })}
                className="bg-[#4285f4] hover:bg-[#3367d6]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Categories ({categories.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Category Form */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input 
                        placeholder="Category Name" 
                        value={catForm.name} 
                        onChange={e => setCatForm({ ...catForm, name: e.target.value })} 
                        className="bg-white"
                      />
                      <Input 
                        placeholder="URL Slug" 
                        value={catForm.slug} 
                        onChange={e => setCatForm({ ...catForm, slug: e.target.value })} 
                        className="bg-white"
                      />
                      <Input 
                        placeholder="Icon (emoji)" 
                        value={catForm.icon} 
                        onChange={e => setCatForm({ ...catForm, icon: e.target.value })} 
                        className="bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => saveCategory.mutate()}
                        disabled={saveCategory.isPending}
                        className="bg-[#4285f4] hover:bg-[#3367d6]"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {catForm.id ? 'Update' : 'Create'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setCatForm({ id: '', name: '', slug: '', icon: '' })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  {/* Categories List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(categories as any[]).map(c => (
                      <div key={c._id} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                            {c.icon && <span className="text-xl">{c.icon}</span>}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{c.name}</div>
                            <div className="text-sm text-gray-500">/{c.slug}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setCatForm({ id: c._id, name: c.name, slug: c.slug, icon: c.icon })}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Subcategories ({subcategories.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Subcategory Form */}
                  <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <select 
                        className="px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4285f4]"
                        value={subForm.categoryId} 
                        onChange={e => setSubForm({ ...subForm, categoryId: e.target.value })}
                      >
                        <option value="">Select Category</option>
                        {(categories as any[]).map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                      <Input 
                        placeholder="Subcategory Name" 
                        value={subForm.name} 
                        onChange={e => setSubForm({ ...subForm, name: e.target.value })} 
                        className="bg-white"
                      />
                      <Input 
                        placeholder="URL Slug" 
                        value={subForm.slug} 
                        onChange={e => setSubForm({ ...subForm, slug: e.target.value })} 
                        className="bg-white"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => saveSubcategory.mutate()}
                        disabled={saveSubcategory.isPending || !subForm.categoryId}
                        className="bg-[#4285f4] hover:bg-[#3367d6]"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {subForm.id ? 'Update' : 'Create'}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setSubForm({ id: '', categoryId: '', name: '', slug: '' })}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subcategories List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(subcategories as any[]).map(s => (
                      <div key={s._id} className="p-3 bg-white border border-gray-100 rounded-lg flex items-center justify-between hover:bg-gray-50 transition-colors">
                        <div>
                          <div className="font-medium text-gray-900">{s.name}</div>
                          <div className="text-sm text-gray-500">/{s.slug}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">Sub</Badge>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSubForm({ id: s._id, categoryId: s.categoryId, name: s.name, slug: s.slug })}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
