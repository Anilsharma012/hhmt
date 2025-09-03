import { Request, Response } from 'express';
import { Page } from '../models/Page';
import { AuthRequest } from '../middleware/auth';

export const listPages = async (req: Request, res: Response) => {
  try {
    const footer = String(req.query.footer || '').toLowerCase() === 'true';
    if (footer) {
      const pages = await Page.find({ status: 'published', showInFooter: true })
        .sort({ footerOrder: 1, title: 1 })
        .select('title slug');
      return res.json(pages);
    }
    const pages = await Page.find({ status: 'published' }).sort({ title: 1 });
    return res.json(pages);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to list pages' });
  }
};

export const adminListPages = async (_req: Request, res: Response) => {
  try {
    const pages = await Page.find().sort({ updatedAt: -1 });
    return res.json({ ok: true, data: pages });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to list pages' });
  }
};

export const adminGetPage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = await Page.findById(id);
    if (!page) return res.status(404).json({ ok: false, message: 'Page not found' });
    return res.json({ ok: true, data: page });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to fetch page' });
  }
};

export const getPageBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = await Page.findOne({ slug, status: 'published' });
    if (!page) return res.status(404).json({ message: 'Page not found' });
    return res.json(page);
  } catch (e: any) {
    return res.status(500).json({ message: e?.message || 'Failed to fetch page' });
  }
};

export const createPage = async (req: AuthRequest, res: Response) => {
  try {
    const {
      title,
      slug: providedSlug,
      contentHtml,
      status,
      showInFooter,
      footerOrder,
      seoTitle,
      seoDescription,
      ogImage,
    } = (req.body || {}) as Record<string, any>;

    const slug = (providedSlug || title || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!title) return res.status(400).json({ ok: false, message: 'Title is required' });
    if (!slug) return res.status(400).json({ ok: false, message: 'Slug is required' });

    if (status === 'published' && !contentHtml) {
      return res.status(400).json({ ok: false, message: 'Content is required to publish' });
    }

    const exists = await Page.findOne({ slug });
    if (exists) return res.status(400).json({ ok: false, message: 'Slug already exists' });

    const page = new Page({
      title,
      slug,
      contentHtml: contentHtml || '',
      status: status || 'draft',
      showInFooter: showInFooter !== undefined ? !!showInFooter : true,
      footerOrder: footerOrder ?? 1,
      seoTitle,
      seoDescription,
      ogImage,
    });

    if (page.status === 'published') page.publishedAt = new Date();

    await page.save();
    return res.status(201).json({ ok: true, data: page });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to create page' });
  }
};

export const updatePage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const body = (req.body || {}) as Record<string, any>;

    const updates: Record<string, any> = {};
    for (const k of [
      'title',
      'contentHtml',
      'showInFooter',
      'footerOrder',
      'seoTitle',
      'seoDescription',
      'ogImage',
    ]) {
      if (body[k] !== undefined) updates[k] = body[k];
    }

    if (body.slug !== undefined) {
      const slug = String(body.slug)
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      if (!slug) return res.status(400).json({ ok: false, message: 'Invalid slug' });
      const conflict = await Page.findOne({ slug, _id: { $ne: id } });
      if (conflict) return res.status(400).json({ ok: false, message: 'Slug already exists' });
      updates.slug = slug;
    }

    if (body.status !== undefined) {
      if (!['draft', 'published'].includes(body.status)) {
        return res.status(400).json({ ok: false, message: 'Invalid status' });
      }
      if (body.status === 'published') {
        const candidate = { ...(await Page.findById(id))?.toObject(), ...updates } as any;
        if (!candidate.title || !candidate.contentHtml) {
          return res.status(400).json({ ok: false, message: 'Title and content are required to publish' });
        }
        updates.status = 'published';
        updates.publishedAt = new Date();
      } else {
        updates.status = 'draft';
        updates.publishedAt = null;
      }
    }

    const page = await Page.findByIdAndUpdate(id, updates, { new: true });
    if (!page) return res.status(404).json({ ok: false, message: 'Page not found' });
    return res.json({ ok: true, data: page });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to update page' });
  }
};

export const deletePage = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await Page.findByIdAndDelete(id);
    return res.json({ ok: true, data: { deleted: true } });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to delete page' });
  }
};
