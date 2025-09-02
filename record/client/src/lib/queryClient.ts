import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

function isNetworkError(error: any): boolean {
  return (
    error instanceof TypeError &&
    (error.message.includes('Failed to fetch') ||
     error.message.includes('Network request failed') ||
     error.message.includes('fetch'))
  );
}

function devAuthHeaders() {
  try {
    const raw = localStorage.getItem('posttrr_user');
    if (!raw) return {} as Record<string, string>;
    return { 'x-dev-user': raw } as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {
    ...devAuthHeaders(),
  };
  if (data) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    credentials: 'include',
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const [base, params] = queryKey as unknown as [string, Record<string, any> | undefined];
    let url = String(base);
    if (params && typeof params === 'object') {
      const sp = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v === undefined || v === null || v === '') continue;
        sp.append(k, String(v));
      }
      const qs = sp.toString();
      if (qs) url += (url.includes('?') ? '&' : '?') + qs;
    }

    try {
      const res = await fetch(url, {
        headers: devAuthHeaders(),
        credentials: 'include',
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Log the error for debugging but only in development
      if (import.meta.env.DEV) {
        console.warn(`Query failed for ${url}:`, error);
      }

      // Re-throw the error so React Query can handle retries
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes instead of Infinity
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (except 401)
        if (error instanceof Error && error.message.includes('4')) {
          const status = parseInt(error.message.split(':')[0]);
          if (status >= 400 && status < 500 && status !== 401) {
            return false;
          }
        }
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
    },
    mutations: {
      retry: false,
    },
  },
});
