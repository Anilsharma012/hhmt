import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useRoute } from 'wouter';

export default function Location() {
  const [, params] = useRoute('/location/:slug');
  const city = params?.slug?.replace(/-/g, ' ') ?? '';
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-2">Listings in {city}</h1>
        <p className="text-muted-foreground">Location-specific listings will appear here.</p>
      </main>
      <Footer />
    </div>
  );
}
