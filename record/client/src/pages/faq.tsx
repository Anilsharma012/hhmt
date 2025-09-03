import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useQuery } from '@tanstack/react-query';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { sanitizeHtml } from '@/lib/utils';

export default function FAQ() {
  const { data: ver } = useQuery({ queryKey: ['/api/faqs/version'] });
  const { data } = useQuery({ queryKey: ['/api/faqs', { v: (ver as any)?.version || 0 }] , enabled: !!ver });
  const items = (data as any)?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-4xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">FAQs – Posttrr</h1>
        <Accordion type="single" collapsible className="w-full">
          {items.map((f: any) => (
            <AccordionItem key={f._id} value={String(f._id)}>
              <AccordionTrigger>{f.question}</AccordionTrigger>
              <AccordionContent>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(f.answer || '') }} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
      <Footer />
    </div>
  );
}
