import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchBar() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    
    setLocation(`/listings${params.toString() ? `?${params.toString()}` : ''}`);
  };

  return (
    <form onSubmit={handleSearch} className="flex bg-white rounded-lg overflow-hidden shadow-sm" data-testid="form-search">
      <Select value={selectedCategory} onValueChange={setSelectedCategory}>
        <SelectTrigger className="bg-white border-0 rounded-none w-48 focus:ring-2 focus:ring-primary" data-testid="select-category">
          <SelectValue placeholder="All Categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          <SelectItem value="cars">Cars</SelectItem>
          <SelectItem value="properties">Properties</SelectItem>
          <SelectItem value="mobiles">Mobiles</SelectItem>
          <SelectItem value="electronics">Electronics</SelectItem>
          <SelectItem value="fashion">Fashion</SelectItem>
          <SelectItem value="jobs">Jobs</SelectItem>
        </SelectContent>
      </Select>
      
      <div className="w-px bg-border"></div>
      
      <Input
        type="text"
        placeholder="Search 'Furniture'"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="flex-1 border-0 rounded-none focus-visible:ring-2 focus-visible:ring-primary"
        data-testid="input-search"
      />
      
      <Button 
        type="submit"
        className="bg-primary hover:bg-primary/90 text-white rounded-none px-6"
        data-testid="button-search"
      >
        <Search className="w-4 h-4" />
      </Button>
    </form>
  );
}
