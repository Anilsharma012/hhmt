import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MyAds() {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>My Ads</CardTitle>
          </CardHeader>
          <CardContent>
            {user ? 'Your posted ads will show here.' : 'Please login to view your ads.'}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
