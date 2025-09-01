import { Request, Response } from 'express';
import { Listing } from '../models/Listing';
import { Category } from '../models/Category';
import { insertListingSchema } from '@shared/schema';
import { AuthRequest } from '../middleware/auth';

export const getListings = async (req: Request, res: Response) => {
  try {
    const {
      category,
      subcategory,
      city,
      area,
      minPrice,
      maxPrice,
      search,
      userId,
      status,
      sort = 'createdAt',
      page = 1,
      limit = 20
    } = req.query as Record<string, any>;

    const filter: any = {};

    if (userId) filter.userId = userId;
    if (!userId) filter.status = 'active';
    if (status && status !== 'all') filter.status = status;

    if (category) filter.categoryId = category;
    if (subcategory) filter.subcategoryId = subcategory;
    if (city) filter['location.city'] = new RegExp(String(city), 'i');
    if (area) filter['location.area'] = new RegExp(String(area), 'i');
    if (search) {
      filter.$text = { $search: String(search) };
    }
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortOptions: any = {};
    if (sort === 'price_low') sortOptions.price = 1;
    else if (sort === 'price_high') sortOptions.price = -1;
    else sortOptions.createdAt = -1;

    const skip = (Number(page) - 1) * Number(limit);

    const listings = await Listing.find(filter)
      .populate('userId', 'name avatar location')
      .populate('categoryId', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(Number(limit));

    const total = await Listing.countDocuments(filter);

    res.json({
      listings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getListing = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Increment view count
    await Listing.findByIdAndUpdate(id, { $inc: { views: 1 } });

    const listing = await Listing.findById(id)
      .populate('userId', 'name avatar phone location isVerified')
      .populate('categoryId', 'name')
      .populate('subcategoryId', 'name');

    try { (await import('./analytics')).incrementView(id); } catch {}

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json(listing);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const createListing = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = insertListingSchema.parse(req.body);

    const listing = new Listing({
      ...validatedData,
      userId: req.user._id
    });

    await listing.save();
    await listing.populate('categoryId', 'name');

    res.status(201).json({
      message: 'Listing created successfully',
      listing
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const updateListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = insertListingSchema.partial().parse(req.body);

    const listing = await Listing.findOne({ _id: id, userId: req.user._id });
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    Object.assign(listing, validatedData);
    listing.updatedAt = new Date();
    await listing.save();

    res.json({
      message: 'Listing updated successfully',
      listing
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteListing = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const listing = await Listing.findOne({ _id: id, userId: req.user._id });
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found or unauthorized' });
    }

    await Listing.findByIdAndDelete(id);

    res.json({ message: 'Listing deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getFeaturedListings = async (req: Request, res: Response) => {
  try {
    const listings = await Listing.find({ 
      status: 'active', 
      isFeatured: true 
    })
      .populate('userId', 'name avatar')
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .limit(8);

    res.json(listings);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};
