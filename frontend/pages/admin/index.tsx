import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Users,
  BookOpen,
  Coins,
  Clock,
  Shield,
  LogOut,
  TrendingUp,
  Award,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  UserPlus,
  FileText,
  Settings
} from 'lucide-react';

interface AdminStats {
  totalUsers: number;
  totalSubmissions: number;
  pendingReviews: number;
  totalQuestions: number;
  totalTokensAwarded: number;
  recentActivity: any[];
}

interface Submission {
  id: number;
  username: string;
  userFullName: string;
  title: string;
  description: string;
  userAnswer: string;
  correctAnswer: string;
  points: number;
  submittedAt: string;
  status: string;
}

export default function AdminDashboard() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingSubmissions, setPendingSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [reviewData, setReviewData] = useState({ isCorrect: false, tokensAwarded: 0, feedback: '' });

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    fetchAdminData();
  }, [admin, router]);

  const fetchAdminData = async () => {
    try {
      setIsLoading(true);
      const [statsRes, submissionsRes] = await Promise.all([
        axios.get('/admin/dashboard/stats'),
        axios.get('/admin/submissions?status=pending&limit=5'),
      ]);

      setStats(statsRes.data.stats);
      setPendingSubmissions(submissionsRes.data.submissions);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReviewSubmission = async (submissionId: number) => {
    try {
      await axios.post(`/admin/submissions/${submissionId}/review`, reviewData);
      toast.success('Submission reviewed successfully');
      setSelectedSubmission(null);
      setReviewData({ isCorrect: false, tokensAwarded: 0, feedback: '' });
      fetchAdminData(); // Refresh data
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      toast.error(error.response?.data?.message || 'Failed to review submission');
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!admin) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 cyber-grid flex items-center justify-center">
        <div className="loading-spinner w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-900 cyber-grid">
      {/* Navigation Bar */}
      <nav className="border-b border-red-500/20 bg-dark-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-cyber font-bold text-white">
                Admin <span className="text-red-400">Portal</span>
              </span>
            </div>

            <div className="flex items-center space-x-6">
              {/* Admin Menu */}
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-white font-semibold">{admin.fullName}</p>
                  <p className="text-red-400 text-sm">{admin.role}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-cyber font-bold text-white mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 text-lg">Manage users, questions, and track platform activity</p>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8"
          >
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalUsers}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Всего пользователей</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalQuestions}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Questions</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalSubmissions}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Submissions</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.pendingReviews}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Ожидают проверки</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Coins className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalTokensAwarded}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Токенов выдано</h3>
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/users')}
            className="glass rounded-lg p-4 text-center hover:bg-blue-500/10 border hover:border-blue-500/30 transition-all"
          >
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">Пользователи</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/questions')}
            className="glass rounded-lg p-4 text-center hover:bg-green-500/10 border hover:border-green-500/30 transition-all"
          >
            <BookOpen className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">Вопросы</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/assignments')}
            className="glass rounded-lg p-4 text-center hover:bg-emerald-500/10 border hover:border-emerald-500/30 transition-all"
          >
            <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">Задания</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/submissions')}
            className="glass rounded-lg p-4 text-center hover:bg-yellow-500/10 border hover:border-yellow-500/30 transition-all"
          >
            <Clock className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">Проверка</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => router.push('/admin/tokens')}
            className="glass rounded-lg p-4 text-center hover:bg-purple-500/10 border hover:border-purple-500/30 transition-all"
          >
            <Coins className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <span className="text-white font-semibold text-sm">Токены</span>
          </motion.button>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Pending Submissions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-xl p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Ожидают проверки</h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/admin/submissions')}
                className="text-red-400 hover:text-red-300 font-semibold text-sm"
              >
                Все
              </motion.button>
            </div>

            <div className="space-y-4">
              {pendingSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-400">Нет ожидающих проверки!</p>
                </div>
              ) : (
                pendingSubmissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-dark-800/50 rounded-lg p-4 border border-yellow-500/20"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold mb-1">{submission.title}</h3>
                        <p className="text-gray-400 text-sm mb-2">
                          by {submission.userFullName} (@{submission.username})
                        </p>
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                          {submission.userAnswer}
                        </p>
                        <div className="flex items-center space-x-3 text-xs">
                          <span className="text-yellow-400">Pending Review</span>
                          <span className="text-purple-400">{submission.points} points</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedSubmission(submission);
                          setReviewData({ 
                            isCorrect: false, 
                            tokensAwarded: submission.points, 
                            feedback: '' 
                          });
                        }}
                        className="ml-4 p-2 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/20 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-xl p-6"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Последняя активность</h2>
            
            <div className="space-y-4">
              {stats?.recentActivity?.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Нет активности</p>
                </div>
              ) : (
                stats?.recentActivity?.slice(0, 6).map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 py-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white text-sm">
                        <span className="font-semibold">{activity.username}</span> submitted answer for{' '}
                        <span className="text-purple-400">{activity.questionTitle}</span>
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(activity.submittedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Проверка ответа</h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-gray-300 text-sm">Вопрос:</label>
                <p className="text-white font-semibold">{selectedSubmission.title}</p>
              </div>
              
              <div>
                <label className="text-gray-300 text-sm">Ответ студента:</label>
                <p className="text-gray-100 bg-dark-800/50 p-3 rounded-lg">
                  {selectedSubmission.userAnswer}
                </p>
              </div>
              
              <div>
                <label className="text-gray-300 text-sm">Правильный ответ:</label>
                <p className="text-green-300 bg-green-500/10 p-3 rounded-lg border border-green-500/20">
                  {selectedSubmission.correctAnswer}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 text-sm mb-2">Правильно?</label>
                  <div className="flex space-x-2">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setReviewData({ ...reviewData, isCorrect: true })}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        reviewData.isCorrect 
                          ? 'bg-green-500 text-white' 
                          : 'bg-dark-700 text-gray-300 hover:bg-green-500/20'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setReviewData({ ...reviewData, isCorrect: false })}
                      className={`px-4 py-2 rounded-lg font-semibold ${
                        !reviewData.isCorrect 
                          ? 'bg-red-500 text-white' 
                          : 'bg-dark-700 text-gray-300 hover:bg-red-500/20'
                      }`}
                    >
                      <XCircle className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm mb-2">Токенов к выдаче</label>
                  <input
                    type="number"
                    min="0"
                    max={selectedSubmission.points}
                    value={reviewData.tokensAwarded}
                    onChange={(e) => setReviewData({ 
                      ...reviewData, 
                      tokensAwarded: parseInt(e.target.value) || 0 
                    })}
                    className="input-cyber w-full"
                  />
                </div>
              </div>

              <div>
                  <label className="block text-gray-300 text-sm mb-2">Комментарий (необязательно)</label>
                <textarea
                  value={reviewData.feedback}
                  onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                  className="input-cyber w-full h-20 resize-none"
                  placeholder="Оставьте комментарий для студента..."
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleReviewSubmission(selectedSubmission.id)}
                className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg"
              >
                Отправить проверку
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedSubmission(null)}
                className="px-6 py-2 bg-dark-700 text-gray-300 font-semibold rounded-lg hover:bg-dark-600"
              >
                Отмена
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
