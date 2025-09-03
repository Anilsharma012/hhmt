import { useRoute, Redirect } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sanitizeHtml } from '@/lib/utils';

function Loader() {
  return (
    <div className="max-w-3xl mx-auto mt-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/2" />
        <div className="h-4 bg-muted rounded" />
        <div className="h-4 bg-muted rounded w-5/6" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    </div>
  );
}

export default function CmsPage() {
  const [, params] = useRoute('/p/:slug');
  const slug = params?.slug;

  const { data: ver } = useQuery({ queryKey: ['/api/pages/version'] });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/pages/' + slug, { v: (ver as any)?.version || 0 }],
    enabled: !!slug && !!ver,
    staleTime: 5 * 60 * 1000,
  });

  if (!slug) return <Redirect to="/" />;
  if (isLoading) return <Loader />;
  if (isError || !data) {
    return (
      <div className="max-w-3xl mx-auto mt-16">
        <Card>
          <CardHeader>
            <CardTitle>Page Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            The page you are looking for does not exist or is not published.
          </CardContent>
        </Card>
      </div>
    );
  }

  const safe = sanitizeHtml(String((data as any).contentHtml || ''));

  return (
    <div className="max-w-3xl mx-auto mt-8 px-4">
      <h1 className="text-3xl font-bold mb-4">{(data as any).title}</h1>
      <div className="prose prose-slate max-w-none" dangerouslySetInnerHTML={{ __html: safe }} />
    </div>
  );
}
