import { Link } from 'wouter';
import { Category } from '@shared/schema';

interface CategoryCardProps {
  category: Category;
  adCount?: number;
}

export function CategoryCard({ category, adCount = 0 }: CategoryCardProps) {
  const getIconBgColor = (slug: string) => {
    const colors = {
      'cars': 'bg-blue-50',
      'properties': 'bg-green-50',
      'mobiles': 'bg-purple-50',
      'jobs': 'bg-orange-50',
      'fashion': 'bg-pink-50',
      'books-sports': 'bg-teal-50',
      'bikes': 'bg-red-50',
      'electronics': 'bg-indigo-50',
      'commercial': 'bg-yellow-50'
    };
    return colors[slug as keyof typeof colors] || 'bg-gray-50';
  };

  const getIconColor = (slug: string) => {
    const colors = {
      'cars': 'text-blue-500',
      'properties': 'text-green-500',
      'mobiles': 'text-purple-500',
      'jobs': 'text-orange-500',
      'fashion': 'text-pink-500',
      'books-sports': 'text-teal-500',
      'bikes': 'text-red-500',
      'electronics': 'text-indigo-500',
      'commercial': 'text-yellow-500'
    };
    return colors[slug as keyof typeof colors] || 'text-gray-500';
  };

  return (
    <Link to={`/category/${category.slug}`} data-testid={`link-category-${category.slug}`}>
      <div className="category-hover bg-white rounded-xl p-6 text-center shadow-sm border border-border hover:shadow-md transition-all">
        <div className={`w-16 h-16 ${getIconBgColor(category.slug)} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <i className={`${category.icon} ${getIconColor(category.slug)} text-2xl`}></i>
        </div>
        <h3 className="font-semibold text-foreground mb-1" data-testid={`text-category-name-${category.slug}`}>
          {category.name}
        </h3>
        <p className="text-xs text-muted-foreground" data-testid={`text-category-count-${category.slug}`}>
          {adCount}+ ads
        </p>
      </div>
    </Link>
  );
}
