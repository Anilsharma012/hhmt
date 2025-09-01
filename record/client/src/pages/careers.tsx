import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Careers() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Careers</CardTitle>
          </CardHeader>
          <CardContent>
            Join our team! Open positions will be listed here.
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
