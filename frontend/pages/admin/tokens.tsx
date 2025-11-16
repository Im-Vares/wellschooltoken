import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Coins,
  TrendingUp,
  Users,
  Award,
  Shield,
  LogOut,
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  User,
  BookOpen,
  Plus,
  Eye,
  BarChart,
  Zap
} from 'lucide-react';

interface TokenTransaction {
  id: number;
  username: string;
  fullName: string;
  type: string;
  amount: number;
  reason: string;
  createdAt: string;
  questionId?: number;
  questionTitle?: string;
  adminName?: string;
  submissionId?: number;
}

interface TokenStats {
  totalTokensAwarded: number;
  totalTokensFromQuestions: number;
  totalTokensFromAwards: number;
  totalTokensFromAchievements: number;
  totalActiveUsers: number;
  averageTokenBalance: number;
  topUsers: TopUser[];
}

interface TopUser {
  username: string;
  fullName: string;
  tokenBalance: number;
  transactionCount: number;
  totalEarned: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UserOption {
  id: number;
  username: string;
  fullName: string;
  tokenBalance: number;
}

export default function AdminTokens() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [stats, setStats] = useState<TokenStats | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0
  });

  const [awardForm, setAwardForm] = useState({
    userId: 0,
    amount: 0,
    reason: ''
  });

  const transactionTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'earned', label: 'Question Rewards' },
    { value: 'award', label: 'Manual Awards' },
    { value: 'achievement', label: 'Achievement Rewards' }
  ];

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    fetchTokenData();
    fetchUsers();
  }, [admin, router, pagination.page, typeFilter, userFilter]);

  const fetchTokenData = async () => {
    try {
      setIsLoading(true);
      const [transactionsRes, statsRes] = await Promise.all([
        fetchTransactions(),
        fetchStats()
      ]);
    } catch (error) {
      console.error('Error fetching token data:', error);
      toast.error('Failed to load token data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (typeFilter !== 'all') params.append('type', typeFilter);
      if (userFilter) params.append('userId', userFilter);

      const response = await axios.get(`/tokens/admin/transactions?${params}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/tokens/admin/stats');
      setStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin/users?limit=1000');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAwardTokens = async () => {
    if (!awardForm.userId || awardForm.amount <= 0 || !awardForm.reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsAwarding(true);
    try {
      await axios.post('/tokens/admin/award', awardForm);
      toast.success('Tokens awarded successfully');
      setShowAwardModal(false);
      setAwardForm({ userId: 0, amount: 0, reason: '' });
      fetchTokenData();
      fetchUsers(); // Update user balances
    } catch (error: any) {
      console.error('Error awarding tokens:', error);
      toast.error(error.response?.data?.message || 'Failed to award tokens');
    } finally {
      setIsAwarding(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'earned': return <BookOpen className="w-5 h-5 text-green-400" />;
      case 'award': return <Award className="w-5 h-5 text-blue-400" />;
      case 'achievement': return <TrendingUp className="w-5 h-5 text-purple-400" />;
      default: return <Coins className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'earned': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'award': return 'text-blue-400 bg-blue-400/20 border-blue-400/30';
      case 'achievement': return 'text-purple-400 bg-purple-400/20 border-purple-400/30';
      default: return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
    }
  };

  if (!admin) return null;

  return (
    <div className="min-h-screen bg-dark-900 cyber-grid">
      {/* Navigation */}
      <nav className="border-b border-red-500/20 bg-dark-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin')}
                className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Admin</span>
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  Token Management
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-white font-semibold">{admin.fullName}</p>
                <p className="text-red-400 text-sm">{admin.role}</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={logout}
                className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-cyber font-bold text-white mb-2">
              Token Management
            </h1>
            <p className="text-gray-400 text-lg">Monitor and manage platform tokens</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAwardModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg btn-cyber"
          >
            <Plus className="w-5 h-5" />
            <span>Award Tokens</span>
          </motion.button>
        </motion.div>

        {/* Statistics Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalTokensAwarded.toLocaleString()}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Total Tokens Awarded</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalTokensFromQuestions.toLocaleString()}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">From Questions</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalTokensFromAwards.toLocaleString()}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Manual Awards</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.averageTokenBalance}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Average Balance</h3>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transactions */}
          <div className="lg:col-span-2">
            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6 mb-6"
            >
              <div className="flex flex-wrap gap-4 items-center">
                <Filter className="w-5 h-5 text-red-400" />
                
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="input-cyber min-w-40"
                >
                  {transactionTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <select
                  value={userFilter}
                  onChange={(e) => {
                    setUserFilter(e.target.value);
                    setPagination({ ...pagination, page: 1 });
                  }}
                  className="input-cyber min-w-48"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id.toString()}>
                      {user.fullName} (@{user.username})
                    </option>
                  ))}
                </select>

                <div className="ml-auto text-gray-400 text-sm">
                  Total: {pagination.total} transactions
                </div>
              </div>
            </motion.div>

            {/* Transactions List */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Token Transactions</h2>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="loading-spinner w-12 h-12" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Transactions Found</h3>
                  <p className="text-gray-400">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {transactions.map((transaction, index) => (
                    <motion.div
                      key={transaction.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="p-4 hover:bg-purple-500/5 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="mt-1">
                            {getTransactionIcon(transaction.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <h4 className="text-white font-semibold">{transaction.fullName}</h4>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTransactionColor(transaction.type)}`}>
                                {transaction.type}
                              </span>
                            </div>
                            
                            <p className="text-gray-300 text-sm mb-2">{transaction.reason}</p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-400">
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>@{transaction.username}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{new Date(transaction.createdAt).toLocaleDateString()}</span>
                              </div>
                              {transaction.adminName && (
                                <span>by {transaction.adminName}</span>
                              )}
                              {transaction.questionTitle && (
                                <div className="flex items-center space-x-1">
                                  <BookOpen className="w-3 h-3" />
                                  <span className="truncate max-w-32">{transaction.questionTitle}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold text-green-400">
                            +{transaction.amount}
                          </div>
                          <div className="text-gray-400 text-xs">tokens</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex justify-center mt-6 space-x-2"
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
                
                <span className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg font-semibold">
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

          {/* Top Users Sidebar */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-6">Top Token Holders</h2>
              
              {stats?.topUsers && stats.topUsers.length > 0 ? (
                <div className="space-y-4">
                  {stats.topUsers.map((user, index) => (
                    <motion.div
                      key={user.username}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-3 p-3 bg-dark-700/30 rounded-lg"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-500' :
                        index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-700' :
                        'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}>
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold truncate">{user.fullName}</h4>
                        <p className="text-gray-400 text-sm">@{user.username}</p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Coins className="w-4 h-4" />
                          <span className="font-bold">{user.tokenBalance}</span>
                        </div>
                        <div className="text-gray-400 text-xs">{user.transactionCount} transactions</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No user data available</p>
                </div>
              )}
            </motion.div>

            {/* Additional Stats */}
            {stats && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-6 mt-6"
              >
                <h2 className="text-xl font-bold text-white mb-6">Token Distribution</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 text-green-400" />
                      <span className="text-gray-300">Question Rewards</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalTokensFromQuestions}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Award className="w-4 h-4 text-blue-400" />
                      <span className="text-gray-300">Manual Awards</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalTokensFromAwards}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-purple-400" />
                      <span className="text-gray-300">Achievements</span>
                    </div>
                    <span className="text-white font-semibold">{stats.totalTokensFromAchievements}</span>
                  </div>

                  <div className="border-t border-gray-600 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">Active Users</span>
                      </div>
                      <span className="text-white font-semibold">{stats.totalActiveUsers}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Award Tokens Modal */}
      <AnimatePresence>
        {showAwardModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Award Tokens to User</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Select User
                  </label>
                  <select
                    value={awardForm.userId}
                    onChange={(e) => setAwardForm({ ...awardForm, userId: parseInt(e.target.value) })}
                    className="input-cyber w-full"
                  >
                    <option value={0}>Choose a user...</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} (@{user.username}) - {user.tokenBalance} tokens
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Token Amount
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={awardForm.amount}
                    onChange={(e) => setAwardForm({ ...awardForm, amount: parseInt(e.target.value) || 0 })}
                    className="input-cyber w-full"
                    placeholder="Enter amount to award"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Reason for Award
                  </label>
                  <textarea
                    value={awardForm.reason}
                    onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
                    className="input-cyber w-full h-24 resize-none"
                    placeholder="Explain why you're awarding these tokens..."
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAwardTokens}
                  disabled={isAwarding}
                  className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-lg btn-cyber disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isAwarding ? (
                    <>
                      <div className="loading-spinner w-5 h-5" />
                      <span>Awarding...</span>
                    </>
                  ) : (
                    <>
                      <Coins className="w-5 h-5" />
                      <span>Award Tokens</span>
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAwardModal(false)}
                  className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
