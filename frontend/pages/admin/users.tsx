import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  LogOut,
  ArrowLeft,
  Coins,
  Calendar,
  Mail,
  User,
  Eye,
  EyeOff,
  Save,
  X,
  UserCheck,
  UserX,
  TrendingUp,
  Crown
} from 'lucide-react';

interface UserData {
  id: number;
  username: string;
  email: string;
  fullName: string;
  tokenBalance: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NewUser {
  username: string;
  email: string;
  password: string;
  fullName: string;
  tokenBalance: number;
}

interface TopUser {
  id: number;
  username: string;
  fullName: string;
  tokenBalance: number;
  avatar?: string;
}

export default function AdminUsers() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    email: '',
    password: '',
    fullName: '',
    tokenBalance: 0
  });
  
  const [editUser, setEditUser] = useState({
    fullName: '',
    email: '',
    tokenBalance: 0,
    isActive: true
  });
  
  const [tokenAward, setTokenAward] = useState({
    amount: 0,
    reason: ''
  });
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    fetchUsers();
    fetchTopUsers();
  }, [admin, router, pagination.page]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`/admin/users?${params}`);
      setUsers(response.data.users);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopUsers = async () => {
    try {
      const response = await axios.get('/users/top?limit=3');
      setTopUsers(response.data.topUsers);
    } catch (error) {
      console.error('Error fetching top users:', error);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleCreateUser = async () => {
    try {
      await axios.post('/admin/users', newUser);
      toast.success('User created successfully');
      setShowCreateModal(false);
      setNewUser({
        username: '',
        email: '',
        password: '',
        fullName: '',
        tokenBalance: 0
      });
      fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      await axios.put(`/admin/users/${selectedUser.id}`, editUser);
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Failed to update user');
    }
  };

  const handleAwardTokens = async () => {
    if (!selectedUser || tokenAward.amount <= 0 || !tokenAward.reason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      await axios.post(`/admin/users/${selectedUser.id}/award-tokens`, tokenAward);
      toast.success('Tokens awarded successfully');
      setShowTokenModal(false);
      setSelectedUser(null);
      setTokenAward({ amount: 0, reason: '' });
      fetchUsers();
    } catch (error: any) {
      console.error('Error awarding tokens:', error);
      toast.error(error.response?.data?.message || 'Failed to award tokens');
    }
  };

  const handleDeactivateUser = async (userId: number) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return;
    
    try {
      await axios.delete(`/admin/users/${userId}`);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error: any) {
      console.error('Error deactivating user:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate user');
    }
  };

  const openEditModal = (user: UserData) => {
    setSelectedUser(user);
    setEditUser({
      fullName: user.fullName,
      email: user.email,
      tokenBalance: user.tokenBalance,
      isActive: user.isActive
    });
    setShowEditModal(true);
  };

  const openTokenModal = (user: UserData) => {
    setSelectedUser(user);
    setTokenAward({ amount: 0, reason: '' });
    setShowTokenModal(true);
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
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  User Management
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
              User Management
            </h1>
            <p className="text-gray-400 text-lg">Manage platform users and their accounts</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg btn-cyber"
          >
            <Plus className="w-5 h-5" />
            <span>Add User</span>
          </motion.button>
        </motion.div>

        {/* Top 3 Users */}
        {topUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-6 mb-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-yellow-400" />
              <span>Топ-3 пользователей по баллам</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {topUsers.map((topUser, index) => (
                <motion.div
                  key={topUser.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ scale: 1.02 }}
                  className={`relative rounded-xl p-6 ${
                    index === 0 
                      ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/50' 
                      : index === 1
                      ? 'bg-gradient-to-br from-gray-400/20 to-gray-500/20 border-2 border-gray-400/50'
                      : 'bg-gradient-to-br from-amber-600/20 to-amber-700/20 border-2 border-amber-600/50'
                  }`}
                >
                  {index === 0 && (
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                      <Crown className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                        index === 0 
                          ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' 
                          : index === 1
                          ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                          : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg">{topUser.fullName}</h3>
                      <p className="text-gray-400 text-sm">@{topUser.username}</p>
                      <div className="flex items-center space-x-1 mt-2">
                        <Coins className="w-4 h-4 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">{topUser.tokenBalance}</span>
                        <span className="text-gray-400 text-sm">токенов</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="input-cyber pl-10 w-full"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSearch}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors"
            >
              Search
            </motion.button>
          </div>
        </motion.div>

        {/* Users Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl overflow-hidden"
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Users Found</h3>
              <p className="text-gray-400">Try adjusting your search terms.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-dark-700/50 border-b border-gray-600">
                  <tr>
                    <th className="text-left text-white font-semibold p-4">User</th>
                    <th className="text-left text-white font-semibold p-4">Email</th>
                    <th className="text-left text-white font-semibold p-4">Tokens</th>
                    <th className="text-left text-white font-semibold p-4">Status</th>
                    <th className="text-left text-white font-semibold p-4">Joined</th>
                    <th className="text-right text-white font-semibold p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      whileHover={{ backgroundColor: 'rgba(168, 85, 247, 0.05)' }}
                      className="border-b border-gray-700/50"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <div className="text-white font-semibold">{user.fullName}</div>
                            <div className="text-gray-400 text-sm">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300">{user.email}</td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Coins className="w-4 h-4" />
                          <span className="font-semibold">{user.tokenBalance}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-400/20 text-green-400 border border-green-400/30' 
                            : 'bg-red-400/20 text-red-400 border border-red-400/30'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-1 text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span className="text-sm">{new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openTokenModal(user)}
                            className="p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                            title="Award Tokens"
                          >
                            <Coins className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(user)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Edit User"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          
                          {user.isActive && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeactivateUser(user.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Deactivate User"
                            >
                              <UserX className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Create User Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-6">Create New User</h3>
              
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  className="input-cyber w-full"
                />
                
                <input
                  type="text"
                  placeholder="Username"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="input-cyber w-full"
                />
                
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="input-cyber w-full"
                />
                
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="input-cyber w-full pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                <input
                  type="number"
                  placeholder="Initial Token Balance"
                  value={newUser.tokenBalance}
                  onChange={(e) => setNewUser({ ...newUser, tokenBalance: parseInt(e.target.value) || 0 })}
                  className="input-cyber w-full"
                  min="0"
                />
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateUser}
                  className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Create User</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit User Modal */}
      <AnimatePresence>
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-6">Edit User: {selectedUser.fullName}</h3>
              
              <div className="space-y-4 mb-6">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={editUser.fullName}
                  onChange={(e) => setEditUser({ ...editUser, fullName: e.target.value })}
                  className="input-cyber w-full"
                />
                
                <input
                  type="email"
                  placeholder="Email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="input-cyber w-full"
                />
                
                <input
                  type="number"
                  placeholder="Token Balance"
                  value={editUser.tokenBalance}
                  onChange={(e) => setEditUser({ ...editUser, tokenBalance: parseInt(e.target.value) || 0 })}
                  className="input-cyber w-full"
                  min="0"
                />

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={editUser.isActive}
                    onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-500"
                  />
                  <span className="text-gray-300">Active User</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditUser}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Award Tokens Modal */}
      <AnimatePresence>
        {showTokenModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-xl font-bold text-white mb-6">Award Tokens to {selectedUser.fullName}</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Current Balance: {selectedUser.tokenBalance} tokens
                  </label>
                  <input
                    type="number"
                    placeholder="Token Amount"
                    value={tokenAward.amount}
                    onChange={(e) => setTokenAward({ ...tokenAward, amount: parseInt(e.target.value) || 0 })}
                    className="input-cyber w-full"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Reason for Award
                  </label>
                  <textarea
                    placeholder="Explain why you're awarding these tokens..."
                    value={tokenAward.reason}
                    onChange={(e) => setTokenAward({ ...tokenAward, reason: e.target.value })}
                    className="input-cyber w-full h-24 resize-none"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAwardTokens}
                  className="flex-1 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Coins className="w-4 h-4" />
                  <span>Award Tokens</span>
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowTokenModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
