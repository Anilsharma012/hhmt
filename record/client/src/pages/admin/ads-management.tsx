import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Eye, Edit, Trash2, Star, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLocation } from 'wouter';

export default function AdsManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    page: 1
  });

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['/api/admin/listings', { status: filters.status, categoryId: filters.category, q: filters.search, page: filters.page }],
    enabled: user?.role === 'admin'
  });

  const { data: categories } = useQuery({
    queryKey: ['/api/categories'],
    enabled: user?.role === 'admin'
  });

  const updateListingMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/admin/listings/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Listing updated',
        description: 'The listing has been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/listings/featured'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => setLocation('/')} data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const listings = ((listingsData as any)?.data?.listings) || [];
  const pagination = ((listingsData as any)?.data?.pagination) || { total: listings.length, pages: 1 };

  const handleStatusUpdate = (listingId: string, status: string) => {
    updateListingMutation.mutate({
      id: listingId,
      updates: { status }
    });
  };

  const handleFeatureToggle = (listingId: string, isFeatured: boolean) => {
    updateListingMutation.mutate({
      id: listingId,
      updates: { isFeatured: !isFeatured }
    });
  };

  const handleUrgentToggle = (listingId: string, isUrgent: boolean) => {
    updateListingMutation.mutate({
      id: listingId,
      updates: { isUrgent: !isUrgent }
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-ads-management-title">
                Ads Management
              </h1>
              <p className="text-muted-foreground">
                Manage all advertisements on the platform
              </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Input
                      placeholder="Search ads..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                      data-testid="input-search-ads"
                    />
                  </div>
                  
                  <div>
                    <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value, page: 1 }))}>
                      <SelectTrigger data-testid="select-status-filter">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="sold">Sold</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value, page: 1 }))}>
                      <SelectTrigger data-testid="select-category-filter">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        {categories?.map((category: any) => (
                          category._id && <SelectItem key={category._id} value={category._id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({ search: '', status: '', category: '', page: 1 })}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Ads List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Advertisements ({pagination.total || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-20 h-20 bg-muted animate-pulse rounded"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground" data-testid="text-no-ads">
                      No advertisements found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {listings.map((listing: any) => (
                      <div key={listing._id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <img 
                          src={listing.images[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop'} 
                          alt={listing.title}
                          className="w-20 h-20 object-cover rounded"
                          data-testid={`img-listing-${listing._id}`}
                        />
                        
                        <div className="flex-1">
                          <h4 className="font-semibold text-foreground mb-1" data-testid={`text-listing-title-${listing._id}`}>
                            {listing.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            by {listing.userId.name} • {listing.categoryId.name}
                          </p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm font-medium text-primary">
                              ₹{listing.price.toLocaleString()}
                            </span>
                            <Badge 
                              variant={
                                listing.status === 'active' ? 'default' :
                                listing.status === 'draft' ? 'secondary' :
                                listing.status === 'sold' ? 'outline' : 'destructive'
                              }
                              data-testid={`badge-status-${listing._id}`}
                            >
                              {listing.status}
                            </Badge>
                            {listing.isFeatured && (
                              <Badge className="bg-yellow-500" data-testid={`badge-featured-${listing._id}`}>
                                Featured
                              </Badge>
                            )}
                            {listing.isUrgent && (
                              <Badge className="bg-red-500" data-testid={`badge-urgent-${listing._id}`}>
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Eye className="w-3 h-3 mr-1" />
                            {listing.views} views • {new Date(listing.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(listing._id, 'active')}
                              disabled={listing.status === 'active'}
                              data-testid={`button-approve-${listing._id}`}
                            >
                              <CheckCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(listing._id, 'rejected')}
                              disabled={listing.status === 'rejected'}
                              data-testid={`button-reject-${listing._id}`}
                            >
                              <XCircle className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleFeatureToggle(listing._id, listing.isFeatured)}
                              data-testid={`button-feature-${listing._id}`}
                            >
                              <Star className={`w-3 h-3 ${listing.isFeatured ? 'fill-current' : ''}`} />
                            </Button>
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setLocation(`/listing/${listing._id}`)}
                              data-testid={`button-view-${listing._id}`}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUrgentToggle(listing._id, listing.isUrgent)}
                              data-testid={`button-urgent-${listing._id}`}
                            >
                              <Clock className={`w-3 h-3 ${listing.isUrgent ? 'text-red-500' : ''}`} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button 
                      variant="outline" 
                      disabled={filters.page === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground mx-4">
                      Page {filters.page} of {pagination.pages}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      disabled={filters.page === pagination.pages}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
