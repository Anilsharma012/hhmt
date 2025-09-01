import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { BottomNavigation } from '@/components/BottomNavigation';
import { CategoryCard } from '@/components/CategoryCard';
import { ListingCard } from '@/components/ListingCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

export default function Home() {
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const { data: featuredListings = [] } = useQuery({
    queryKey: ['/api/listings/featured']
  });

  const { data: recentListingsData } = useQuery({
    queryKey: ['/api/listings?page=1&limit=8']
  });

  const recentListings = (recentListingsData as any)?.listings || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Banner - Exact Match */}
        <section className="bg-gray-50 py-6">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative bg-gradient-to-r from-[#4285f4] via-[#6ba3f7] to-[#4285f4] rounded-2xl overflow-hidden shadow-xl h-80">
              <div className="absolute inset-0 bg-blue-600/10"></div>
              
              {/* Decorative circles */}
              <div className="absolute top-16 left-16 w-20 h-20 bg-[#6ba3f7] rounded-full opacity-30"></div>
              <div className="absolute bottom-12 left-12 w-6 h-6 bg-[#87ceeb] rounded-full opacity-60"></div>
              <div className="absolute top-1/2 right-12 w-8 h-8 bg-[#87ceeb] rounded-full opacity-50"></div>
              
              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 h-full">
                {/* Left Section - Furniture */}
                <div className="relative flex items-center">
                  <div className="text-white">
                    <h2 className="text-4xl font-bold mb-6 leading-tight">
                      Resale Furniture
                    </h2>
                    <div className="flex items-center space-x-4">
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-4 py-2">
                        ← 
                      </Button>
                      <Button size="sm" className="bg-white/20 hover:bg-white/30 text-white border border-white/30 rounded-full px-4 py-2">
                        →
                      </Button>
                    </div>
                  </div>
                  <div className="absolute -right-8 top-1/2 transform -translate-y-1/2">
                    <img 
                      src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                      alt="Modern furniture" 
                      className="w-64 h-48 object-cover rounded-xl shadow-lg"
                    />
                  </div>
                </div>
                
                {/* Right Section - Car */}
                <div className="relative flex items-center justify-end">
                  <div className="absolute top-8 right-8 z-20">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
                      <div className="text-white text-lg font-bold">BEST</div>
                      <div className="text-white/90 text-sm">×</div>
                      <div className="text-white/90 text-sm">×</div>
                    </div>
                  </div>
                  <img 
                    src="https://images.unsplash.com/photo-1627634777217-c864268db30c?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&h=300" 
                    alt="Modern white car" 
                    className="w-80 h-56 object-cover rounded-xl shadow-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Popular Categories - Exact Match */}
        <section className="py-8 bg-white">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-categories-title">
                Popular Categories
              </h2>
              <div className="flex space-x-3">
                <Button size="sm" className="w-10 h-10 rounded-full bg-[#4285f4] hover:bg-[#3367d6] shadow-md" data-testid="button-categories-prev">
                  <ChevronLeft className="w-4 h-4 text-white" />
                </Button>
                <Button size="sm" className="w-10 h-10 rounded-full bg-[#4285f4] hover:bg-[#3367d6] shadow-md" data-testid="button-categories-next">
                  <ChevronRight className="w-4 h-4 text-white" />
                </Button>
              </div>
            </div>
            
            {/* Categories Grid - Exact Match */}
            <div className="grid grid-cols-4 md:grid-cols-8 lg:grid-cols-9 gap-6 justify-center">
              {categories.slice(0, 9).map((category: any, index: number) => {
                const categoryIcons = [
                  '🚗', '🏠', '📱', '💼', '👕', '📚', '🏍️', '📺', '🚛'
                ];
                const categoryNames = [
                  'Cars', 'Properties', 'Mobiles', 'Jobs', 'Fashion', 
                  'Books, Sports & Hobbies', 'Bikes', 'Electronics & Appliances', 'Commercial Vehicles'
                ];
                
                return (
                  <Link key={category._id || index} to={`/category/${category.slug || 'cars'}`} className="flex flex-col items-center group">
                    <div className="w-20 h-20 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:shadow-lg transition-all duration-200 border border-gray-100">
                      <span className="text-3xl">{categoryIcons[index] || categoryIcons[0]}</span>
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center leading-tight max-w-[80px]">
                      {categoryNames[index] || category.name || 'Category'}
                    </span>
                  </Link>
                );
              })}
              
              {/* Fallback categories if not enough from API */}
              {categories.length < 9 && [
                { name: 'Cars', icon: '🚗', slug: 'cars' },
                { name: 'Properties', icon: '🏠', slug: 'properties' },
                { name: 'Mobiles', icon: '📱', slug: 'mobiles' },
                { name: 'Jobs', icon: '💼', slug: 'jobs' },
                { name: 'Fashion', icon: '👕', slug: 'fashion' },
                { name: 'Books, Sports & Hobbies', icon: '📚', slug: 'books-sports' },
                { name: 'Bikes', icon: '🏍️', slug: 'bikes' },
                { name: 'Electronics & Appliances', icon: '📺', slug: 'electronics' },
                { name: 'Commercial Vehicles & Services', icon: '🚛', slug: 'commercial' }
              ].slice(categories.length).map((category, index) => (
                <Link key={`fallback-${index}`} to={`/category/${category.slug}`} className="flex flex-col items-center group">
                  <div className="w-20 h-20 bg-gray-50 hover:bg-gray-100 rounded-2xl flex items-center justify-center mb-3 group-hover:shadow-lg transition-all duration-200 border border-gray-100">
                    <span className="text-3xl">{category.icon}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-900 text-center leading-tight max-w-[80px]">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Mobile Categories - Horizontal Scroll */}
        <section className="md:hidden py-4 bg-white">
          <div className="px-4">
            <div className="flex space-x-4 overflow-x-auto pb-2">
              {[
                { name: 'Cars', icon: '🚗', slug: 'cars' },
                { name: 'Properties', icon: '🏠', slug: 'properties' },
                { name: 'Mobiles', icon: '📱', slug: 'mobiles' },
                { name: 'Jobs', icon: '💼', slug: 'jobs' },
                { name: 'Fashion', icon: '👕', slug: 'fashion' },
                { name: 'Bikes', icon: '🏍️', slug: 'bikes' },
                { name: 'Electronics &...', icon: '📺', slug: 'electronics' },
                { name: 'Furniture', icon: '🪑', slug: 'furniture' }
              ].map((category, index) => (
                <Link key={index} to={`/category/${category.slug}`} className="flex flex-col items-center min-w-[70px]">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-2 shadow-sm">
                    <span className="text-2xl">{category.icon}</span>
                  </div>
                  <span className="text-xs text-gray-700 text-center leading-tight">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Fresh Recommendations - Mobile */}
        <section className="md:hidden py-4 bg-white border-t border-gray-100">
          <div className="px-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              Fresh Recommendations
              <div className="ml-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✨</span>
              </div>
            </h2>
          </div>
        </section>

        {/* Featured Ads */}
        <section className="py-6 bg-white">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900" data-testid="text-featured-title">
                Featured Ads
              </h2>
              <Link to="/featured" className="text-[#4285f4] hover:text-[#3367d6] font-medium text-sm" data-testid="link-view-all-featured">
                See All
              </Link>
            </div>
            
            {/* Mobile: 2 columns, Desktop: 4 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
              {featuredListings.slice(0, 4).map((listing: any) => (
                <div key={listing._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="relative">
                    <img 
                      src={listing.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'} 
                      alt={listing.title}
                      className="w-full h-32 lg:h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <button className="w-7 h-7 bg-white/80 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-sm">♡</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 text-sm mb-1 line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-lg font-bold text-gray-900 mb-1">
                      ₹{listing.price?.toLocaleString() || '0'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {listing.location?.city || 'Location'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Recent Ads - Hidden on Mobile */}
        <section className="hidden lg:block py-8 bg-gray-50">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900" data-testid="text-recent-title">
                Recent Ads
              </h2>
              <Link to="/listings" className="text-[#4285f4] hover:text-[#3367d6] font-medium text-sm" data-testid="link-view-all-recent">
                View All
              </Link>
            </div>
            
            <div className="grid grid-cols-4 gap-6">
              {recentListings.slice(0, 8).map((listing: any) => (
                <div key={listing._id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all">
                  <div className="relative">
                    <img 
                      src={listing.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop'} 
                      alt={listing.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <button className="w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <span className="text-gray-600">♡</span>
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {listing.title}
                    </h3>
                    <p className="text-xl font-bold text-gray-900 mb-2">
                      ₹{listing.price?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {listing.location?.city || 'Location'}, {listing.location?.state || 'India'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNavigation />
      
      {/* Bottom padding for mobile navigation */}
      <div className="md:hidden h-24"></div>
    </div>
  );
}
