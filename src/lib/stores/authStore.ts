import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'admin' | 'staff' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  hasPermission: (module: string) => boolean;
}

// Role-based access control configuration
const rolePermissions: Record<UserRole, string[]> = {
  admin: ['dashboard', 'inventory', 'billing', 'transactions', 'analytics', 'settings', 'suppliers'],
  staff: ['dashboard', 'transactions', 'analytics', 'settings'],
  guest: []
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      
      login: (user) => set({ 
        user,
        isAuthenticated: true
      }),
      
      logout: () => set({ 
        user: null,
        isAuthenticated: false 
      }),
      
      hasPermission: (module) => {
        const { user } = get();
        if (!user) return false;
        
        const permissions = rolePermissions[user.role] || [];
        return permissions.includes(module);
      }
    }),
    {
      name: 'invenhub-auth-storage',
    }
  )
); 