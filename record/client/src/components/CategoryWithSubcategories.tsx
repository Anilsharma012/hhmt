import { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown } from 'lucide-react';

interface CategoryWithSubcategoriesProps {
  category: {
    _id: string;
    name: string;
    slug: string;
  };
  isActive?: boolean;
}

export function CategoryWithSubcategories({ category, isActive = false }: CategoryWithSubcategoriesProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const { data: subcategories = [] } = useQuery({
    queryKey: [`/api/categories/${category._id}/subcategories`],
    enabled: isHovered, // Only fetch when hovered
  });

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link 
        to={`/category/${category.slug}`} 
        className={`px-6 py-3 text-sm hover:text-[#4285f4] whitespace-nowrap transition-colors border-b-2 flex items-center gap-1 ${
          isActive 
            ? 'text-gray-800 border-[#4285f4]' 
            : 'text-gray-600 border-transparent hover:border-[#4285f4]'
        }`}
      >
        {category.name}
        <ChevronDown className="w-3 h-3" />
      </Link>
      
      {/* Subcategories Dropdown */}
      {isHovered && subcategories.length > 0 && (
        <div className="absolute top-full left-0 z-50 bg-white border border-gray-200 rounded-lg shadow-lg min-w-[200px] py-2">
          <Link 
            to={`/category/${category.slug}`}
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#4285f4] font-medium"
          >
            All {category.name}
          </Link>
          <div className="border-t border-gray-100 my-1"></div>
          {subcategories.map((subcategory: any) => (
            <Link
              key={subcategory._id}
              to={`/category/${category.slug}/${subcategory.slug}`}
              className="block px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-[#4285f4]"
            >
              {subcategory.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
