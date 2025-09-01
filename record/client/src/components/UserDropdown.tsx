import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, User, Bell, MessageCircle, Crown, List, Heart, Receipt, Star, LogOut } from 'lucide-react';

export function UserDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="flex items-center text-white hover:text-white/80 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="button-user-menu"
      >
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mr-2">
          <span className="text-sm font-medium" data-testid="text-user-initials">
            {user ? getInitials(user.name) : 'U'}
          </span>
        </div>
        <ChevronDown className="w-3 h-3" />
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50" data-testid="dropdown-user-menu">
          <Link to="/profile" data-testid="link-profile">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <User className="w-4 h-4 mr-2 inline" />
              My Profile
            </div>
          </Link>
          <Link to="/notifications" data-testid="link-notifications">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <Bell className="w-4 h-4 mr-2 inline" />
              Notifications
            </div>
          </Link>
          <Link to="/chat" data-testid="link-chat">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <MessageCircle className="w-4 h-4 mr-2 inline" />
              Chat
            </div>
          </Link>
          <Link to="/subscription" data-testid="link-subscription">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <Crown className="w-4 h-4 mr-2 inline" />
              Subscription
            </div>
          </Link>
          <Link to="/my-ads" data-testid="link-my-ads">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <List className="w-4 h-4 mr-2 inline" />
              My Ads
            </div>
          </Link>
          <Link to="/favorites" data-testid="link-favorites">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <Heart className="w-4 h-4 mr-2 inline" />
              Favorites
            </div>
          </Link>
          <Link to="/transactions" data-testid="link-transactions">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <Receipt className="w-4 h-4 mr-2 inline" />
              Transactions
            </div>
          </Link>
          <Link to="/reviews" data-testid="link-reviews">
            <div className="block px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors">
              <Star className="w-4 h-4 mr-2 inline" />
              Reviews
            </div>
          </Link>
          <div className="border-t border-border my-1"></div>
          <button 
            className="block w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            onClick={logout}
            data-testid="button-sign-out"
          >
            <LogOut className="w-4 h-4 mr-2 inline" />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
