import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from 'cookie-parser';
import { connectToDatabase, isDatabaseConnected } from './utils/database';
import { seedDatabase } from './utils/seedData';
import { initRealtime } from './realtime';

// Controllers
import { register, login, logout, getProfile, updateProfile } from './controllers/auth';
import { 
  getListings, 
  getListing, 
  createListing, 
  updateListing, 
  deleteListing,
  getFeaturedListings
} from './controllers/listings';
import { getCategories, getSubcategories, createCategory, updateCategory, deleteCategory, createSubcategory, updateSubcategory, deleteSubcategory, adminGetCategories, adminListSubcategories } from './controllers/categories';
import { getCities, getAreas, createCity, updateCity, deleteCity, createArea, updateArea, deleteArea, adminGetCities, adminGetAreas, adminGetCountries, createCountry, updateCountry, deleteCountry, adminGetStates, createState, updateState, deleteState } from './controllers/locations';
import { listPackages, listPricingRules, createPackage, updatePackage, deletePackage, createPriceRule, updatePriceRule, deletePriceRule, adminListPackages, adminListPricingRules } from './controllers/packages';
import { createReport, listReports, updateReport, deleteReport, adminListReportReasons, createReportReason, updateReportReason, deleteReportReason } from './controllers/reports';
import { trackClick, trackSave, adminAnalytics } from './controllers/analytics';
import { getDashboardStats, updateListingStatus, adminListListings, adminCreateListing, adminUpdateListing, adminDeleteListing, moderateListing, toggleListingFeatured } from './controllers/admin';
import { listAdvertisements, patchAdvertisement, deleteAdvertisement } from './controllers/advertisements';
import { listPages, getPageBySlug, createPage, updatePage, deletePage, adminListPages, adminGetPage } from './controllers/pages';
import { checkout, webhook } from './controllers/orders';
import { listBanners, adminListBanners, createBanner, updateBanner, deleteBanner } from './controllers/banners';
import { adminListUsers, adminUpdateUser, adminCreateUser, adminDeleteUser, adminResetPassword, adminListUserAds } from './controllers/users';
import { openThread, listMessages, sendMessage, listThreads, markRead, unreadCount } from './controllers/chats';

// Middleware
import { authenticate, requireAdmin } from './middleware/auth';

export async function registerRoutes(app: Express): Promise<Server> {
  // Connect to database
  await connectToDatabase();
  if (isDatabaseConnected()) {
    await seedDatabase();
  }

  // Middleware
  app.use(cookieParser());

  // Auth routes
  app.post('/api/auth/register', register);
  app.post('/api/auth/login', login);
  app.post('/api/auth/logout', logout);
  app.get('/api/auth/profile', authenticate, getProfile);
  app.put('/api/auth/profile', authenticate, updateProfile);

  // Public routes
  app.get('/api/categories', getCategories);
  app.get('/api/categories/:categoryId/subcategories', getSubcategories);
  app.get('/api/locations/cities', getCities);
  app.get('/api/locations/areas', getAreas);
  app.get('/api/packages', listPackages);
  app.get('/api/pricing/rules', listPricingRules);
  app.get('/api/listings', getListings);
  app.get('/api/listings/featured', getFeaturedListings);
  app.get('/api/listings/:id', getListing);
  app.get('/api/banners', listBanners);
  app.post('/api/reports', authenticate, createReport);
  app.post('/api/analytics/click', trackClick);
  app.post('/api/analytics/save', trackSave);

  // Protected routes
  app.post('/api/listings', authenticate, createListing);
  app.put('/api/listings/:id', authenticate, updateListing);
  app.delete('/api/listings/:id', authenticate, deleteListing);

  // Public pages
  app.get('/api/pages', listPages);
  app.get('/api/pages/:slug', getPageBySlug);

  // Admin routes
  app.get('/api/admin/dashboard', authenticate, requireAdmin, getDashboardStats);
  app.get('/api/admin/analytics', authenticate, requireAdmin, adminAnalytics);

  // Admin: reports & reasons
  app.get('/api/admin/reports', authenticate, requireAdmin, listReports);
  app.put('/api/admin/reports/:id', authenticate, requireAdmin, updateReport);
  app.delete('/api/admin/reports/:id', authenticate, requireAdmin, deleteReport);
  app.get('/api/admin/reports/reasons', authenticate, requireAdmin, adminListReportReasons);
  app.post('/api/admin/reports/reasons', authenticate, requireAdmin, createReportReason);
  app.put('/api/admin/reports/reasons/:id', authenticate, requireAdmin, updateReportReason);
  app.delete('/api/admin/reports/reasons/:id', authenticate, requireAdmin, deleteReportReason);

  // Admin: listings
  app.get('/api/admin/listings', authenticate, requireAdmin, adminListListings);
  app.post('/api/admin/listings', authenticate, requireAdmin, adminCreateListing);
  app.put('/api/admin/listings/:id', authenticate, requireAdmin, adminUpdateListing);
  app.delete('/api/admin/listings/:id', authenticate, requireAdmin, adminDeleteListing);
  app.patch('/api/admin/listings/:id/status', authenticate, requireAdmin, updateListingStatus);
  app.patch('/api/admin/listings/:id/featured', authenticate, requireAdmin, toggleListingFeatured);
  app.post('/api/admin/listings/moderate', authenticate, requireAdmin, moderateListing);

  // Admin: advertisements (aliases)
  app.get('/api/admin/advertisements', authenticate, requireAdmin, listAdvertisements);
  app.patch('/api/admin/advertisements/:id', authenticate, requireAdmin, patchAdvertisement);
  app.delete('/api/admin/advertisements/:id', authenticate, requireAdmin, deleteAdvertisement);

  // Admin: categories
  app.get('/api/admin/categories', authenticate, requireAdmin, adminGetCategories);
  app.post('/api/admin/categories', authenticate, requireAdmin, createCategory);
  app.put('/api/admin/categories/:id', authenticate, requireAdmin, updateCategory);
  app.delete('/api/admin/categories/:id', authenticate, requireAdmin, deleteCategory);
  app.get('/api/admin/subcategories', authenticate, requireAdmin, adminListSubcategories);
  app.post('/api/admin/subcategories', authenticate, requireAdmin, createSubcategory);
  app.put('/api/admin/subcategories/:id', authenticate, requireAdmin, updateSubcategory);
  app.delete('/api/admin/subcategories/:id', authenticate, requireAdmin, deleteSubcategory);

  // Admin: pages
  app.get('/api/admin/pages', authenticate, requireAdmin, adminListPages);
  app.post('/api/admin/pages', authenticate, requireAdmin, createPage);
  app.put('/api/admin/pages/:id', authenticate, requireAdmin, updatePage);
  app.delete('/api/admin/pages/:id', authenticate, requireAdmin, deletePage);

  // Admin: locations
  app.get('/api/admin/locations/cities', authenticate, requireAdmin, adminGetCities);
  app.post('/api/admin/locations/cities', authenticate, requireAdmin, createCity);
  app.put('/api/admin/locations/cities/:id', authenticate, requireAdmin, updateCity);
  app.delete('/api/admin/locations/cities/:id', authenticate, requireAdmin, deleteCity);

  app.get('/api/admin/locations/areas', authenticate, requireAdmin, adminGetAreas);
  app.post('/api/admin/locations/areas', authenticate, requireAdmin, createArea);
  app.put('/api/admin/locations/areas/:id', authenticate, requireAdmin, updateArea);
  app.delete('/api/admin/locations/areas/:id', authenticate, requireAdmin, deleteArea);

  app.get('/api/admin/locations/countries', authenticate, requireAdmin, adminGetCountries);
  app.post('/api/admin/locations/countries', authenticate, requireAdmin, createCountry);
  app.put('/api/admin/locations/countries/:id', authenticate, requireAdmin, updateCountry);
  app.delete('/api/admin/locations/countries/:id', authenticate, requireAdmin, deleteCountry);

  app.get('/api/admin/locations/states', authenticate, requireAdmin, adminGetStates);
  app.post('/api/admin/locations/states', authenticate, requireAdmin, createState);
  app.put('/api/admin/locations/states/:id', authenticate, requireAdmin, updateState);
  app.delete('/api/admin/locations/states/:id', authenticate, requireAdmin, deleteState);

  // Admin: packages & pricing
  app.get('/api/admin/packages', authenticate, requireAdmin, adminListPackages);
  app.post('/api/admin/packages', authenticate, requireAdmin, createPackage);
  app.put('/api/admin/packages/:id', authenticate, requireAdmin, updatePackage);
  app.delete('/api/admin/packages/:id', authenticate, requireAdmin, deletePackage);
  app.get('/api/admin/pricing/rules', authenticate, requireAdmin, adminListPricingRules);
  app.post('/api/admin/pricing/rules', authenticate, requireAdmin, createPriceRule);
  app.put('/api/admin/pricing/rules/:id', authenticate, requireAdmin, updatePriceRule);
  app.delete('/api/admin/pricing/rules/:id', authenticate, requireAdmin, deletePriceRule);

  // Admin: banners
  app.get('/api/admin/banners', authenticate, requireAdmin, adminListBanners);
  app.post('/api/admin/banners', authenticate, requireAdmin, createBanner);
  app.put('/api/admin/banners/:id', authenticate, requireAdmin, updateBanner);
  app.delete('/api/admin/banners/:id', authenticate, requireAdmin, deleteBanner);

  // Admin: users
  app.get('/api/admin/users', authenticate, requireAdmin, adminListUsers);
  app.post('/api/admin/users', authenticate, requireAdmin, adminCreateUser);
  app.put('/api/admin/users/:id', authenticate, requireAdmin, adminUpdateUser);
  app.delete('/api/admin/users/:id', authenticate, requireAdmin, adminDeleteUser);
  app.post('/api/admin/users/:id/reset-password', authenticate, requireAdmin, adminResetPassword);
  app.get('/api/admin/users/:id/ads', authenticate, requireAdmin, adminListUserAds);

  // Orders
  app.post('/api/orders/checkout', authenticate, checkout);
  app.post('/api/orders/webhook', webhook);

  // Chats
  app.post('/api/chats/open', authenticate, openThread);
  app.get('/api/chats/threads', authenticate, listThreads);
  app.get('/api/chats/:id/messages', authenticate, listMessages);
  app.post('/api/chats/:id/messages', authenticate, sendMessage);
  app.post('/api/chats/:id/read', authenticate, markRead);
  app.get('/api/chats/unread-count', authenticate, unreadCount);

  const httpServer = createServer(app);
  initRealtime(httpServer);
  return httpServer;
}
