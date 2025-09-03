import { Request, Response } from 'express';
import { Faq } from '../models/Faq';
import { AuthRequest } from '../middleware/auth';
import { bumpVersion, getVersion } from '../utils/cacheVersion';

export async function adminListFaqs(req: Request, res: Response) {
  try {
    const q = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();
    const category = String(req.query.category || '').trim();
    const page = Math.max(parseInt(String(req.query.page || '1'), 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20'), 10) || 20, 1), 100);
    const sort = String(req.query.sort || 'sortOrder:asc');

    const filter: any = {};
    if (q) filter.$or = [{ question: { $regex: q, $options: 'i' } }, { answer: { $regex: q, $options: 'i' } }];
    if (status === 'active' || status === 'inactive') filter.status = status;
    if (category) filter.category = category;

    const [field, dir] = sort.split(':');
    const sortObj: any = { [field || 'sortOrder']: dir === 'desc' ? -1 : 1 };

    const total = await Faq.countDocuments(filter);
    const items = await Faq.find(filter)
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ ok: true, data: items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to list faqs' });
  }
}

export async function adminCreateFaq(req: AuthRequest, res: Response) {
  try {
    const { question, answer, status, category, showInFooter } = req.body || {};
    if (!question || !answer) return res.status(400).json({ ok: false, message: 'Question and answer are required' });

    const faq = new Faq({ question, answer, status: status || 'active', category, showInFooter: !!showInFooter });
    await faq.save();
    bumpVersion('faqs');
    return res.status(201).json({ ok: true, data: faq });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to create faq' });
  }
}

export async function adminUpdateFaq(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updates: any = {};
    for (const k of ['question', 'answer', 'status', 'category', 'showInFooter', 'sortOrder']) {
      if (body[k] !== undefined) updates[k] = body[k];
    }
    const faq = await Faq.findByIdAndUpdate(id, updates, { new: true });
    if (!faq) return res.status(404).json({ ok: false, message: 'FAQ not found' });
    bumpVersion('faqs');
    return res.json({ ok: true, data: faq });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to update faq' });
  }
}

export async function adminToggleFaq(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const faq = await Faq.findById(id);
    if (!faq) return res.status(404).json({ ok: false, message: 'FAQ not found' });
    faq.status = faq.status === 'active' ? 'inactive' : 'active';
    await faq.save();
    bumpVersion('faqs');
    return res.json({ ok: true, data: faq });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to toggle faq' });
  }
}

export async function adminReorderFaqs(req: AuthRequest, res: Response) {
  try {
    const items: Array<{ id: string; sortOrder: number }> = req.body || [];
    if (!Array.isArray(items)) return res.status(400).json({ ok: false, message: 'Invalid payload' });
    const ops = items.map((it) => Faq.findByIdAndUpdate(it.id, { sortOrder: it.sortOrder }));
    await Promise.all(ops);
    bumpVersion('faqs');
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to reorder' });
  }
}

export async function adminDeleteFaq(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    await Faq.findByIdAndDelete(id);
    bumpVersion('faqs');
    return res.json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to delete faq' });
  }
}

export async function publicListFaqs(req: Request, res: Response) {
  try {
    const category = String(req.query.category || '').trim();
    const filter: any = { status: 'active' };
    if (category) filter.category = category;
    const items = await Faq.find(filter).sort({ sortOrder: 1, question: 1 });
    return res.json({ ok: true, data: items });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to fetch faqs' });
  }
}

export async function publicFooterFaqs(_req: Request, res: Response) {
  try {
    const items = await Faq.find({ status: 'active', showInFooter: true })
      .sort({ sortOrder: 1, question: 1 })
      .limit(5)
      .select('question');
    return res.json({ ok: true, data: items });
  } catch (e: any) {
    return res.status(500).json({ ok: false, message: e?.message || 'Failed to fetch footer faqs' });
  }
}

export async function faqsVersion(_req: Request, res: Response) {
  return res.json({ version: getVersion('faqs') });
}
