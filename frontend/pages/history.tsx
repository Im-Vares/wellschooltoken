import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  History,
  Clock,
  CheckCircle,
  XCircle,
  Coins,
  ArrowLeft,
  LogOut,
  Filter,
  Calendar,
  Eye,
  MessageSquare,
  BookOpen,
  Award,
  TrendingUp
} from 'lucide-react';

interface Submission {
  id: number;
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  tokensAwarded: number;
  submittedAt: string;
  reviewedAt?: string;
  status: string;
  feedback?: string;
  title: string;
  category: string;
  difficulty: string;
  points: number;
  reviewedByName?: string;
}

interface TokenTransaction {
  id: number;
  type: string;
  amount: number;
  reason: string;
  createdAt: string;
  questionId?: number;
  questionTitle?: string;
  adminName?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function HistoryPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'submissions' | 'tokens'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tokenTransactions, setTokenTransactions] = useState<TokenTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [expandedSubmission, setExpandedSubmission] = useState<number | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    
    if (activeTab === 'submissions') {
      fetchSubmissions();
    } else {
      fetchTokenTransactions();
    }
  }, [user, router, activeTab, pagination.page, statusFilter, typeFilter]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      const response = await axios.get(`/users/submissions?${params}`);
      setSubmissions(response.data.submissions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submission history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTokenTransactions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (typeFilter !== 'all') params.append('type', typeFilter);

      const response = await axios.get(`/tokens/transactions?${params}`);
      setTokenTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching token transactions:', error);
      toast.error('Failed to load token history');
    } finally {
      setIsLoading(false);
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

  const getStatusIcon = (submission: Submission) => {
    if (submission.status === 'pending') {
      return <Clock className="w-5 h-5 text-yellow-400" />;
    } else if (submission.status === 'reviewed') {
      return submission.isCorrect ? 
        <CheckCircle className="w-5 h-5 text-green-400" /> : 
        <XCircle className="w-5 h-5 text-red-400" />;
    }
    return null;
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'award': return <Award className="w-5 h-5 text-blue-400" />;
      case 'achievement': return <TrendingUp className="w-5 h-5 text-purple-400" />;
      default: return <Coins className="w-5 h-5 text-yellow-400" />;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (statusFilter === 'all') return true;
    return submission.status === statusFilter;
  });

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
                  <History className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  History
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
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-cyber font-bold text-white mb-2">
            Your History
          </h1>
          <p className="text-gray-400 text-lg">Track your learning journey and token earnings</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex space-x-1 bg-dark-800/50 rounded-lg p-1 mb-8 w-fit"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab('submissions');
              setPagination({ ...pagination, page: 1 });
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'submissions'
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Submissions</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveTab('tokens');
              setPagination({ ...pagination, page: 1 });
            }}
            className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'tokens'
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Token Transactions</span>
          </motion.button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-4 mb-8"
        >
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-purple-400" />
            
            {activeTab === 'submissions' ? (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input-cyber min-w-32"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed</option>
              </select>
            ) : (
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="input-cyber min-w-32"
              >
                <option value="all">All Types</option>
                <option value="earned">Earned</option>
                <option value="award">Manual Award</option>
                <option value="achievement">Achievement</option>
              </select>
            )}
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : activeTab === 'submissions' ? (
            /* Submissions List */
            <div className="space-y-4">
              {filteredSubmissions.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Submissions Found</h3>
                  <p className="text-gray-400">Start answering questions to build your history!</p>
                </div>
              ) : (
                filteredSubmissions.map((submission) => (
                  <motion.div
                    key={submission.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="glass rounded-xl p-6 border border-gray-600 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          {getStatusIcon(submission)}
                          <h3 className="text-white font-bold text-lg">{submission.title}</h3>
                        </div>

                        <div className="flex items-center space-x-4 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(submission.difficulty)}`}>
                            {submission.difficulty}
                          </span>
                          <span className="text-purple-400 text-sm font-medium">{submission.category}</span>
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Coins className="w-3 h-3" />
                            <span className="text-sm">{submission.points} pts</span>
                          </div>
                        </div>

                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          <strong>Your Answer:</strong> {submission.userAnswer}
                        </p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                            </div>
                            {submission.reviewedAt && (
                              <span>Reviewed: {new Date(submission.reviewedAt).toLocaleDateString()}</span>
                            )}
                          </div>

                          <div className="flex items-center space-x-4">
                            {submission.status === 'reviewed' && (
                              <div className={`flex items-center space-x-1 font-medium ${
                                submission.isCorrect ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {submission.isCorrect ? (
                                  <>
                                    <CheckCircle className="w-4 h-4" />
                                    <span>+{submission.tokensAwarded} tokens</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-4 h-4" />
                                    <span>Incorrect</span>
                                  </>
                                )}
                              </div>
                            )}

                            {submission.feedback && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setExpandedSubmission(
                                  expandedSubmission === submission.id ? null : submission.id
                                )}
                                className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                              >
                                <MessageSquare className="w-4 h-4" />
                                <span>Feedback</span>
                              </motion.button>
                            )}

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => router.push(`/questions/${submission.questionId}`)}
                              className="flex items-center space-x-1 text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>View</span>
                            </motion.button>
                          </div>
                        </div>

                        {/* Expanded Feedback */}
                        {expandedSubmission === submission.id && submission.feedback && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-dark-700/50 rounded-lg border-l-4 border-purple-500"
                          >
                            <div className="flex items-center space-x-2 mb-2">
                              <MessageSquare className="w-4 h-4 text-purple-400" />
                              <span className="text-purple-400 font-semibold">Admin Feedback:</span>
                              {submission.reviewedByName && (
                                <span className="text-gray-400 text-sm">by {submission.reviewedByName}</span>
                              )}
                            </div>
                            <p className="text-gray-300">{submission.feedback}</p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            /* Token Transactions List */
            <div className="space-y-4">
              {tokenTransactions.length === 0 ? (
                <div className="glass rounded-xl p-12 text-center">
                  <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Token Transactions</h3>
                  <p className="text-gray-400">Start earning tokens by answering questions!</p>
                </div>
              ) : (
                tokenTransactions.map((transaction) => (
                  <motion.div
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="glass rounded-xl p-6 border border-gray-600 hover:border-purple-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {getTransactionIcon(transaction.type)}
                        <div>
                          <h3 className="text-white font-semibold">{transaction.reason}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-400">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                            {transaction.adminName && (
                              <span>• by {transaction.adminName}</span>
                            )}
                          </div>
                          {transaction.questionTitle && (
                            <p className="text-purple-400 text-sm mt-1">
                              Question: {transaction.questionTitle}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`text-xl font-bold ${
                          transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </div>
                        <div className="text-gray-400 text-sm capitalize">{transaction.type}</div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
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
