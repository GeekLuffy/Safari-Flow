import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, User, UserRole } from '../stores/authStore';
import { useToast } from '@/components/ui/use-toast';
import { registerUser, loginUser, getAllUsers, updateUserRole } from '../../api/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (module: string) => boolean;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  userList: User[];
  updateUserRole: (userId: string, newRole: UserRole) => Promise<boolean>;
  loadUsers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

// Map of routes to their required module permissions
const routePermissions: Record<string, string> = {
  '/': 'dashboard',
  '/inventory': 'inventory',
  '/billing': 'billing',
  '/transactions': 'transactions',
  '/analytics': 'analytics',
  '/settings': 'settings',
  '/suppliers': 'suppliers',
};

// Public routes that don't require authentication
const publicRoutes = ['/auth', '/login', '/signup'];

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { isAuthenticated, user, login: storeLogin, logout, hasPermission } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [userList, setUserList] = useState<User[]>([]);
  
  // Load users from the database
  const loadUsers = async () => {
    try {
      const users = await getAllUsers();
      setUserList(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error loading users",
        description: "Could not load user list from database",
        variant: "destructive"
      });
    }
  };
  
  // Load users on initial mount
  useEffect(() => {
    loadUsers();
  }, []);
  
  // Handle login with database
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const user = await loginUser(email, password);
      
      if (user) {
        storeLogin(user);
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.name}!`,
        });
        return true;
      }
      
      toast({
        title: "Login failed",
        description: "Invalid email or password",
        variant: "destructive"
      });
      return false;
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Handle signup with database
  const signup = async (name: string, email: string, password: string, role: UserRole): Promise<boolean> => {
    try {
      const newUser = await registerUser(name, email, password, role);
      
      if (newUser) {
        // Add user to the list
        setUserList(prev => [...prev, newUser]);
        
        // Auto login the new user
        storeLogin(newUser);
        
        toast({
          title: "Signup successful",
          description: `Welcome, ${name}!`,
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Update user role with database
  const updateRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const updatedUser = await updateUserRole(userId, newRole);
      
      if (!updatedUser) {
        toast({
          title: "Update failed",
          description: "User not found",
          variant: "destructive"
        });
        return false;
      }
      
      // Update the user list with the new role
      setUserList(prev => 
        prev.map(u => 
          u.id === userId 
            ? updatedUser 
            : u
        )
      );
      
      // If the updated user is the current user, update the store
      if (user && user.id === userId) {
        storeLogin(updatedUser);
      }
      
      toast({
        title: "User role updated",
        description: `User role updated to ${newRole}`,
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Update failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };
  
  // Check permissions for the current route
  useEffect(() => {
    // Skip checking on initial authentication load
    if (!isAuthenticated && publicRoutes.includes(location.pathname)) {
      return;
    }
    
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate('/auth', { replace: true });
      return;
    }
    
    // Only check permissions if user is authenticated
    if (isAuthenticated) {
      const requiredPermission = routePermissions[location.pathname];
      
      // If this route needs permission and user doesn't have it
      if (requiredPermission && !hasPermission(requiredPermission) && location.pathname !== '/unauthorized') {
        navigate('/unauthorized', { replace: true });
      }
    }
  }, [isAuthenticated, location.pathname, hasPermission, navigate]);
  
  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    hasPermission,
    signup,
    userList,
    updateUserRole: updateRole,
    loadUsers
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}; 