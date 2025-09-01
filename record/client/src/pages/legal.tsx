import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Legal() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Legal & Privacy Information</CardTitle>
          </CardHeader>
          <CardContent>
            Legal and privacy details.
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
