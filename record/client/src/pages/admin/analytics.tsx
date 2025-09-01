import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">You need admin privileges to access this page.</p>
            <Button onClick={() => setLocation('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data } = useQuery({ queryKey: ['/api/admin/analytics'] , enabled: user?.role === 'admin' });
  const totals = data?.totals || { views: 0, clicks: 0, saves: 0 };
  const top = data?.top || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded">Views: {totals.views}</div>
                  <div className="p-4 border rounded">Clicks: {totals.clicks}</div>
                  <div className="p-4 border rounded">Saves: {totals.saves}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Listings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {top.map((t: any) => (
                    <div key={t._id} className="p-3 border rounded flex items-center justify-between">
                      <div className="font-medium">{t.listingId?.title || t.listingId}</div>
                      <div className="text-sm text-muted-foreground">Views: {t.views}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
