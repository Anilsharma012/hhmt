import { Request, Response } from 'express';
import { Page } from '../models/Page';
import { AuthRequest } from '../middleware/auth';

export const listPages = async (_req: Request, res: Response) => {
  const pages = await Page.find({ isActive: true }).sort({ title: 1 });
  res.json(pages);
};

export const adminListPages = async (_req: Request, res: Response) => {
  const pages = await Page.find().sort({ title: 1 });
  res.json({ ok: true, data: pages });
};

export const getPageBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const page = await Page.findOne({ slug, isActive: true });
  if (!page) return res.status(404).json({ message: 'Page not found' });
  res.json(page);
};

export const createPage = async (req: AuthRequest, res: Response) => {
  const { title, slug, content, isActive } = req.body || {};
  const existing = await Page.findOne({ slug });
  if (existing) return res.status(400).json({ ok: false, message: 'Slug already exists' });
  const page = new Page({ title, slug, content, isActive });
  await page.save();
  res.status(201).json({ ok: true, data: page });
};

export const updatePage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const updates: any = {};
  for (const k of ['title', 'slug', 'content', 'isActive']) {
    if (req.body?.[k] !== undefined) updates[k] = req.body[k];
  }
  const page = await Page.findByIdAndUpdate(id, updates, { new: true });
  if (!page) return res.status(404).json({ ok: false, message: 'Page not found' });
  res.json({ ok: true, data: page });
};

export const deletePage = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  await Page.findByIdAndDelete(id);
  res.json({ ok: true, data: { deleted: true } });
};
