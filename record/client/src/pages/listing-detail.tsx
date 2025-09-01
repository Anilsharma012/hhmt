import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Flag, Eye, MapPin, Calendar, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data: listing, isLoading } = useQuery({
    queryKey: [`/api/listings/${id}`],
    enabled: !!id
  });

  const listingData = listing as any;

  const handleContact = async () => {
    try {
      const res = await (await import('@/lib/queryClient')).apiRequest('POST', '/api/chats/open', { listingId: id });
      const thread = await res.json();
      window.location.href = `/chat/${thread._id}`;
    } catch (e: any) {
      toast({ title: 'Could not open chat', description: e.message, variant: 'destructive' });
    }
  };

  const handleReport = () => {
    toast({
      title: 'Report submitted',
      description: 'Thank you for helping keep our marketplace safe'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="w-full h-96 bg-muted animate-pulse rounded-lg"></div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded"></div>
              <div className="h-4 bg-muted animate-pulse rounded w-2/3"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-listing-not-found">
            Listing not found
          </h1>
          <p className="text-muted-foreground mt-2">
            The listing you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date: Date | string | number | null | undefined) => {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(d);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="relative">
                  <img 
                    src={listingData?.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&h=500&fit=crop'} 
                    alt={listingData?.title || 'Listing image'}
                    className="w-full h-96 object-cover rounded-lg"
                    data-testid="img-listing-main"
                  />
                  {listingData?.isFeatured && (
                    <Badge className="absolute top-4 left-4 bg-primary" data-testid="badge-featured">
                      Featured
                    </Badge>
                  )}
                  {listingData?.isUrgent && (
                    <Badge className="absolute top-4 left-20 bg-red-500" data-testid="badge-urgent">
                      Urgent
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Listing Details */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2" data-testid="text-listing-title">
                      {listingData?.title}
                    </h1>
                    <p className="text-3xl font-bold text-primary mb-4" data-testid="text-listing-price">
                      {listingData?.price && formatPrice(listingData.price)}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" data-testid="button-add-favorite">
                      <Heart className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleReport} data-testid="button-report">
                      <Flag className="w-4 h-4 mr-2" />
                      Report
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span data-testid="text-listing-location">
                      {listingData?.location?.city}, {listingData?.location?.state}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span data-testid="text-listing-date">
                      {listingData?.createdAt && formatDate(listingData.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Tag className="w-4 h-4 mr-2" />
                    <span data-testid="text-listing-category">
                      {listingData?.categoryId?.name}
                    </span>
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Eye className="w-4 h-4 mr-2" />
                    <span data-testid="text-listing-views">
                      {listingData?.views} views
                    </span>
                  </div>
                </div>

                <Separator className="my-6" />

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-3">Description</h3>
                  <p className="text-muted-foreground leading-relaxed" data-testid="text-listing-description">
                    {listingData?.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Seller Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Seller Information</h3>
                
                <div className="flex items-center space-x-3 mb-4">
                  <Avatar>
                    <AvatarImage src={listingData?.userId?.avatar} />
                    <AvatarFallback data-testid="text-seller-initials">
                      {listingData?.userId?.name?.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-foreground" data-testid="text-seller-name">
                      {listingData?.userId?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">Member since 2023</p>
                  </div>
                </div>

                <Button className="w-full mb-3" onClick={handleContact} data-testid="button-contact-seller">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Contact Seller
                </Button>

                <Button variant="outline" className="w-full" data-testid="button-view-seller-profile">
                  View Profile
                </Button>
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Safety Tips</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Meet in a public place</li>
                  <li>• Check the item carefully before buying</li>
                  <li>• Don't pay in advance</li>
                  <li>• Report suspicious activity</li>
                </ul>
              </CardContent>
            </Card>

            {/* Ad Performance */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Ad Performance</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Views</span>
                    <span className="font-semibold" data-testid="text-total-views">{listingData?.views ?? 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Posted</span>
                    <span className="font-semibold" data-testid="text-posted-date">
                      {formatDate(listingData?.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={(listingData?.status === 'active' ? 'default' : 'secondary') as any} data-testid="badge-listing-status">
                      {listingData?.status ? String(listingData.status).charAt(0).toUpperCase() + String(listingData.status).slice(1) : 'Unknown'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
