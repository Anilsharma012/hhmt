import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';

export default function Notifications() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ['/api/me/inapp-notifications', { page: 1, limit: 20 }], enabled: !!user });
  const items = (data as any)?.data || [];
  const mark = useMutation({
    mutationFn: async (id: string) => { const res = await apiRequest('PATCH', `/api/me/inapp-notifications/${id}/read`); return res.json(); },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/me/inapp-notifications'] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {!user && 'Please login to view notifications.'}
            {user && items.length === 0 && 'You have no notifications.'}
            {user && items.length > 0 && (
              <ul className="space-y-3">
                {items.map((n: any) => (
                  <li key={n._id} className={`border rounded p-3 ${n.isRead ? 'opacity-70' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{n.title}</div>
                        <div className="text-sm text-muted-foreground">{n.message}</div>
                        {n.imageUrl && <img src={n.imageUrl} className="w-40 h-24 object-cover rounded mt-2" />}
                        {n.deepLink && <a href={n.deepLink} className="text-xs text-blue-600">Open</a>}
                      </div>
                      {!n.isRead && <button className="text-xs text-blue-600" onClick={() => mark.mutate(n._id)}>Mark as read</button>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
