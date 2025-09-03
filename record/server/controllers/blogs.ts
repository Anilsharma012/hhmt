import { Blog } from '../models/Blog';
import { AuthRequest } from '../middleware/auth';

function parsePagination(q: any) {
  const page = Math.max(1, parseInt(String(q.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(q.limit || '10'), 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function normalizeSlug(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function adminListBlogs(req: AuthRequest, res: Response) {
  try {
    const { search = '', tag = '', status = '', sort = '-createdAt' } = req.query as any;
    const { page, limit, skip } = parsePagination(req.query);

    const q: any = {};
    if (search) {
      const s = String(search);
      q.$or = [
        { title: { $regex: s, $options: 'i' } },
        { slug: { $regex: s, $options: 'i' } },
        { descriptionHtml: { $regex: s, $options: 'i' } },
      ];
    }
    if (tag) q.tags = { $in: [String(tag)] };
    if (status) q.status = String(status);

    const total = await Blog.countDocuments(q);
    const items = await Blog.find(q).sort(sort as string).skip(skip).limit(limit).lean();

    res.json({ data: items, total, page, limit });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || 'Failed to list blogs' });
  }
}

export async function adminGetBlog(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params as any;
    const item = await Blog.findById(id);
    if (!item) return res.status(404).json({ ok: false, message: 'Blog not found' });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || 'Failed to get blog' });
  }
}

export async function adminCreateBlog(req: AuthRequest, res: Response) {
  try {
    const { title, slug, imageUrl, tags, descriptionHtml, status } = (req.body || {}) as any;
    if (!title || !descriptionHtml) return res.status(400).json({ ok: false, message: 'Title and description are required' });
    const finalSlug = normalizeSlug(slug || title);
    const exists = await Blog.findOne({ slug: finalSlug });
    if (exists) return res.status(400).json({ ok: false, message: 'Slug already exists' });
    const doc = await Blog.create({
      title: String(title).trim(),
      slug: finalSlug,
      imageUrl: imageUrl || '',
      tags: Array.isArray(tags) ? tags.map(String) : [],
      descriptionHtml: String(descriptionHtml),
      status: status === 'draft' ? 'draft' : 'published',
      authorId: req.user?._id,
      publishedAt: status === 'published' ? new Date() : undefined,
    });

    const { bumpVersion } = await import('../utils/cacheVersion');
    bumpVersion('blogs');

    res.json({ ok: true, data: doc });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Slug already exists' });
    }
    res.status(500).json({ ok: false, message: e?.message || 'Failed to create blog' });
  }
}

export async function adminUpdateBlog(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params as any;
    const patch = (req.body || {}) as any;

    if (patch.slug) {
      patch.slug = normalizeSlug(patch.slug);
      const dup = await Blog.findOne({ _id: { $ne: id }, slug: patch.slug });
      if (dup) return res.status(400).json({ ok: false, message: 'Slug already exists' });
    }

    if (patch.title !== undefined) patch.title = String(patch.title).trim();
    if (patch.descriptionHtml !== undefined) patch.descriptionHtml = String(patch.descriptionHtml);
    if (patch.status && !['draft', 'published'].includes(patch.status)) delete patch.status;

    const updated = await Blog.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, message: 'Blog not found' });

    const { bumpVersion } = await import('../utils/cacheVersion');
    bumpVersion('blogs');

    res.json({ ok: true, data: updated });
  } catch (e: any) {
    if (e?.code === 11000) {
      return res.status(400).json({ ok: false, message: 'Slug already exists' });
    }
    res.status(500).json({ ok: false, message: e?.message || 'Failed to update blog' });
  }
}

export async function adminDeleteBlog(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params as any;
    await Blog.findByIdAndDelete(id);
    const { bumpVersion } = await import('../utils/cacheVersion');
    bumpVersion('blogs');
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || 'Failed to delete blog' });
  }
}

export async function publicListBlogs(req: Request, res: Response) {
  try {
    const { tag = '' } = req.query as any;
    const { page, limit, skip } = parsePagination(req.query);
    const q: any = { status: 'published' };
    if (tag) q.tags = { $in: [String(tag)] };

    const total = await Blog.countDocuments(q);
    const items = await Blog.find(q).sort('-publishedAt').skip(skip).limit(limit).lean();
    res.json({ data: items, total, page, limit });
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || 'Failed to list blogs' });
  }
}

export async function publicGetBlogBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params as any;
    const item = await Blog.findOne({ slug, status: 'published' }).lean();
    if (!item) return res.status(404).json({ ok: false, message: 'Not found' });
    res.json(item);
  } catch (e: any) {
    res.status(500).json({ ok: false, message: e?.message || 'Failed to get blog' });
  }
}

export async function blogsVersion(_req: Request, res: Response) {
  const { getVersion } = await import('../utils/cacheVersion');
  res.json({ version: getVersion('blogs') });
}
