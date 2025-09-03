import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Listings from "@/pages/listings";
import ListingDetail from "@/pages/listing-detail";
import PostAd from "@/pages/post-ad";
import Profile from "@/pages/profile";
import Dashboard from "@/pages/dashboard";
import CmsPage from "@/pages/cms-page";
import Blog from "@/pages/blog";
import FAQ from "@/pages/faq";
import Careers from "@/pages/careers";
import Help from "@/pages/help";
import Sitemap from "@/pages/sitemap";
import Legal from "@/pages/legal";
import Vulnerability from "@/pages/vulnerability";
import MobileApp from "@/pages/mobile-app";
import Location from "@/pages/location";
import AdminDashboard from "@/pages/admin/dashboard";
import AdsManagement from "@/pages/admin/ads-management";
import UsersManagement from "@/pages/admin/users-management";
import AdminLogin from "@/pages/admin/login";
import AdminCategories from "@/pages/admin/categories";
import AdminLocations from "@/pages/admin/locations";
import AdminReports from "@/pages/admin/reports";
import AdminNotifications from "@/pages/admin/notifications";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminSettings from "@/pages/admin/settings";
import AdminPages from "@/pages/admin/pages";
import AdminFaqs from "@/pages/admin/faqs";
import AdminPackages from "@/pages/admin/packages";
import AdminBlogs from "@/pages/admin/blogs";
import Blogs from "@/pages/blogs";
import BlogDetail from "@/pages/blog-detail";
import AdminPricing from "@/pages/admin/pricing";
import AdminPaymentGateway from "@/pages/admin/payment-gateway";
import AdminAdvertisements from "@/pages/admin/advertisements";
import AdminListingPackages from "@/pages/admin/packages-listing";
import AdminFeaturedPackages from "@/pages/admin/packages-featured";
import AdminUserPackages from "@/pages/admin/packages-users";
import AdminSendNotification from "@/pages/admin/send-notification";
import AdminTransactions from "@/pages/admin/packages-transactions";
import AdminBankTransfer from "@/pages/admin/packages-bank-transfer";
import AdminCustomers from "@/pages/admin/customers";
import AdminCustomFields from "@/pages/admin/custom-fields";
import RequestedAdvertisement from "@/pages/admin/requested-advertisement";
import FeatureSection from "@/pages/admin/feature-section";
import Notifications from "@/pages/notifications";
import Chat from "@/pages/chat";
import Subscription from "@/pages/subscription";
import MyAds from "@/pages/my-ads";
import Favorites from "@/pages/favorites";
import Transactions from "@/pages/transactions";
import Reviews from "@/pages/reviews";
import ChatThreadPage from "@/pages/chat-thread";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/listings" component={Listings} />
      <Route path="/listing/:id" component={ListingDetail} />
      <Route path="/post-ad" component={PostAd} />
      <Route path="/profile" component={Profile} />
      <Route path="/dashboard" component={Dashboard} />
      {/* CMS pages */}
      <Route path="/p/:slug" component={CmsPage} />
      {/* Public pages mapped to CMS slugs */}
      <Route path="/about" component={() => <Redirect to="/p/about" />} />
      <Route path="/privacy-policy" component={() => <Redirect to="/p/privacy-policy" />} />
      <Route path="/terms" component={() => <Redirect to="/p/terms" />} />
      <Route path="/contact-us" component={() => <Redirect to="/p/contact-us" />} />
      {/* Other static pages (legacy) */}
      <Route path="/blogs" component={Blogs} />
      <Route path="/blog/:slug" component={BlogDetail} />
      <Route path="/faq" component={FAQ} />
      <Route path="/careers" component={Careers} />
      <Route path="/help" component={Help} />
      <Route path="/sitemap" component={Sitemap} />
      <Route path="/legal" component={Legal} />
      <Route path="/vulnerability" component={Vulnerability} />
      <Route path="/mobile-app" component={MobileApp} />
      <Route path="/location/:slug" component={Location} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/ads" component={AdsManagement} />
      <Route path="/admin/ads/requested" component={RequestedAdvertisement} />
      <Route path="/admin/advertisements" component={AdminAdvertisements} />
      <Route path="/admin/home/feature-section" component={FeatureSection} />
      <Route path="/admin/users" component={UsersManagement} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/locations" component={AdminLocations} />
      <Route path="/admin/reports" component={AdminReports} />
      <Route path="/admin/notifications" component={AdminNotifications} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/pages" component={AdminPages} />
      <Route path="/admin/faqs" component={AdminFaqs} />
      <Route path="/admin/blogs" component={AdminBlogs} />
      <Route path="/admin/packages" component={AdminPackages} />
      <Route path="/admin/packages/listing" component={AdminListingPackages} />
      <Route path="/admin/packages/featured" component={AdminFeaturedPackages} />
      <Route path="/admin/packages/users" component={AdminUserPackages} />
      <Route path="/admin/packages/transactions" component={AdminTransactions} />
      <Route path="/admin/packages/bank-transfer" component={AdminBankTransfer} />
      <Route path="/admin/pricing" component={AdminPricing} />
      <Route path="/admin/payment-gateway" component={AdminPaymentGateway} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/custom-fields" component={AdminCustomFields} />
      <Route path="/admin/send-notification" component={AdminSendNotification} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:id" component={ChatThreadPage} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/my-ads" component={MyAds} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/transactions" component={Transactions} />
      <Route path="/reviews" component={Reviews} />
      {/* Category routes */}
      <Route path="/category/:slug" component={Listings} />
      <Route path="/category/:categorySlug/:subcategorySlug" component={Listings} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
