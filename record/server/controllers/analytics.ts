import { Request, Response } from 'express';
import { Analytics } from '../models/Analytics';

export const incrementView = async (listingId: string) => {
  await Analytics.findOneAndUpdate(
    { listingId },
    { $inc: { views: 1 } },
    { upsert: true }
  );
};

export const trackClick = async (req: Request, res: Response) => {
  const { listingId } = req.body || {};
  await Analytics.findOneAndUpdate(
    { listingId },
    { $inc: { clicks: 1 } },
    { upsert: true }
  );
  res.json({ ok: true });
};

export const trackSave = async (req: Request, res: Response) => {
  const { listingId } = req.body || {};
  await Analytics.findOneAndUpdate(
    { listingId },
    { $inc: { saves: 1 } },
    { upsert: true }
  );
  res.json({ ok: true });
};

export const adminAnalytics = async (_req: Request, res: Response) => {
  const totals = await Analytics.aggregate([
    { $group: { _id: null, views: { $sum: '$views' }, clicks: { $sum: '$clicks' }, saves: { $sum: '$saves' } } }
  ]);
  const top = await Analytics.find().sort({ views: -1 }).limit(10).populate('listingId', 'title');
  res.json({ totals: totals[0] || { views: 0, clicks: 0, saves: 0 }, top });
};
