import { Request, Response } from 'express';
import { Listing } from '../models/Listing';
import { User } from '../models/User';
import { Category } from '../models/Category';

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAds = await Listing.countDocuments();
    const activeAds = await Listing.countDocuments({ status: 'active' });
    const pendingAds = await Listing.countDocuments({ status: 'draft' });

    const recentAds = await Listing.find()
      .populate('userId', 'name email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      stats: {
        totalUsers,
        totalAds,
        activeAds,
        pendingAds
      },
      recentAds
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateListingStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const listing = await Listing.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('userId', 'firstName lastName email')
     .populate('categoryId', 'name');

    res.json({ ok: true, data: listing });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const adminListListings = async (req: Request, res: Response) => {
  try {
    const { status, userId, categoryId, q, page = 1, limit = 50 } = req.query as any;
    const filter: any = {};
    if (status && status !== 'all') filter.status = status;
    if (userId) filter.userId = userId;
    if (categoryId && categoryId !== 'all') filter.categoryId = categoryId;
    if (q) filter.title = { $regex: String(q), $options: 'i' };
    
    const skip = (Number(page) - 1) * Number(limit);
    const listings = await Listing.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));
    
    const total = await Listing.countDocuments(filter);
    res.json(listings);
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const adminCreateListing = async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    if (!payload.userId) return res.status(400).json({ ok: false, message: 'userId required' });
    const listing = new Listing(payload);
    await listing.save();
    res.status(201).json({ ok: true, data: listing });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const adminUpdateListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findByIdAndUpdate(id, req.body, { new: true });
    res.json({ ok: true, data: listing });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const adminDeleteListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await Listing.findByIdAndDelete(id);
    res.json({ ok: true, data: { deleted: true } });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const moderateListing = async (req: Request, res: Response) => {
  try {
    const { id, action } = req.body as { id: string; action: 'approve' | 'reject' | 'feature' | 'urgent' | 'bump' };
    const listing = await Listing.findById(id);
    if (!listing) return res.status(404).json({ ok: false, message: 'Listing not found' });
    switch (action) {
      case 'approve':
        listing.status = 'active';
        break;
      case 'reject':
        listing.status = 'rejected';
        break;
      case 'feature':
        listing.isFeatured = true;
        break;
      case 'urgent':
        listing.isUrgent = true;
        break;
      case 'bump':
        listing.updatedAt = new Date();
        break;
    }
    await listing.save();
    res.json({ ok: true, data: listing });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};

export const toggleListingFeatured = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { featured } = req.body;
    
    const listing = await Listing.findByIdAndUpdate(
      id,
      { isFeatured: featured },
      { new: true }
    );
    
    if (!listing) {
      return res.status(404).json({ ok: false, message: 'Listing not found' });
    }
    
    res.json({ ok: true, data: listing });
  } catch (error: any) {
    res.status(400).json({ ok: false, message: error.message });
  }
};
