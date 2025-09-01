import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { ListingCard } from '@/components/ListingCard';

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data } = useQuery({
    queryKey: ['/api/listings', user?._id ? { userId: user._id } : undefined],
    enabled: !!user?._id,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-5xl mx-auto p-6">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold mb-2">Please log in</h1>
              <p className="text-muted-foreground mb-4">Sign in to access your dashboard.</p>
              <Button onClick={() => setLocation('/login')}>Login</Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const listings = data?.listings || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.name}</CardTitle>
          </CardHeader>
          <CardContent>
            Role: {user.role}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>My Ads</CardTitle>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center text-muted-foreground">No ads yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {listings.map((l: any) => (
                  <ListingCard key={l._id} listing={l} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
