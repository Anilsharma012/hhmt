import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useRoute } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { io, Socket } from 'socket.io-client';

function devAuthHeaders() {
  try {
    const raw = localStorage.getItem('posttrr_user');
    if (!raw) return {} as Record<string, string>;
    return { 'x-dev-user': raw } as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

export default function ChatThreadPage() {
  const [, params] = useRoute('/chat/:id');
  const threadId = params?.id || '';
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data } = useQuery({ queryKey: [`/api/chats/${threadId}/messages`], enabled: !!threadId });
  useEffect(() => {
    if (data?.data) setItems(data.data.slice().reverse());
    else if (Array.isArray(data)) setItems((data as any).slice());
  }, [data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [items.length]);

  const socket = useMemo<Socket | null>(() => {
    if (!threadId) return null;
    const s = io('/', { path: '/realtime', withCredentials: true, extraHeaders: devAuthHeaders() });
    s.emit('thread:join', threadId);
    s.on('message:new', (payload: any) => {
      const m = payload?.message;
      if (m?.threadId !== threadId) return;
      setItems((prev) => [...prev, m]);
    });
    return s;
  }, [threadId]);

  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/chats/${threadId}/messages`, { text });
      return res.json();
    },
    onSuccess: (msg) => {
      setText('');
      setItems((prev) => [...prev, msg]);
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-3xl mx-auto p-6 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              {items.map((m: any) => (
                <div key={m._id} className={`p-2 rounded ${String(m.senderId) === String((user as any)?._id) ? 'bg-primary/10 text-right' : 'bg-muted'}`}>
                  {m.text}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="flex gap-2">
              <Input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message" />
              <Button disabled={!text} onClick={() => sendMutation.mutate()}>Send</Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
