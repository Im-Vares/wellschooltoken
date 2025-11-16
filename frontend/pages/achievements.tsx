import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Trophy,
  Star,
  Award,
  Crown,
  BookOpen,
  Coins,
  Target,
  ArrowLeft,
  Zap,
  LogOut,
  Calendar,
  Lock,
  CheckCircle,
  GraduationCap
} from 'lucide-react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  tokensReward: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface UnlockedAchievement extends Achievement {
  unlockedAt: string;
}

interface AchievementsData {
  unlockedAchievements: UnlockedAchievement[];
  allAchievements: Achievement[];
}

const getAchievementIcon = (icon: string) => {
  switch (icon) {
    case 'star': return Star;
    case 'book': return BookOpen;
    case 'coins': return Coins;
    case 'graduation-cap': return GraduationCap;
    case 'crown': return Crown;
    case 'trophy': return Trophy;
    default: return Award;
  }
};

const getAchievementColor = (icon: string, unlocked: boolean) => {
  if (!unlocked) return 'from-gray-600 to-gray-700';
  
  switch (icon) {
    case 'star': return 'from-yellow-500 to-orange-500';
    case 'book': return 'from-blue-500 to-cyan-500';
    case 'coins': return 'from-amber-500 to-yellow-500';
    case 'graduation-cap': return 'from-green-500 to-emerald-500';
    case 'crown': return 'from-purple-500 to-pink-500';
    case 'trophy': return 'from-orange-500 to-red-500';
    default: return 'from-purple-500 to-pink-500';
  }
};

export default function Achievements() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [achievementsData, setAchievementsData] = useState<AchievementsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchAchievements();
  }, [user, router]);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/users/achievements');
      setAchievementsData(response.data);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredAchievements = () => {
    if (!achievementsData) return [];
    
    switch (filter) {
      case 'unlocked':
        return achievementsData.allAchievements.filter(a => a.unlocked);
      case 'locked':
        return achievementsData.allAchievements.filter(a => !a.unlocked);
      default:
        return achievementsData.allAchievements;
    }
  };

  const getProgressPercentage = () => {
    if (!achievementsData) return 0;
    const unlocked = achievementsData.allAchievements.filter(a => a.unlocked).length;
    const total = achievementsData.allAchievements.length;
    return Math.round((unlocked / total) * 100);
  };

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
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  Achievements
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
            Your Achievements
          </h1>
          <p className="text-gray-400 text-lg">Track your learning milestones and unlock rewards</p>
        </motion.div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-8 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Overall Progress</h2>
            <div className="text-right">
              <div className="text-3xl font-cyber font-bold text-purple-400">
                {getProgressPercentage()}%
              </div>
              <div className="text-gray-400 text-sm">Complete</div>
            </div>
          </div>

          {achievementsData && (
            <>
              <div className="w-full bg-dark-700 rounded-full h-3 mb-4 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${getProgressPercentage()}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full relative progress-bar"
                />
              </div>

              <div className="flex justify-between text-sm text-gray-400">
                <span>{achievementsData.allAchievements.filter(a => a.unlocked).length} unlocked</span>
                <span>{achievementsData.allAchievements.filter(a => !a.unlocked).length} remaining</span>
              </div>
            </>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <div className="flex space-x-2 bg-dark-800/50 rounded-lg p-1">
            {[
              { key: 'all', label: 'All', icon: Target },
              { key: 'unlocked', label: 'Unlocked', icon: CheckCircle },
              { key: 'locked', label: 'Locked', icon: Lock }
            ].map(({ key, label, icon: Icon }) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilter(key as any)}
                className={`flex items-center space-x-2 px-6 py-2 rounded-lg font-semibold transition-all ${
                  filter === key
                    ? 'bg-purple-500 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-purple-500/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Achievements Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={filter}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {isLoading ? (
              <div className="col-span-full flex justify-center py-12">
                <div className="loading-spinner w-12 h-12" />
              </div>
            ) : getFilteredAchievements().length === 0 ? (
              <div className="col-span-full glass rounded-xl p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No Achievements Found</h3>
                <p className="text-gray-400">Try changing your filter or keep learning to unlock more!</p>
              </div>
            ) : (
              getFilteredAchievements().map((achievement, index) => {
                const IconComponent = getAchievementIcon(achievement.icon);
                const colorClasses = getAchievementColor(achievement.icon, achievement.unlocked);

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02 }}
                    className={`glass rounded-xl p-6 relative overflow-hidden transition-all ${
                      achievement.unlocked
                        ? 'border-purple-500/30 glow-purple'
                        : 'border-gray-600 opacity-75'
                    }`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="w-full h-full" style={{
                        backgroundImage: `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(168, 85, 247, 0.1) 60deg, transparent 120deg)`
                      }} />
                    </div>

                    {/* Achievement Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${colorClasses} flex items-center justify-center`}>
                        <IconComponent className="w-8 h-8 text-white" />
                      </div>

                      {/* Name */}
                      <h3 className={`text-xl font-bold text-center mb-2 ${
                        achievement.unlocked ? 'text-white' : 'text-gray-400'
                      }`}>
                        {achievement.name}
                      </h3>

                      {/* Description */}
                      <p className={`text-center text-sm mb-4 ${
                        achievement.unlocked ? 'text-gray-300' : 'text-gray-500'
                      }`}>
                        {achievement.description}
                      </p>

                      {/* Progress/Status */}
                      <div className="text-center mb-4">
                        {achievement.unlocked ? (
                          <div className="flex items-center justify-center space-x-2 text-green-400">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Unlocked!</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2 text-gray-500">
                            <Lock className="w-4 h-4" />
                            <span className="text-sm">
                              {achievement.condition_type === 'correct_answers' 
                                ? `Answer ${achievement.condition_value} questions correctly`
                                : `Earn ${achievement.condition_value} tokens`
                              }
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Reward */}
                      {achievement.tokensReward > 0 && (
                        <div className="flex items-center justify-center space-x-1 text-yellow-400">
                          <Coins className="w-4 h-4" />
                          <span className="text-sm font-medium">+{achievement.tokensReward} tokens</span>
                        </div>
                      )}

                      {/* Unlock Date */}
                      {achievement.unlocked && achievement.unlockedAt && (
                        <div className="flex items-center justify-center space-x-1 text-gray-400 text-xs mt-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {/* Shine Effect for Unlocked */}
                    {achievement.unlocked && (
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse" />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </motion.div>
        </AnimatePresence>

        {/* Recent Unlocks */}
        {achievementsData?.unlockedAchievements && achievementsData.unlockedAchievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Recent Unlocks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {achievementsData.unlockedAchievements.slice(0, 4).map((achievement, index) => {
                const IconComponent = getAchievementIcon(achievement.icon);
                const colorClasses = getAchievementColor(achievement.icon, true);

                return (
                  <motion.div
                    key={achievement.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="glass rounded-lg p-4 border border-purple-500/30"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClasses} flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-sm">{achievement.name}</h3>
                        <p className="text-gray-400 text-xs">
                          {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
