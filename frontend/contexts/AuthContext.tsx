import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  tokenBalance: number;
  createdAt?: string;
}

interface Admin {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateTokenBalance: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Configure axios defaults
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';
axios.defaults.baseURL = API_BASE_URL;

// Request interceptor to add auth token
axios.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || Cookies.get('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling auth errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      Cookies.remove('token');
      Cookies.remove('adminToken');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = Cookies.get('token');
      const adminToken = Cookies.get('adminToken');

      if (token) {
        // Check user auth
        const response = await axios.get('/auth/me');
        setUser(response.data.user);
      } else if (adminToken) {
        // Check admin auth
        const response = await axios.get('/auth/admin/me');
        setAdmin(response.data.admin);
      }
    } catch (error) {
      // Token is invalid, clear it
      Cookies.remove('token');
      Cookies.remove('adminToken');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/auth/login', { email, password });
      
      const { token, user: userData } = response.data;
      
      // Store token in cookie (secure, httpOnly would be ideal for production)
      Cookies.set('token', token, { expires: 1 }); // 1 day
      
      setUser(userData);
      toast.success('Welcome back!');
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/auth/admin/login', { email, password });
      
      const { token, admin: adminData } = response.data;
      
      // Store admin token in cookie
      Cookies.set('adminToken', token, { expires: 1 }); // 1 day
      
      setAdmin(adminData);
      toast.success('Admin login successful!');
      
      router.push('/admin');
    } catch (error: any) {
      console.error('Admin login error:', error);
      const message = error.response?.data?.message || 'Admin login failed';
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    fullName: string;
  }) => {
    try {
      setIsLoading(true);
      const response = await axios.post('/auth/register', userData);
      
      const { token, user: newUser } = response.data;
      
      // Store token in cookie
      Cookies.set('token', token, { expires: 1 }); // 1 day
      
      setUser(newUser);
      toast.success('Account created successfully!');
      
      router.push('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        errors.forEach((err: any) => toast.error(err.msg));
      } else {
        toast.error(message);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Clear tokens and user/admin data
    Cookies.remove('token');
    Cookies.remove('adminToken');
    setUser(null);
    setAdmin(null);
    
    toast.success('Logged out successfully');
    router.push('/');
  };

  const refreshUser = async () => {
    try {
      if (user) {
        const response = await axios.get('/auth/me');
        setUser(response.data.user);
      } else if (admin) {
        const response = await axios.get('/auth/admin/me');
        setAdmin(response.data.admin);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  const updateTokenBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, tokenBalance: newBalance });
    }
  };

  const value: AuthContextType = {
    user,
    admin,
    isLoading,
    login,
    adminLogin,
    register,
    logout,
    refreshUser,
    updateTokenBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
