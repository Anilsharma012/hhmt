import { User } from '@shared/schema';

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export const getStoredAuth = (): AuthState => {
  try {
    const stored = localStorage.getItem('auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user,
        isAuthenticated: !!parsed.user,
        loading: false
      };
    }
  } catch (error) {
    console.error('Error parsing stored auth:', error);
  }
  
  return {
    user: null,
    isAuthenticated: false,
    loading: false
  };
};

export const setStoredAuth = (user: User | null) => {
  try {
    if (user) {
      localStorage.setItem('auth', JSON.stringify({ user }));
    } else {
      localStorage.removeItem('auth');
    }
  } catch (error) {
    console.error('Error storing auth:', error);
  }
};

export const clearStoredAuth = () => {
  try {
    localStorage.removeItem('auth');
  } catch (error) {
    console.error('Error clearing stored auth:', error);
  }
};

export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};

export const requireAuth = (user: User | null): boolean => {
  return !!user;
};

export const requireAdmin = (user: User | null): boolean => {
  return user?.role === 'admin';
};
