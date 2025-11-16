import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Award,
  Plus,
  Edit,
  Trash2,
  Shield,
  LogOut,
  ArrowLeft,
  Save,
  X,
  Star,
  BookOpen,
  Coins,
  GraduationCap,
  Crown,
  Trophy,
  CheckCircle,
  Lock,
  Users
} from 'lucide-react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  tokensReward: number;
  isActive: boolean;
  unlockedCount: number;
  createdAt: string;
}

interface AchievementForm {
  name: string;
  description: string;
  icon: string;
  condition_type: string;
  condition_value: number;
  tokensReward: number;
  isActive: boolean;
}

const iconOptions = [
  { value: 'star', label: 'Star', icon: Star },
  { value: 'book', label: 'Book', icon: BookOpen },
  { value: 'coins', label: 'Coins', icon: Coins },
  { value: 'graduation-cap', label: 'Graduation Cap', icon: GraduationCap },
  { value: 'crown', label: 'Crown', icon: Crown },
  { value: 'trophy', label: 'Trophy', icon: Trophy }
];

const getIconComponent = (icon: string) => {
  const iconOption = iconOptions.find(opt => opt.value === icon);
  return iconOption ? iconOption.icon : Award;
};

export default function AdminAchievements() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  
  const [formData, setFormData] = useState<AchievementForm>({
    name: '',
    description: '',
    icon: 'star',
    condition_type: 'correct_answers',
    condition_value: 1,
    tokensReward: 0,
    isActive: true
  });

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    fetchAchievements();
  }, [admin, router]);

  const fetchAchievements = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/achievements/admin/all');
      setAchievements(response.data.achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast.error('Не удалось загрузить достижения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAchievement = async () => {
    try {
      await axios.post('/achievements/admin', formData);
      toast.success('Достижение успешно создано');
      setShowCreateModal(false);
      resetForm();
      fetchAchievements();
    } catch (error: any) {
      console.error('Error creating achievement:', error);
      toast.error(error.response?.data?.message || 'Не удалось создать достижение');
    }
  };

  const handleUpdateAchievement = async () => {
    if (!selectedAchievement) return;
    
    try {
      await axios.put(`/achievements/admin/${selectedAchievement.id}`, formData);
      toast.success('Достижение успешно обновлено');
      setShowEditModal(false);
      setSelectedAchievement(null);
      resetForm();
      fetchAchievements();
    } catch (error: any) {
      console.error('Error updating achievement:', error);
      toast.error(error.response?.data?.message || 'Не удалось обновить достижение');
    }
  };

  const handleDeleteAchievement = async (achievementId: number) => {
    if (!confirm('Вы уверены, что хотите деактивировать это достижение?')) return;
    
    try {
      await axios.delete(`/achievements/admin/${achievementId}`);
      toast.success('Достижение деактивировано');
      fetchAchievements();
    } catch (error: any) {
      console.error('Error deleting achievement:', error);
      toast.error(error.response?.data?.message || 'Не удалось деактивировать достижение');
    }
  };

  const openEditModal = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      condition_type: achievement.condition_type,
      condition_value: achievement.condition_value,
      tokensReward: achievement.tokensReward,
      isActive: achievement.isActive
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'star',
      condition_type: 'correct_answers',
      condition_value: 1,
      tokensReward: 0,
      isActive: true
    });
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
                <span>Назад в админ-панель</span>
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  Управление достижениями
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
              Управление достижениями
            </h1>
            <p className="text-gray-400 text-lg">Создавайте и настраивайте достижения для пользователей</p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg btn-cyber"
          >
            <Plus className="w-5 h-5" />
            <span>Создать достижение</span>
          </motion.button>
        </motion.div>

        {/* Achievements Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {isLoading ? (
            <div className="col-span-full flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : achievements.length === 0 ? (
            <div className="col-span-full glass rounded-xl p-12 text-center">
              <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Нет достижений</h3>
              <p className="text-gray-400">Создайте первое достижение, чтобы начать</p>
            </div>
          ) : (
            achievements.map((achievement, index) => {
              const IconComponent = getIconComponent(achievement.icon);
              const colorClasses = achievement.isActive 
                ? 'from-purple-500 to-pink-500' 
                : 'from-gray-600 to-gray-700';

              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className={`glass rounded-xl p-6 relative overflow-hidden ${
                    achievement.isActive 
                      ? 'border-purple-500/30' 
                      : 'border-gray-600 opacity-75'
                  }`}
                >
                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${colorClasses} flex items-center justify-center`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>

                    {/* Name */}
                    <h3 className={`text-xl font-bold text-center mb-2 ${
                      achievement.isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {achievement.name}
                    </h3>

                    {/* Description */}
                    <p className={`text-center text-sm mb-4 ${
                      achievement.isActive ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {achievement.description}
                    </p>

                    {/* Condition */}
                    <div className="bg-dark-800/50 rounded-lg p-3 mb-4">
                      <div className="text-center mb-2">
                        <span className="text-gray-400 text-xs">Условие:</span>
                      </div>
                      <div className="text-center text-sm text-white">
                        {achievement.condition_type === 'correct_answers' 
                          ? `Ответить правильно на ${achievement.condition_value} вопросов`
                          : `Заработать ${achievement.condition_value} токенов`
                        }
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1 text-yellow-400">
                        <Coins className="w-4 h-4" />
                        <span className="text-sm font-medium">+{achievement.tokensReward}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-purple-400">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{achievement.unlockedCount}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        {achievement.isActive ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-400">
                          {achievement.isActive ? 'Активно' : 'Неактивно'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openEditModal(achievement)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                        title="Редактировать"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      
                      {achievement.isActive && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDeleteAchievement(achievement.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="Деактивировать"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </motion.div>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-white mb-6">Создать новое достижение</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Название</label>
                  <input
                    type="text"
                    placeholder="Название достижения"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-cyber w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Описание</label>
                  <textarea
                    placeholder="Описание достижения"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-cyber w-full h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Иконка</label>
                  <div className="grid grid-cols-3 gap-3">
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, icon: option.value })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.icon === option.value
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-gray-600 bg-dark-800/50'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 mx-auto ${
                            formData.icon === option.value ? 'text-purple-400' : 'text-gray-400'
                          }`} />
                          <span className={`text-xs mt-2 block ${
                            formData.icon === option.value ? 'text-purple-400' : 'text-gray-400'
                          }`}>
                            {option.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Тип условия</label>
                  <select
                    value={formData.condition_type}
                    onChange={(e) => setFormData({ ...formData, condition_type: e.target.value })}
                    className="input-cyber w-full"
                  >
                    <option value="correct_answers">Правильные ответы</option>
                    <option value="total_tokens">Всего токенов</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Значение условия</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Значение"
                    value={formData.condition_value}
                    onChange={(e) => setFormData({ ...formData, condition_value: parseInt(e.target.value) || 1 })}
                    className="input-cyber w-full"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Награда в токенах</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Количество токенов"
                    value={formData.tokensReward}
                    onChange={(e) => setFormData({ ...formData, tokensReward: parseInt(e.target.value) || 0 })}
                    className="input-cyber w-full"
                  />
                </div>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-500"
                  />
                  <span className="text-gray-300">Активно</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCreateAchievement}
                  className="flex-1 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Создать</span>
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

      {/* Edit Modal */}
      <AnimatePresence>
        {showEditModal && selectedAchievement && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-xl font-bold text-white mb-6">Редактировать достижение: {selectedAchievement.name}</h3>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Название</label>
                  <input
                    type="text"
                    placeholder="Название достижения"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-cyber w-full"
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Описание</label>
                  <textarea
                    placeholder="Описание достижения"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-cyber w-full h-24 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Иконка</label>
                  <div className="grid grid-cols-3 gap-3">
                    {iconOptions.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <motion.button
                          key={option.value}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setFormData({ ...formData, icon: option.value })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.icon === option.value
                              ? 'border-purple-500 bg-purple-500/20'
                              : 'border-gray-600 bg-dark-800/50'
                          }`}
                        >
                          <IconComponent className={`w-6 h-6 mx-auto ${
                            formData.icon === option.value ? 'text-purple-400' : 'text-gray-400'
                          }`} />
                          <span className={`text-xs mt-2 block ${
                            formData.icon === option.value ? 'text-purple-400' : 'text-gray-400'
                          }`}>
                            {option.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Тип условия</label>
                  <select
                    value={formData.condition_type}
                    onChange={(e) => setFormData({ ...formData, condition_type: e.target.value })}
                    className="input-cyber w-full"
                  >
                    <option value="correct_answers">Правильные ответы</option>
                    <option value="total_tokens">Всего токенов</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Значение условия</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="Значение"
                    value={formData.condition_value}
                    onChange={(e) => setFormData({ ...formData, condition_value: parseInt(e.target.value) || 1 })}
                    className="input-cyber w-full"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">Награда в токенах</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Количество токенов"
                    value={formData.tokensReward}
                    onChange={(e) => setFormData({ ...formData, tokensReward: parseInt(e.target.value) || 0 })}
                    className="input-cyber w-full"
                  />
                </div>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-purple-500"
                  />
                  <span className="text-gray-300">Активно</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdateAchievement}
                  className="flex-1 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Сохранить</span>
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
    </div>
  );
}

