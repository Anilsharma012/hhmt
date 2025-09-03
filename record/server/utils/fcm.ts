const FCM_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';

export type PushMessage = {
  title: string;
  body: string;
  imageUrl?: string;
  deepLink?: string;
  adId?: string;
};

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function sendPushToTokens(tokens: string[], msg: PushMessage): Promise<{ success: number; failed: number; failedTokens: string[]; }>{
  const serverKey = process.env.FCM_SERVER_KEY || '';
  // Dev fallback: if no server key, simulate success
  if (!serverKey) {
    const failedTokens = tokens.filter(t => /invalid|not-registered/i.test(t));
    return { success: tokens.length - failedTokens.length, failed: failedTokens.length, failedTokens };
  }

  let success = 0; let failed = 0; const failedTokens: string[] = [];
  const batches = chunk(tokens, 500);
  for (const batch of batches) {
    const res = await fetch(FCM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `key=${serverKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        registration_ids: batch,
        notification: { title: msg.title, body: msg.body, image: msg.imageUrl },
        data: { deepLink: msg.deepLink || '', adId: msg.adId || '' },
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || typeof json !== 'object') {
      failed += batch.length; failedTokens.push(...batch);
    } else {
      const results: any[] = Array.isArray(json.results) ? json.results : [];
      results.forEach((r, idx) => {
        if (r && !r.error) success++; else { failed++; failedTokens.push(batch[idx]); }
      });
    }
    // basic rate limit: 500/min -> ~1 batch per 1s
    await new Promise(r => setTimeout(r, 1000));
  }
  return { success, failed, failedTokens };
}
