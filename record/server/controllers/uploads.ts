import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

function ensureUploadsDir(): string {
  const dir = path.resolve(import.meta.dirname, '..', 'client', 'public', 'uploads');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function uploadImage(req: Request, res: Response) {
  try {
    const { filename, data } = (req.body || {}) as { filename?: string; data?: string };
    if (!data) return res.status(400).json({ ok: false, message: 'Missing data' });

    const dir = ensureUploadsDir();
    const base = safeName(filename || `img_${Date.now()}.png`);
    const filePath = path.join(dir, base);

    const b64 = String(data).split(',').pop() as string;
    const buf = Buffer.from(b64, 'base64');
    await fs.promises.writeFile(filePath, buf);
    const url = `/uploads/${base}`;
    return res.json({ ok: true, url });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Upload failed' });
  }
}
