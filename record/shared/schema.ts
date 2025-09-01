import { z } from "zod";

// User schemas
export const userSchema = z.object({
  _id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string(),
  role: z.enum(['user', 'seller', 'admin']).default('user'),
  avatar: z.string().optional(),
  location: z.object({
    city: z.string().optional(),
    state: z.string().optional(),
    area: z.string().optional()
  }).optional(),
  isVerified: z.boolean().default(false),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const insertUserSchema = userSchema.omit({ 
  _id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional()
});

// Category schemas
export const categorySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  icon: z.string(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date())
});

export const insertCategorySchema = categorySchema.pick({ name: true, slug: true, icon: true, description: true, isActive: true }).partial({ description: true, isActive: true });
export const updateCategorySchema = insertCategorySchema.partial();

export const subcategorySchema = z.object({
  _id: z.string(),
  categoryId: z.string(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date())
});

export const insertSubcategorySchema = subcategorySchema.pick({ categoryId: true, name: true, slug: true, isActive: true }).partial({ isActive: true });
export const updateSubcategorySchema = insertSubcategorySchema.partial();

// Location schemas
export const locationSchema = z.object({
  city: z.string(),
  state: z.string(),
  area: z.string().optional(),
  pincode: z.string().optional()
});

export const countrySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  code: z.string().optional()
});
export const insertCountrySchema = countrySchema.pick({ name: true, slug: true, code: true }).partial({ code: true });

export const stateSchema = z.object({
  _id: z.string(),
  countryId: z.string(),
  name: z.string(),
  slug: z.string()
});
export const insertStateSchema = stateSchema.pick({ countryId: true, name: true, slug: true });

export const citySchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  state: z.string()
});
export const insertCitySchema = citySchema.pick({ name: true, slug: true, state: true });

export const areaSchema = z.object({
  _id: z.string(),
  cityId: z.string(),
  name: z.string(),
  slug: z.string(),
  pincode: z.string().optional()
});
export const insertAreaSchema = areaSchema.pick({ cityId: true, name: true, slug: true, pincode: true }).partial({ pincode: true });

// Listing schemas
export const listingSchema = z.object({
  _id: z.string(),
  userId: z.string(),
  title: z.string(),
  slug: z.string(),
  description: z.string(),
  price: z.number(),
  categoryId: z.string(),
  subcategoryId: z.string().optional(),
  location: locationSchema,
  images: z.array(z.string()).default([]),
  status: z.enum(['draft', 'active', 'sold', 'rejected']).default('draft'),
  isFeatured: z.boolean().default(false),
  isUrgent: z.boolean().default(false),
  views: z.number().default(0),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

export const insertListingSchema = listingSchema.omit({
  _id: true,
  userId: true,
  slug: true,
  views: true,
  createdAt: true,
  updatedAt: true
});

// Package schemas
export const packageSchema = z.object({
  _id: z.string(),
  name: z.string(),
  features: z.object({
    featured: z.boolean().default(false),
    urgent: z.boolean().default(false),
    boostDays: z.number().default(0),
    maxListings: z.number().default(1)
  }),
  basePrice: z.number(),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date())
});

export const insertPackageSchema = packageSchema.pick({ name: true, features: true, basePrice: true, isActive: true }).partial({ isActive: true });
export const updatePackageSchema = insertPackageSchema.partial();

export const priceRuleSchema = z.object({
  _id: z.string(),
  scope: z.enum(['category', 'city', 'area']),
  refId: z.string(),
  packageId: z.string(),
  price: z.number()
});
export const insertPriceRuleSchema = priceRuleSchema.pick({ scope: true, refId: true, packageId: true, price: true });

// Page schemas
export const pageSchema = z.object({
  _id: z.string(),
  title: z.string(),
  slug: z.string(),
  content: z.string().default(''),
  isActive: z.boolean().default(true)
});
export const insertPageSchema = pageSchema.pick({ title: true, slug: true, content: true, isActive: true }).partial({ content: true, isActive: true });
export const updatePageSchema = insertPageSchema.partial();

// Banner schemas
export const bannerSchema = z.object({
  _id: z.string(),
  title: z.string(),
  imageUrl: z.string().url(),
  linkUrl: z.string().url().optional(),
  position: z.string().default('homepage'),
  isActive: z.boolean().default(true)
});
export const insertBannerSchema = bannerSchema.pick({ title: true, imageUrl: true, linkUrl: true, position: true, isActive: true }).partial({ linkUrl: true, position: true, isActive: true });
export const updateBannerSchema = insertBannerSchema.partial();

// Admin schemas
export const adminUserUpdateSchema = z.object({
  role: z.enum(['user', 'seller', 'admin']).optional(),
  isVerified: z.boolean().optional(),
  active: z.boolean().optional(),
  autoApproveAds: z.boolean().optional()
});

export const adminModerateSchema = z.object({
  id: z.string(),
  action: z.enum(['approve', 'reject', 'feature', 'urgent', 'bump'])
});

// Chat schemas
export const chatThreadSchema = z.object({
  _id: z.string(),
  listingId: z.string(),
  buyerId: z.string(),
  sellerId: z.string(),
  lastMessageAt: z.date().default(() => new Date()),
  createdAt: z.date().default(() => new Date())
});

export const chatMessageSchema = z.object({
  _id: z.string(),
  threadId: z.string(),
  senderId: z.string(),
  message: z.string(),
  isRead: z.boolean().default(false),
  createdAt: z.date().default(() => new Date())
});

// Type exports
export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type RegisterUser = z.infer<typeof registerSchema>;

export type Category = z.infer<typeof categorySchema>;
export type Subcategory = z.infer<typeof subcategorySchema>;
export type Location = z.infer<typeof locationSchema>;

export type Listing = z.infer<typeof listingSchema>;
export type InsertListing = z.infer<typeof insertListingSchema>;

export type Package = z.infer<typeof packageSchema>;
export type ChatThread = z.infer<typeof chatThreadSchema>;
export type ChatMessage = z.infer<typeof chatMessageSchema>;
