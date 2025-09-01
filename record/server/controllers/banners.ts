import { Request, Response } from 'express';
import { Banner } from '../models/Banner';
import { insertBannerSchema, updateBannerSchema } from '@shared/schema';

export const listBanners = async (req: Request, res: Response) => {
  const { position } = req.query as any;
  const filter: any = { isActive: true };
  if (position) filter.position = position;
  const banners = await Banner.find(filter).sort({ createdAt: -1 });
  res.json(banners);
};

export const adminListBanners = async (req: Request, res: Response) => {
  const { position, isActive } = req.query as any;
  const filter: any = {};
  if (position) filter.position = position;
  if (isActive !== undefined) filter.isActive = isActive === 'true' ? true : isActive === 'false' ? false : isActive;
  const banners = await Banner.find(filter).sort({ createdAt: -1 });
  res.json({ ok: true, data: banners });
};

export const createBanner = async (req: Request, res: Response) => {
  try {
    const data = insertBannerSchema.parse(req.body);
    const banner = new Banner(data);
    await banner.save();
    res.status(201).json({ ok: true, data: banner });
  } catch (e: any) {
    res.status(400).json({ ok: false, message: e.message });
  }
};

export const updateBanner = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const data = updateBannerSchema.parse(req.body);
    const banner = await Banner.findByIdAndUpdate(id, data, { new: true });
    res.json({ ok: true, data: banner });
  } catch (e: any) {
    res.status(400).json({ ok: false, message: e.message });
  }
};

export const deleteBanner = async (req: Request, res: Response) => {
  const { id } = req.params;
  await Banner.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};
