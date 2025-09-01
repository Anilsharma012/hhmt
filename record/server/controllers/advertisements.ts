import { Listing } from '../models/Listing';

export const listAdvertisements = async (req: Request, res: Response) => {
  try {
    const { search, page = 1, limit = 10, country, state, city, isPremium, isFeatured } = req.query as any;
    const filter: any = {};
    if (search) {
      filter.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { description: { $regex: String(search), $options: 'i' } },
      ];
    }
    if (city) filter['location.city'] = String(city);
    if (state) filter['location.state'] = String(state);
    // country not stored; ignore
    if (isPremium !== undefined && isPremium !== '' && isPremium !== 'all') filter.isPremium = String(isPremium) === 'true';
    if (isFeatured !== undefined && isFeatured !== '' && isFeatured !== 'all') filter.isFeatured = String(isFeatured) === 'true';

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Listing.find(filter)
        .populate('userId', 'firstName lastName email')
        .populate('categoryId', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Listing.countDocuments(filter),
    ]);

    const pages = Math.ceil(total / limitNum) || 1;
    res.json({ data: items, pagination: { page: pageNum, limit: limitNum, total, pages } });
  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Failed to list advertisements' });
  }
};

export const patchAdvertisement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any;
    const updates: any = {};
    const body = req.body || {};

    if (body.name !== undefined) updates.title = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.price !== undefined) updates.price = body.price;
    if (body.country !== undefined) { /* no-op: not stored */ }
    if (body.state !== undefined) updates['location.state'] = body.state;
    if (body.city !== undefined) updates['location.city'] = body.city;
    if (body.isPremium !== undefined) updates.isPremium = !!body.isPremium;
    if (body.isFeatured !== undefined) updates.isFeatured = !!body.isFeatured;
    if (body.expiryDate !== undefined) updates.expiryDate = body.expiryDate ? new Date(body.expiryDate) : null;
    if (body.status !== undefined) updates.status = body.status;
    if (body.active !== undefined) updates.status = body.active ? 'active' : 'draft';

    const doc = await Listing.findByIdAndUpdate(id, updates, { new: true })
      .populate('userId', 'firstName lastName email')
      .populate('categoryId', 'name');

    res.json({ ok: true, data: doc });
  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Failed to update advertisement' });
  }
};

export const deleteAdvertisement = async (req: Request, res: Response) => {
  try {
    const { id } = req.params as any;
    await Listing.findByIdAndDelete(id);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ message: e.message || 'Failed to delete advertisement' });
  }
};
