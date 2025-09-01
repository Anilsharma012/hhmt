import { queryClient } from './queryClient';

export async function uploadImage(file: File): Promise<string> {
  // Mock implementation for now - would integrate with Cloudinary
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(file);
  });
}

export async function toggleFavorite(listingId: string): Promise<void> {
  const response = await fetch(`/api/listings/${listingId}/favorite`, {
    method: 'POST',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to toggle favorite');
  }

  // Invalidate relevant queries
  queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
}

export async function reportListing(listingId: string, reason: string): Promise<void> {
  const response = await fetch(`/api/listings/${listingId}/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ reason })
  });

  if (!response.ok) {
    throw new Error('Failed to report listing');
  }
}
