import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function MobileApp() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Mobile App</CardTitle>
          </CardHeader>
          <CardContent>
            Install our PWA from the footer button.
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
