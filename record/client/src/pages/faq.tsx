import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';

export default function FAQ() {
  const { data } = useQuery({ queryKey: ['/api/pages/faq'] });
  const content = data?.content || 'Common questions and answers will appear here.';
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx_auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            {content}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
