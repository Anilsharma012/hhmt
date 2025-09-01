import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ListingCard } from '@/components/ListingCard';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { User, Settings, List, Heart, MessageCircle, Star } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  });

  const { data: userListings } = useQuery({
    queryKey: ['/api/listings', { userId: user?._id }],
    enabled: !!user
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileData) => {
      const response = await apiRequest('PUT', '/api/auth/profile', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully.'
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['/api/auth/profile'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleProfileUpdate = () => {
    updateProfileMutation.mutate(profileData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
              <p className="text-muted-foreground">
                Please login to view your profile.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const myListings = userListings?.listings?.filter((listing: any) => listing.userId?._id === user._id) || [];
  const activeListings = myListings.filter((listing: any) => listing.status === 'active');
  const draftListings = myListings.filter((listing: any) => listing.status === 'draft');
  const soldListings = myListings.filter((listing: any) => listing.status === 'sold');

  const totalViews = myListings.reduce((sum: number, listing: any) => {
    const v = typeof listing.views === 'number' && !Number.isNaN(listing.views) ? listing.views : 0;
    return sum + v;
  }, 0);

  const memberSince = (() => {
    const created = (user as any).createdAt;
    const d = created ? new Date(created) : null;
    const y = d && !Number.isNaN(d.getTime()) ? d.getFullYear() : null;
    return y ?? '-';
  })();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6 text-center">
                <Avatar className="w-24 h-24 mx-auto mb-4">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="text-xl" data-testid="text-profile-initials">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-bold text-foreground mb-2" data-testid="text-profile-name">
                  {user.name}
                </h2>
                
                <p className="text-muted-foreground mb-4" data-testid="text-profile-email">
                  {user.email}
                </p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge variant={user.isVerified ? 'default' : 'secondary'} data-testid="badge-verification">
                    {user.isVerified ? 'Verified' : 'Unverified'}
                  </Badge>
                  <Badge variant="outline" data-testid="badge-role">
                    {user.role === 'admin' ? 'Admin' : 'User'}
                  </Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Active Ads</span>
                    <span className="font-semibold" data-testid="text-active-ads-count">
                      {activeListings.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Views</span>
                    <span className="font-semibold" data-testid="text-total-views">
                      {totalViews}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-semibold" data-testid="text-member-since">
                      {memberSince}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="listings" className="space-y-6">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="listings" className="flex items-center gap-2" data-testid="tab-listings">
                  <List className="w-4 h-4" />
                  <span className="hidden sm:inline">My Ads</span>
                </TabsTrigger>
                <TabsTrigger value="favorites" className="flex items-center gap-2" data-testid="tab-favorites">
                  <Heart className="w-4 h-4" />
                  <span className="hidden sm:inline">Favorites</span>
                </TabsTrigger>
                <TabsTrigger value="messages" className="flex items-center gap-2" data-testid="tab-messages">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Messages</span>
                </TabsTrigger>
                <TabsTrigger value="reviews" className="flex items-center gap-2" data-testid="tab-reviews">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Reviews</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2" data-testid="tab-settings">
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </TabsTrigger>
              </TabsList>

              {/* My Listings */}
              <TabsContent value="listings" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary" data-testid="text-active-count">
                        {activeListings.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Active Ads</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-500" data-testid="text-draft-count">
                        {draftListings.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Draft Ads</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-500" data-testid="text-sold-count">
                        {soldListings.length}
                      </div>
                      <div className="text-sm text-muted-foreground">Sold Items</div>
                    </CardContent>
                  </Card>
                </div>

                {myListings.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <List className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-listings">
                        No listings yet
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Start selling by posting your first ad
                      </p>
                      <Button data-testid="button-post-first-ad">
                        Post Your First Ad
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {myListings.map((listing: any) => (
                      <ListingCard key={listing._id} listing={listing} />
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Favorites */}
              <TabsContent value="favorites">
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Heart className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-favorites">
                      No favorites yet
                    </h3>
                    <p className="text-muted-foreground">
                      Save items you're interested in to view them here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Messages */}
              <TabsContent value="messages">
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-messages">
                      No messages yet
                    </h3>
                    <p className="text-muted-foreground">
                      Your conversations with buyers and sellers will appear here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Reviews */}
              <TabsContent value="reviews">
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Star className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2" data-testid="text-no-reviews">
                      No reviews yet
                    </h3>
                    <p className="text-muted-foreground">
                      Reviews from your transactions will appear here
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Profile Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={profileData.name}
                          onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                          disabled={!isEditing}
                          data-testid="input-profile-name"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={profileData.email}
                          onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                          disabled={!isEditing}
                          data-testid="input-profile-email"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={profileData.phone}
                          onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                          disabled={!isEditing}
                          data-testid="input-profile-phone"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      {isEditing ? (
                        <>
                          <Button 
                            onClick={handleProfileUpdate}
                            disabled={updateProfileMutation.isPending}
                            data-testid="button-save-profile"
                          >
                            {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => setIsEditing(false)}
                            data-testid="button-cancel-edit"
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button 
                          onClick={() => setIsEditing(true)}
                          data-testid="button-edit-profile"
                        >
                          Edit Profile
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
