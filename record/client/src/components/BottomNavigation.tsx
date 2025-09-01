import { Link, useLocation } from 'wouter';
import { Home, MessageCircle, Plus, FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BottomNavigation() {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
      <div className="flex items-center justify-around py-3 px-2 relative">
        {/* Home */}
        <Link to="/" className={`flex flex-col items-center py-1 px-3 ${location === '/' ? 'text-[#4285f4]' : 'text-gray-600'}`}>
          <Home className="w-5 h-5" />
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>

        {/* Chat */}
        <Link to="/chat" className={`flex flex-col items-center py-1 px-3 ${location.startsWith('/chat') ? 'text-[#4285f4]' : 'text-gray-600'}`}>
          <MessageCircle className="w-5 h-5" />
          <span className="text-xs mt-1 font-medium">Chat</span>
        </Link>

        {/* FAB Button - Exact Match */}
        <div className="relative">
          <Link to="/post-ad">
            <div className="w-16 h-16 bg-[#4285f4] hover:bg-[#3367d6] rounded-full shadow-2xl flex items-center justify-center -mt-8 border-4 border-white">
              <Plus className="w-8 h-8 text-white" />
            </div>
          </Link>
        </div>

        {/* My Ads */}
        <Link to="/my-ads" className={`flex flex-col items-center py-1 px-3 ${location.startsWith('/my-ads') ? 'text-[#4285f4]' : 'text-gray-600'}`}>
          <FileText className="w-5 h-5" />
          <span className="text-xs mt-1 font-medium">My Ads</span>
        </Link>

        {/* Profile */}
        <Link to="/profile" className={`flex flex-col items-center py-1 px-3 ${location.startsWith('/profile') ? 'text-[#4285f4]' : 'text-gray-600'}`}>
          <User className="w-5 h-5" />
          <span className="text-xs mt-1 font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
}