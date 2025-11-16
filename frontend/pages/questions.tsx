import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Coins,
  BookOpen,
  LogOut,
  Filter,
  Search,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  Zap,
  ArrowLeft,
  Target
} from 'lucide-react';

interface Question {
  id: number;
  title: string;
  description: string;
  type: string;
  options?: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  imageUrl?: string;
  points: number;
  difficulty: string;
  category: string;
  hasSubmitted: boolean;
  submissionCorrect?: boolean;
  submissionStatus?: string;
  tokensAwarded?: number;
  submittedAt?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function Questions() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [difficulties] = useState(['easy', 'medium', 'hard']);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchQuestions();
    fetchCategories();
  }, [user, router, pagination.page, selectedCategory, selectedDifficulty]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);

      const response = await axios.get(`/questions?${params}`);
      setQuestions(response.data.questions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/questions/meta/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'hard': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const getStatusIcon = (question: Question) => {
    if (!question.hasSubmitted) return null;
    
    if (question.submissionStatus === 'pending') {
      return <Clock className="w-5 h-5 text-yellow-400" title="Pending review" />;
    } else if (question.submissionStatus === 'reviewed') {
      return question.submissionCorrect ? 
        <CheckCircle className="w-5 h-5 text-green-400" title="Correct answer" /> : 
        <XCircle className="w-5 h-5 text-red-400" title="Incorrect answer" />;
    }
    return null;
  };

  const getStatusText = (question: Question) => {
    if (!question.hasSubmitted) return 'Not attempted';
    
    if (question.submissionStatus === 'pending') return 'Under review';
    if (question.submissionCorrect) return `Correct (+${question.tokensAwarded} tokens)`;
    return 'Incorrect answer';
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) return null;

  return (
    <div className="min-h-screen bg-dark-900 cyber-grid">
      {/* Navigation */}
      <nav className="border-b border-purple-500/20 bg-dark-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  Questions
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Token Balance */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg px-4 py-2"
              >
                <Coins className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-white">{user.tokenBalance}</span>
                <span className="text-purple-400">tokens</span>
              </motion.div>

              {/* User Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white font-semibold">{user.fullName}</p>
                  <p className="text-purple-400 text-sm">@{user.username}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={logout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-purple-500/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-cyber font-bold text-white mb-2">
            Available Questions
          </h1>
          <p className="text-gray-400 text-lg">Answer questions to earn WellSchoolTokens</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-cyber pl-10 w-full"
                />
              </div>
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-cyber min-w-40"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            {/* Difficulty Filter */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="input-cyber min-w-32"
            >
              <option value="all">All Levels</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={fetchQuestions}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              <Filter className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Questions Found</h3>
              <p className="text-gray-400">Try adjusting your filters or search terms.</p>
            </div>
          ) : (
            filteredQuestions.map((question, index) => (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.01 }}
                className={`glass rounded-xl p-6 border transition-all cursor-pointer ${
                  question.hasSubmitted 
                    ? 'border-purple-500/30 bg-purple-500/5' 
                    : 'border-gray-600 hover:border-purple-500/40'
                }`}
                onClick={() => router.push(`/questions/${question.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-xl font-bold text-white">{question.title}</h3>
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
                            {question.type === 'multiple_choice' ? 'Выбор' :
                             question.type === 'true_false' ? 'Правда/Ложь' :
                             question.type === 'matching' ? 'Соединение' :
                             question.type === 'image' ? 'С картинкой' :
                             question.type === 'phrase' ? 'Фраза' : 'Текст'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(question)}
                      </div>
                    </div>

                    <p className="text-gray-300 mb-4 line-clamp-2">{question.description}</p>

                    {/* Preview image for image questions */}
                    {question.imageUrl && (
                      <div className="mb-4">
                        <img 
                          src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${question.imageUrl}`}
                          alt="Question preview"
                          className="max-w-xs h-auto rounded-lg border border-purple-500/20"
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(question.difficulty)}`}>
                          {question.difficulty}
                        </span>
                        <span className="text-purple-400 text-sm font-medium">
                          {question.category}
                        </span>
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Coins className="w-4 h-4" />
                          <span className="text-sm font-medium">{question.points} points</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className={`text-sm font-medium ${
                          question.hasSubmitted 
                            ? question.submissionCorrect 
                              ? 'text-green-400' 
                              : question.submissionStatus === 'pending' 
                                ? 'text-yellow-400' 
                                : 'text-red-400'
                            : 'text-gray-400'
                        }`}>
                          {getStatusText(question)}
                        </span>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-8 space-x-2"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </motion.button>
            
            <span className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg font-semibold">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-dark-700 text-white rounded-lg font-semibold hover:bg-dark-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
