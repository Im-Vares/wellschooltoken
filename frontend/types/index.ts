// User types
export interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatar?: string;
  tokenBalance: number;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
}

// Admin types
export interface Admin {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

// Question types
export interface Question {
  id: number;
  title: string;
  description: string;
  type: 'multiple_choice' | 'text' | 'true_false' | 'matching' | 'phrase' | 'image';
  options?: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  imageUrl?: string;
  correctAnswer: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  isActive: boolean;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  hasSubmitted?: boolean;
  submissionCorrect?: boolean;
  submissionStatus?: string;
  tokensAwarded?: number;
  submittedAt?: string;
  userAnswer?: string;
  feedback?: string;
  submissionCount?: number;
  correctSubmissions?: number;
  orderIndex?: number;
}

// Assignment types
export interface Assignment {
  id: number;
  title: string;
  description: string;
  totalPoints: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  isActive: boolean;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
  questionCount?: number;
  submittedCount?: number;
  correctCount?: number;
  questions?: Question[];
}

// Submission types
export interface Submission {
  id: number;
  userId: number;
  questionId: number;
  assignmentId?: number;
  userAnswer: string;
  isCorrect: boolean;
  tokensAwarded: number;
  submittedAt: string;
  reviewedBy?: number;
  reviewedAt?: string;
  status: 'pending' | 'reviewed';
  feedback?: string;
  // Extended fields
  username?: string;
  userFullName?: string;
  email?: string;
  title?: string;
  description?: string;
  correctAnswer?: string;
  points?: number;
  type?: string;
  options?: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  imageUrl?: string;
  category?: string;
  difficulty?: string;
  reviewedByName?: string;
}

// Achievement types
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: 'correct_answers' | 'total_tokens';
  condition_value: number;
  tokensReward: number;
  isActive: boolean;
  createdAt: string;
  unlocked?: boolean;
  unlockedAt?: string;
}

// Token transaction types
export interface TokenTransaction {
  id: number;
  userId: number;
  type: 'earned' | 'award' | 'achievement';
  amount: number;
  reason: string;
  submissionId?: number;
  adminId?: number;
  createdAt: string;
  // Extended fields
  username?: string;
  fullName?: string;
  questionId?: number;
  questionTitle?: string;
  adminName?: string;
}

// Stats types
export interface UserStats {
  totalSubmissions: number;
  correctAnswers: number;
  totalTokens: number;
  achievements: number;
  accuracy: number;
  recentActivity: any[];
}

export interface AdminStats {
  totalUsers: number;
  totalSubmissions: number;
  pendingReviews: number;
  totalQuestions: number;
  totalTokensAwarded: number;
  recentActivity: any[];
}

export interface TokenStats {
  totalTokensAwarded: number;
  totalTokensFromQuestions: number;
  totalTokensFromAwards: number;
  totalTokensFromAchievements: number;
  totalActiveUsers: number;
  averageTokenBalance: number;
  topUsers: TopUser[];
}

export interface TopUser {
  username: string;
  fullName: string;
  tokenBalance: number;
  transactionCount: number;
  totalEarned: number;
}

// Pagination type
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API Response types
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{ msg: string; param: string; value: any; location: string }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

// Form types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  fullName: string;
}

export interface QuestionForm {
  title: string;
  description: string;
  type: string;
  options: string[];
  correctAnswer: string;
  points: number;
  difficulty: string;
  category: string;
}

export interface ReviewForm {
  isCorrect: boolean;
  tokensAwarded: number;
  feedback: string;
}

// Auth context types
export interface AuthContextType {
  user: User | null;
  admin: Admin | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateTokenBalance: (newBalance: number) => void;
}

// Error types
export interface ApiError {
  message: string;
  status?: number;
  code?: string;
}
