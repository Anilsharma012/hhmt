import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { SearchBar } from './SearchBar';
import { UserDropdown } from './UserDropdown';
import { CategoryWithSubcategories } from './CategoryWithSubcategories';
import { Button } from '@/components/ui/button';
import { Plus, Download, MapPin, User, Search, Bell } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

export function Header() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', searchQuery.trim());
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }
      setLocation(`/listings?${params.toString()}`);
    } else {
      if (selectedCategory !== 'all') {
        setLocation(`/category/${selectedCategory}`);
      } else {
        setLocation('/listings');
      }
    }
  };

  return (
    <header className="bg-[#4285f4] shadow-lg sticky top-0 z-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" data-testid="link-home">
              <span className="text-white text-2xl font-bold tracking-wide">POSTTRR</span>
            </Link>
          </div>
          
          {/* Search Bar with Categories Dropdown - Exact Match */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="flex bg-white rounded-lg overflow-hidden shadow-md h-10">
              {/* Categories Dropdown */}
              <div className="relative">
                <Select value={selectedCategory} onValueChange={(value) => {
                  setSelectedCategory(value);
                  if (value !== 'all') {
                    // Navigate to category page
                    setLocation(`/category/${value}`);
                  }
                }}>
                  <SelectTrigger className="w-36 h-10 border-0 border-r border-gray-300 rounded-none bg-white text-gray-700 text-sm px-3">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category: any) => (
                      <SelectItem key={category._id} value={category.slug}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="flex-1 flex">
                <input
                  type="text"
                  placeholder='Search "Mobiles"'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="flex-1 px-4 py-2 text-sm text-gray-700 bg-white border-0 focus:outline-none h-10"
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#4285f4] hover:bg-[#3367d6] text-white px-4 h-10 flex items-center justify-center"
                >
                  <Search className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Search</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Right Section */}
          <div className="flex items-center space-x-6">
            {/* Location */}
            <div className="hidden md:flex items-center text-white text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span data-testid="text-location">Budha Khera...</span>
            </div>
            
            {/* User */}
            {user ? (
              <UserDropdown />
            ) : (
              <Link to="/login" data-testid="link-login">
                <Button variant="ghost" className="text-white hover:text-white/80">Sign in</Button>
              </Link>
            )}

            {/* Ad Listing Button */}
            <Link to="/post-ad" data-testid="link-post-ad">
              <Button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 text-sm font-semibold rounded">
                Ad Listing
              </Button>
            </Link>
            
            {/* Language Selector */}
            <div className="text-white text-sm font-medium">
              🇬🇧 EN
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Navigation - Exact Match */}
      <div className="bg-white shadow-sm">
        <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-12 overflow-x-auto">
            {categories.length > 0 ? (
              categories.slice(0, 8).map((category: any, index: number) => (
                <CategoryWithSubcategories
                  key={category._id}
                  category={category}
                  isActive={index === 0} // First category is active by default
                />
              ))
            ) : (
              // Fallback static categories
              <>
                <Link to="/category/cars" className="px-6 py-3 text-sm text-gray-800 hover:text-[#4285f4] whitespace-nowrap transition-colors border-b-2 border-[#4285f4]" data-testid="link-category-cars">
                  Cars
                </Link>
                <Link to="/category/properties" className="px-6 py-3 text-sm text-gray-600 hover:text-[#4285f4] hover:border-b-2 hover:border-[#4285f4] whitespace-nowrap transition-colors" data-testid="link-category-properties">
                  Properties ▼
                </Link>
                <Link to="/category/mobiles" className="px-6 py-3 text-sm text-gray-600 hover:text-[#4285f4] hover:border-b-2 hover:border-[#4285f4] whitespace-nowrap transition-colors" data-testid="link-category-mobiles">
                  Mobiles ▼
                </Link>
                <Link to="/category/jobs" className="px-6 py-3 text-sm text-gray-600 hover:text-[#4285f4] hover:border-b-2 hover:border-[#4285f4] whitespace-nowrap transition-colors" data-testid="link-category-jobs">
                  Jobs ▼
                </Link>
                <Link to="/category/fashion" className="px-6 py-3 text-sm text-gray-600 hover:text-[#4285f4] hover:border-b-2 hover:border-[#4285f4] whitespace-nowrap transition-colors" data-testid="link-category-fashion">
                  Fashion ▼
                </Link>
                <Link to="/category/books-sports" className="px-6 py-3 text-sm text-gray-600 hover:text-[#4285f4] hover:border-b-2 hover:border-[#4285f4] whitespace-nowrap transition-colors" data-testid="link-category-books">
                  Books, Sports & Hobbies ▼
                </Link>
                <Link to="/category/electronics" className="px-6 py-3 text-sm text-gray-600 hover:text-[#4285f4] hover:border-b-2 hover:border-[#4285f4] whitespace-nowrap transition-colors" data-testid="link-category-electronics">
                  Electronics & Appliances ▼
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
