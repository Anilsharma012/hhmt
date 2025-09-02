import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { useRoute } from 'wouter';

export default function Listings() {
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    subcategory: '',
    city: '',
    minPrice: '',
    maxPrice: '',
    sort: 'createdAt'
  });
  const [page, setPage] = useState(1);
  const [categoryMatch, categoryParams] = useRoute('/category/:slug');
  const [subcategoryMatch, subcategoryParams] = useRoute('/category/:categorySlug/:subcategorySlug');

  const queryParams = new URLSearchParams({
    ...filters,
    page: page.toString(),
    minPrice: filters.minPrice || '',
    maxPrice: filters.maxPrice || '',
    subcategory: filters.subcategory || ''
  }).toString();
  
  const { data, isLoading } = useQuery({
    queryKey: [`/api/listings?${queryParams}`]
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  // When route has /category/:slug, map to category id once categories load
  useEffect(() => {
    if (match && params?.slug && categories.length) {
      const cat = (categories as any[]).find(c => c.slug === params.slug);
      setFilters(prev => ({ ...prev, category: cat?._id || '' }));
      setPage(1);
    }
  }, [match, params?.slug, categories]);

  const listings = (data as any)?.listings || [];
  const pagination = (data as any)?.pagination || {};

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search listings..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                data-testid="input-search-filter"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                <SelectTrigger data-testid="select-category-filter">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category: any) => (
                    category._id && <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">City</label>
              <Input
                placeholder="Enter city..."
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                data-testid="input-city-filter"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Sort by</label>
              <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
                <SelectTrigger data-testid="select-sort-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt">Newest First</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Min Price</label>
              <Input
                type="number"
                placeholder="₹0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                data-testid="input-min-price"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Max Price</label>
              <Input
                type="number"
                placeholder="₹1,00,000"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                data-testid="input-max-price"
              />
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-listings-title">
            {filters.search ? `Search results for "${filters.search}"` : 'All Listings'}
          </h1>
          <p className="text-muted-foreground" data-testid="text-listings-count">
            {pagination.total || 0} ads found
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-6 w-1/2 mb-2" />
                  <Skeleton className="h-3 w-2/3 mb-3" />
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-1/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-muted-foreground text-2xl"></i>
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-listings">
              No listings found
            </h3>
            <p className="text-muted-foreground mb-4">
              Try adjusting your search criteria
            </p>
            <Button onClick={() => setFilters({
              search: '',
              category: '',
              city: '',
              minPrice: '',
              maxPrice: '',
              sort: 'createdAt'
            })} data-testid="button-clear-filters">
              Clear Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing: any) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center space-x-2 mt-8">
                <Button 
                  variant="outline" 
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  data-testid="button-prev-page"
                >
                  Previous
                </Button>
                
                <span className="text-sm text-muted-foreground mx-4" data-testid="text-pagination-info">
                  Page {page} of {pagination.pages}
                </span>
                
                <Button 
                  variant="outline" 
                  disabled={page === pagination.pages}
                  onClick={() => setPage(page + 1)}
                  data-testid="button-next-page"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
