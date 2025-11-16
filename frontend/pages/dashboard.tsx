import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Coins,
  BookOpen,
  Trophy,
  User,
  LogOut,
  ChevronRight,
  Star,
  Clock,
  CheckCircle,
  XCircle,
  Award,
  TrendingUp,
  Zap,
  Crown
} from 'lucide-react';

interface Question {
  id: number;
  title: string;
  description: string;
  type: string;
  options?: string[];
  points: number;
  difficulty: string;
  category: string;
  hasSubmitted: boolean;
  submissionCorrect?: boolean;
  submissionStatus?: string;
  tokensAwarded?: number;
}

interface UserStats {
  totalSubmissions: number;
  correctAnswers: number;
  totalTokens: number;
  achievements: number;
  accuracy: number;
  recentActivity: any[];
}

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  tokensReward: number;
}

interface TopUser {
  id: number;
  username: string;
  fullName: string;
  tokenBalance: number;
  avatar?: string;
}

export default function Dashboard() {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user, router]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [questionsRes, statsRes, achievementsRes, topUsersRes] = await Promise.allSettled([
        axios.get('/questions?limit=5'),
        axios.get('/users/stats'),
        axios.get('/users/achievements'),
        axios.get('/users/top?limit=3'),
      ]);

      if (questionsRes.status === 'fulfilled') {
        setQuestions(questionsRes.value.data.questions);
      }
      if (statsRes.status === 'fulfilled') {
        setStats(statsRes.value.data.stats);
      }
      if (achievementsRes.status === 'fulfilled') {
        setAchievements(achievementsRes.value.data.allAchievements);
      }
      if (topUsersRes.status === 'fulfilled') {
        setTopUsers(topUsersRes.value.data.topUsers || []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Не удалось загрузить некоторые данные');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const getStatusIcon = (status: string, isCorrect?: boolean) => {
    if (status === 'pending') return <Clock className="w-4 h-4 text-yellow-400" />;
    if (status === 'reviewed') {
      return isCorrect ? 
        <CheckCircle className="w-4 h-4 text-green-400" /> : 
        <XCircle className="w-4 h-4 text-red-400" />;
    }
    return null;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20';
      case 'hard': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  if (!user) return null;

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
      <nav className="border-b border-purple-500/20 bg-dark-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-cyber font-bold text-white">
                WellSchool<span className="text-purple-400">Token</span>
              </span>
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
                  onClick={handleLogout}
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
        {/* Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-cyber font-bold text-white mb-2">
            Welcome back, <span className="text-purple-400">{user.username}</span>!
          </h1>
          <p className="text-gray-400 text-lg">Ready to continue your learning journey?</p>
        </motion.div>

        {/* Stats Overview */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.totalSubmissions}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Questions Answered</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.correctAnswers}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Correct Answers</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.accuracy}%</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Accuracy Rate</h3>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold text-white">{stats.achievements}</span>
              </div>
              <h3 className="text-gray-300 font-semibold">Achievements</h3>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Available Questions */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="glass rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Available Questions</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push('/questions')}
                  className="text-purple-400 hover:text-purple-300 font-semibold flex items-center space-x-1"
                >
                  <span>View All</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.01 }}
                    className="bg-dark-800/50 rounded-lg p-4 border border-purple-500/20 hover:border-purple-500/40 transition-colors cursor-pointer"
                    onClick={() => router.push(`/questions/${question.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-semibold">{question.title}</h3>
                          {question.hasSubmitted && (
                            getStatusIcon(question.submissionStatus || '', question.submissionCorrect)
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{question.description}</p>
                        <div className="flex items-center space-x-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="text-purple-400 text-sm">{question.category}</span>
                          <div className="flex items-center space-x-1 text-yellow-400">
                            <Coins className="w-3 h-3" />
                            <span className="text-sm">{question.points}</span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Achievements Sidebar */}
          <div className="space-y-6">
            {/* Recent Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Achievements</h2>
              <div className="space-y-3">
                {achievements.slice(0, 4).map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                      achievement.unlocked 
                        ? 'bg-purple-500/20 border border-purple-500/30' 
                        : 'bg-dark-800/50 opacity-50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      achievement.unlocked 
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500' 
                        : 'bg-gray-600'
                    }`}>
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm">{achievement.name}</h3>
                      <p className="text-gray-400 text-xs">{achievement.description}</p>
                    </div>
                    {achievement.unlocked && (
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                ))}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/achievements')}
                className="w-full mt-4 py-2 text-purple-400 hover:text-purple-300 font-semibold text-sm transition-colors"
              >
                View All Achievements
              </motion.button>
            </motion.div>

            {/* Top 3 Users */}
            {topUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-xl p-6 mb-6"
              >
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-yellow-400" />
                  <span>Топ-3 по баллам</span>
                </h2>
                <div className="space-y-3">
                  {topUsers.map((topUser, index) => (
                    <motion.div
                      key={topUser.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ scale: 1.02 }}
                      className={`relative rounded-lg p-3 ${
                        index === 0 
                          ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' 
                          : index === 1
                          ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30'
                          : 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30'
                      }`}
                    >
                      {index === 0 && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Crown className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          index === 0 
                            ? 'bg-gradient-to-br from-yellow-500 to-orange-500 text-white' 
                            : index === 1
                            ? 'bg-gradient-to-br from-gray-400 to-gray-500 text-white'
                            : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-sm">{topUser.fullName}</h3>
                          <p className="text-gray-400 text-xs">@{topUser.username}</p>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Coins className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-sm">{topUser.tokenBalance}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="glass rounded-xl p-6"
            >
              <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/questions')}
                  className="w-full p-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg text-white font-semibold hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                >
                  Browse Questions
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/profile')}
                  className="w-full p-3 bg-dark-700/50 border border-gray-600 rounded-lg text-white font-semibold hover:bg-dark-700 transition-all"
                >
                  Edit Profile
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/history')}
                  className="w-full p-3 bg-dark-700/50 border border-gray-600 rounded-lg text-white font-semibold hover:bg-dark-700 transition-all"
                >
                  View History
                </motion.button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
