import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export default function Chat() {
  const { user } = useAuth();
  const { data } = useQuery({ queryKey: ['/api/chats/threads', { role: '' }], enabled: !!user });
  const threads = (data?.data || []) as any[];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent>
            {!user && 'Please login to access chat.'}
            {user && (
              <div className="divide-y">
                {threads.length === 0 && <div className="text-muted-foreground">No conversations yet.</div>}
                {threads.map((t) => {
                  const listing = t.listingId as any;
                  const unread = String(t.buyerId) === String((user as any)?._id) ? t.buyerUnread : t.sellerUnread;
                  return (
                    <a href={`/chat/${t._id}`} key={t._id} className="flex items-center justify-between py-3 hover:bg-muted/40 px-2 rounded">
                      <div className="flex-1">
                        <div className="font-medium">{listing?.title || 'Listing'}</div>
                        <div className="text-sm text-muted-foreground truncate">{t.lastMessage}</div>
                      </div>
                      {unread > 0 && (
                        <div className="ml-3 inline-flex items-center justify-center rounded-full bg-primary text-white text-xs w-6 h-6">{unread}</div>
                      )}
                    </a>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
