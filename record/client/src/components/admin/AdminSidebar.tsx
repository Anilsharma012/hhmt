import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Settings, 
  Tag, 
  MapPin, 
  Flag, 
  Bell, 
  BarChart,
  LogOut,
  Home,
  Package,
  CreditCard,
  User,
  Edit3,
  PlusCircle,
  ChevronDown,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const sidebarItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard
  },
  {
    title: 'Ad Listing',
    href: '/admin/ads',
    icon: FileText
  },
  {
    title: 'Categories',
    href: '/admin/categories',
    icon: Tag
  },
  {
    title: 'Custom Fields',
    href: '/admin/custom-fields',
    icon: Edit3
  },
  {
    title: 'Home Screen Management',
    href: '/admin/home/feature-section',
    icon: Home,
    submenu: [
      { title: 'Feature Section', href: '/admin/home/feature-section' }
    ]
  },
  {
    title: 'Advertisement Management',
    href: '/admin/advertisements',
    icon: FileText,
    submenu: [
      { title: 'Advertisement', href: '/admin/advertisements' },
      { title: 'Advertisement Listing', href: '/admin/advertisements' },
      { title: 'Requested Advertisement', href: '/admin/ads/requested' }
    ]
  },
  {
    title: 'Promotional Management',
    href: '/admin/send-notification',
    icon: Bell,
    submenu: [
      { title: 'Send Notification', href: '/admin/send-notification' }
    ]
  },
  {
    title: 'Ads',
    href: '/admin/ads',
    icon: Tag
  },
  {
    title: 'Package Management',
    href: '/admin/packages',
    icon: Package,
    submenu: [
      { title: 'Advertisement Listing Package', href: '/admin/packages/listing' },
      { title: 'Feature Advertisement Package', href: '/admin/packages/featured' },
      { title: 'MO Advertisement Package', href: '/admin/packages' }
    ]
  },
  {
    title: 'NIC',
    href: '/admin/users',
    icon: Users
  },
  {
    title: 'User Packages',
    href: '/admin/packages',
    icon: Users
  },
  {
    title: 'Payment Transaction',
    href: '/admin/payment-gateway',
    icon: CreditCard
  },
  {
    title: 'Bank Transfer',
    href: '/admin/payment-gateway',
    icon: CreditCard
  },
  {
    title: 'Seller Management',
    href: '/admin/users',
    icon: Users,
    submenu: [
      { title: 'Verification Fields', href: '/admin/users' },
      { title: 'Seller Verification', href: '/admin/users' },
      { title: 'Seller Review', href: '/admin/users' }
    ]
  },
  {
    title: 'Payment Gateway',
    href: '/admin/payment-gateway',
    icon: CreditCard
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    submenu: [
      { title: 'Pages', href: '/admin/pages' },
      { title: 'FAQs', href: '/admin/faqs' }
    ]
  },
  {
    title: 'Blog Management',
    href: '/admin/blogs',
    icon: FileText,
    submenu: [
      { title: 'Blogs', href: '/admin/blogs' }
    ]
  }
];

export function AdminSidebar() {
  const [location] = useLocation();
  const { logout, user } = useAuth();

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      {/* User Profile */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Hi, Admin</h3>
            <p className="text-xs text-gray-500">{user?.email || 'admin@posttrr.com'}</p>
          </div>
        </div>
        <Link to="/" className="mt-3 flex items-center text-xs text-blue-600 hover:text-blue-700">
          <Home className="w-3 h-3 mr-1" />
          posttrr.com
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sidebarItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || location.startsWith(item.href);
          
          return (
            <div key={`${item.href}-${item.title}`}>
              <Link to={item.href} data-testid={`link-admin-${item.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className={cn(
                  "flex items-center space-x-2 px-3 py-2 text-sm rounded-md transition-colors cursor-pointer",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}>
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-xs">{item.title}</span>
                  {item.submenu && <ChevronDown className="w-3 h-3 ml-auto" />}
                </div>
              </Link>
              {item.submenu && isActive && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.submenu.map((subitem) => (
                    <Link key={`${subitem.href}-${subitem.title}`} to={subitem.href}>
                      <div className="flex items-center space-x-2 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded">
                        {subitem.title}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 text-xs"
          onClick={logout}
          data-testid="button-admin-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
