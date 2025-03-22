import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { UserModel } from '../lib/models/User';
import { connectToDatabase, disconnectFromDatabase } from '../lib/db';
import { User, UserRole } from '../lib/stores/authStore';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Mock users for browser environment
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    avatar: 'https://github.com/shadcn.png'
  },
  {
    id: '2',
    name: 'Staff User',
    email: 'staff@example.com',
    role: 'staff',
    avatar: 'https://github.com/shadcn.png'
  }
];

// API Base URL (use relative URL in production, use full URL in development)
const API_BASE_URL = '/api';

// Fallback to mock data when API fails
let useFallbackMode = false;

// Register a new user
export async function registerUser(
  name: string,
  email: string,
  password: string,
  role: UserRole = 'staff'
): Promise<User | null> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for user registration');
    
    // Check if email already exists in mock users
    if (mockUsers.some(u => u.email === email)) {
      throw new Error('User with this email already exists');
    }
    
    // Create new mock user
    const newUser: User = {
      id: uuidv4(),
      name,
      email,
      role,
      avatar: 'https://github.com/shadcn.png'
    };
    
    // Add to mock users
    mockUsers.push(newUser);
    
    return newUser;
  }
  
  try {
    console.log('Attempting to register user via API');
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    console.log('Register API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Registration failed';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return registerUser(name, email, password, role);
      }
      
      throw new Error(errorMessage);
    }

    const userData = await response.json();
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role as UserRole,
      avatar: userData.avatar
    };
  } catch (error) {
    console.error('Error registering user:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return registerUser(name, email, password, role);
    }
    throw error;
  }
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<User | null> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for user login');
    
    // Find user in mock users
    const user = mockUsers.find(u => u.email === email);
    
    // Simple mock authentication (password is 'password' for mocks)
    if (user && password === 'password') {
      return user;
    }
    
    return null;
  }
  
  try {
    console.log('Attempting to login user via API');
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    console.log('Login API response status:', response.status);
    
    if (!response.ok) {
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return loginUser(email, password);
      }
      return null;
    }

    const userData = await response.json();
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role as UserRole,
      avatar: userData.avatar
    };
  } catch (error) {
    console.error('Error logging in user:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return loginUser(email, password);
    }
    throw error;
  }
}

// Get all users
export async function getAllUsers(): Promise<User[]> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for getting users');
    return mockUsers;
  }
  
  try {
    console.log('Attempting to fetch users via API');
    const response = await fetch(`${API_BASE_URL}/users`);

    console.log('GetAllUsers API response status:', response.status);
    
    if (!response.ok) {
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return getAllUsers();
      }
      throw new Error('Failed to fetch users');
    }

    const usersData = await response.json();
    return usersData.map((user: any) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as UserRole,
      avatar: user.avatar
    }));
  } catch (error) {
    console.error('Error getting all users:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return getAllUsers();
    }
    throw error;
  }
}

// Update user role
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<User | null> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for updating user role');
    
    // Find the user in mock users
    const userIndex = mockUsers.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return null;
    }
    
    // Update role
    mockUsers[userIndex].role = newRole;
    
    return mockUsers[userIndex];
  }
  
  try {
    console.log('Attempting to update user role via API');
    const response = await fetch(`${API_BASE_URL}/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: newRole }),
    });

    console.log('UpdateUserRole API response status:', response.status);
    
    if (!response.ok) {
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return updateUserRole(userId, newRole);
      }
      return null;
    }

    const userData = await response.json();
    return {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role as UserRole,
      avatar: userData.avatar
    };
  } catch (error) {
    console.error('Error updating user role:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return updateUserRole(userId, newRole);
    }
    throw error;
  }
} 