import { Link } from 'wouter';
import { useState } from 'react';
import { Listing } from '@shared/schema';
import { Heart, Eye, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toggleFavorite } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface ListingCardProps {
  listing: Listing & {
    userId: { name: string; avatar?: string; location?: any };
    categoryId: { name: string };
  };
  showFeaturedBadge?: boolean;
}

export function ListingCard({ listing, showFeaturedBadge = false }: ListingCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await toggleFavorite(listing._id);
      setIsFavorite(!isFavorite);
      toast({
        title: isFavorite ? 'Removed from favorites' : 'Added to favorites'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorite',
        variant: 'destructive'
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - new Date(date).getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return '1 day ago';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <Link to={`/listing/${listing._id}`} data-testid={`link-listing-${listing._id}`}>
      <div className="listing-card bg-white rounded-xl shadow-sm overflow-hidden border border-border">
        <div className="relative">
          <img 
            src={listing.images[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=250&fit=crop'} 
            alt={listing.title}
            className="w-full h-48 object-cover"
            data-testid={`img-listing-${listing._id}`}
          />
          {showFeaturedBadge && listing.isFeatured && (
            <div className="absolute top-3 left-3">
              <span className="bg-primary text-white px-2 py-1 rounded text-xs font-medium" data-testid={`badge-featured-${listing._id}`}>
                Featured
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-3 right-3 w-8 h-8 bg-white/90 rounded-full p-0 hover:bg-white"
            onClick={handleFavoriteClick}
            data-testid={`button-favorite-${listing._id}`}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-muted-foreground'}`} />
          </Button>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground mb-2 line-clamp-2" data-testid={`text-listing-title-${listing._id}`}>
            {listing.title}
          </h3>
          <p className="text-lg font-bold text-primary mb-2" data-testid={`text-listing-price-${listing._id}`}>
            {formatPrice(listing.price)}
          </p>
          <div className="flex items-center text-sm text-muted-foreground mb-3">
            <MapPin className="w-3 h-3 mr-1" />
            <span data-testid={`text-listing-location-${listing._id}`}>
              {listing.location.city}, {listing.location.state}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span data-testid={`text-listing-time-${listing._id}`}>
              {formatTimeAgo(listing.createdAt)}
            </span>
            <div className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              <span data-testid={`text-listing-views-${listing._id}`}>
                {listing.views} views
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
