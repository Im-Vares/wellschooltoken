import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Shield,
  LogOut,
  ArrowLeft,
  Search,
  Filter,
  Eye,
  Coins,
  Calendar,
  Users,
  TrendingUp,
  Save,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface Question {
  id: number;
  title: string;
  description: string;
  type: string;
  options?: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  imageUrl?: string;
  correctAnswer: string;
  points: number;
  difficulty: string;
  category: string;
  isActive: boolean;
  createdByName?: string;
  createdAt: string;
  submissionCount: number;
  correctSubmissions: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface QuestionForm {
  title: string;
  description: string;
  type: string;
  options: string[];
  matchingPairs: Array<{ left: string; right: string }>;
  correctAnswer: string;
  points: number;
  difficulty: string;
  category: string;
  image?: File | null;
}

export default function AdminQuestions() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  const [questionForm, setQuestionForm] = useState<QuestionForm>({
    title: '',
    description: '',
    type: 'multiple_choice',
    options: ['', '', '', ''],
    matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }],
    correctAnswer: '',
    points: 10,
    difficulty: 'easy',
    category: 'general',
    image: null
  });

  const questionTypes = [
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'text', label: 'Text Answer' },
    { value: 'true_false', label: 'True/False' },
    { value: 'matching', label: 'Matching (Соединение слов)' },
    { value: 'phrase', label: 'Phrase (Фразы)' },
    { value: 'image', label: 'Image (С картинкой)' }
  ];

  const difficulties = ['easy', 'medium', 'hard'];
  const categories = ['programming', 'react', 'javascript', 'general', 'reflection', 'math', 'science'];

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    fetchQuestions();
  }, [admin, router, pagination.page, categoryFilter, difficultyFilter, statusFilter]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (difficultyFilter !== 'all') params.append('difficulty', difficultyFilter);
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active' ? 'true' : 'false');

      const response = await axios.get(`/questions/admin/all?${params}`);
      setQuestions(response.data.questions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setQuestionForm({
      title: '',
      description: '',
      type: 'multiple_choice',
      options: ['', '', '', ''],
      matchingPairs: [{ left: '', right: '' }, { left: '', right: '' }],
      correctAnswer: '',
      points: 10,
      difficulty: 'easy',
      category: 'general',
      image: null
    });
  };

  // Обновляем correctAnswer при изменении типа вопроса
  useEffect(() => {
    if (questionForm.type === 'matching') {
      // Для matching вопросов правильный ответ генерируется автоматически
      setQuestionForm(prev => ({ ...prev, correctAnswer: '' }));
    } else if (questionForm.type === 'true_false') {
      // Для true/false устанавливаем значение по умолчанию
      setQuestionForm(prev => {
        if (!prev.correctAnswer || (prev.correctAnswer !== 'True' && prev.correctAnswer !== 'False')) {
          return { ...prev, correctAnswer: 'True' };
        }
        return prev;
      });
    }
  }, [questionForm.type]);

  const handleCreateQuestion = async () => {
    if (!questionForm.title || !questionForm.description) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (questionForm.type === 'multiple_choice') {
      const nonEmptyOptions = questionForm.options.filter(opt => opt.trim());
      if (nonEmptyOptions.length < 2) {
        toast.error('Вопросы с вариантами ответа должны иметь минимум 2 варианта');
        return;
      }
      if (!questionForm.correctAnswer || !nonEmptyOptions.includes(questionForm.correctAnswer)) {
        toast.error('Правильный ответ должен быть одним из предложенных вариантов');
        return;
      }
    }

    if (questionForm.type === 'matching') {
      const nonEmptyPairs = questionForm.matchingPairs.filter(p => p.left.trim() && p.right.trim());
      if (nonEmptyPairs.length < 2) {
        toast.error('Вопросы на соединение должны иметь минимум 2 пары');
        return;
      }
      // Правильный ответ для matching вопросов генерируется автоматически
    } else if (questionForm.type === 'true_false') {
      if (!questionForm.correctAnswer || (questionForm.correctAnswer !== 'True' && questionForm.correctAnswer !== 'False')) {
        toast.error('Для вопросов True/False выберите правильный ответ: True или False');
        return;
      }
    } else if (!questionForm.correctAnswer || questionForm.correctAnswer.trim() === '') {
      toast.error('Пожалуйста, укажите правильный ответ');
      return;
    }

    if (questionForm.type === 'image' && !questionForm.image) {
      toast.error('Для вопросов с картинкой необходимо загрузить изображение');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', questionForm.title);
      formData.append('description', questionForm.description);
      formData.append('type', questionForm.type);
      formData.append('points', questionForm.points.toString());
      formData.append('difficulty', questionForm.difficulty);
      formData.append('category', questionForm.category);

      // Обработка правильного ответа в зависимости от типа вопроса
      if (questionForm.type === 'matching' && questionForm.matchingPairs) {
        const nonEmptyPairs = questionForm.matchingPairs.filter(p => p.left.trim() && p.right.trim());
        formData.append('matchingPairs', JSON.stringify(nonEmptyPairs));
        // Для matching вопросов правильный ответ - это JSON объект с индексами и правыми значениями
        const correctAnswerObj: Record<number, string> = {};
        nonEmptyPairs.forEach((pair, index) => {
          correctAnswerObj[index] = pair.right;
        });
        formData.append('correctAnswer', JSON.stringify(correctAnswerObj));
      } else if (questionForm.type === 'multiple_choice' && questionForm.options) {
        const nonEmptyOptions = questionForm.options.filter(opt => opt.trim());
        formData.append('options', JSON.stringify(nonEmptyOptions));
        formData.append('correctAnswer', questionForm.correctAnswer || '');
      } else if (questionForm.type === 'true_false') {
        // Для true/false правильный ответ должен быть "True" или "False"
        formData.append('correctAnswer', questionForm.correctAnswer || 'True');
      } else {
        // Для text, phrase, image вопросов
        formData.append('correctAnswer', questionForm.correctAnswer || '');
      }

      if (questionForm.image) {
        formData.append('image', questionForm.image);
      }

      await axios.post('/questions/admin', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Вопрос успешно создан');
      setShowCreateModal(false);
      resetForm();
      fetchQuestions();
    } catch (error: any) {
      console.error('Error creating question:', error);
      toast.error(error.response?.data?.message || 'Не удалось создать вопрос');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditQuestion = async () => {
    if (!selectedQuestion) return;

    if (!questionForm.title || !questionForm.description) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (questionForm.type === 'multiple_choice') {
      const nonEmptyOptions = questionForm.options.filter(opt => opt.trim());
      if (nonEmptyOptions.length < 2) {
        toast.error('Вопросы с вариантами ответа должны иметь минимум 2 варианта');
        return;
      }
      if (!questionForm.correctAnswer || !nonEmptyOptions.includes(questionForm.correctAnswer)) {
        toast.error('Правильный ответ должен быть одним из предложенных вариантов');
        return;
      }
    }

    if (questionForm.type === 'matching') {
      const nonEmptyPairs = questionForm.matchingPairs.filter(p => p.left.trim() && p.right.trim());
      if (nonEmptyPairs.length < 2) {
        toast.error('Вопросы на соединение должны иметь минимум 2 пары');
        return;
      }
      // Правильный ответ для matching вопросов генерируется автоматически
    } else if (questionForm.type === 'true_false') {
      if (!questionForm.correctAnswer || (questionForm.correctAnswer !== 'True' && questionForm.correctAnswer !== 'False')) {
        toast.error('Для вопросов True/False выберите правильный ответ: True или False');
        return;
      }
    } else if (!questionForm.correctAnswer || questionForm.correctAnswer.trim() === '') {
      toast.error('Пожалуйста, укажите правильный ответ');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('title', questionForm.title);
      formData.append('description', questionForm.description);
      formData.append('type', questionForm.type);
      formData.append('points', questionForm.points.toString());
      formData.append('difficulty', questionForm.difficulty);
      formData.append('category', questionForm.category);

      // Обработка правильного ответа в зависимости от типа вопроса
      if (questionForm.type === 'matching' && questionForm.matchingPairs) {
        const nonEmptyPairs = questionForm.matchingPairs.filter(p => p.left.trim() && p.right.trim());
        formData.append('matchingPairs', JSON.stringify(nonEmptyPairs));
        // Для matching вопросов правильный ответ - это JSON объект с индексами и правыми значениями
        const correctAnswerObj: Record<number, string> = {};
        nonEmptyPairs.forEach((pair, index) => {
          correctAnswerObj[index] = pair.right;
        });
        formData.append('correctAnswer', JSON.stringify(correctAnswerObj));
      } else if (questionForm.type === 'multiple_choice' && questionForm.options) {
        const nonEmptyOptions = questionForm.options.filter(opt => opt.trim());
        formData.append('options', JSON.stringify(nonEmptyOptions));
        formData.append('correctAnswer', questionForm.correctAnswer || '');
      } else if (questionForm.type === 'true_false') {
        // Для true/false правильный ответ должен быть "True" или "False"
        formData.append('correctAnswer', questionForm.correctAnswer || 'True');
      } else {
        // Для text, phrase, image вопросов
        formData.append('correctAnswer', questionForm.correctAnswer || '');
      }

      if (questionForm.image) {
        formData.append('image', questionForm.image);
      }

      await axios.put(`/questions/admin/${selectedQuestion.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Вопрос успешно обновлен');
      setShowEditModal(false);
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (error: any) {
      console.error('Error updating question:', error);
      toast.error(error.response?.data?.message || 'Не удалось обновить вопрос');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm('Вы уверены, что хотите полностью удалить этот вопрос? Это действие нельзя отменить.')) return;
    
    try {
      await axios.delete(`/questions/admin/${questionId}`);
      toast.success('Вопрос успешно удален');
      fetchQuestions();
    } catch (error: any) {
      console.error('Error deleting question:', error);
      toast.error(error.response?.data?.message || 'Не удалось удалить вопрос');
    }
  };

  const openEditModal = (question: Question) => {
    setSelectedQuestion(question);
    setQuestionForm({
      title: question.title,
      description: question.description,
      type: question.type,
      options: question.options || ['', '', '', ''],
      matchingPairs: question.matchingPairs && question.matchingPairs.length > 0 
        ? question.matchingPairs 
        : [{ left: '', right: '' }, { left: '', right: '' }],
      correctAnswer: question.correctAnswer,
      points: question.points,
      difficulty: question.difficulty,
      category: question.category,
      image: null
    });
    setShowEditModal(true);
  };

  const addOption = () => {
    setQuestionForm({
      ...questionForm,
      options: [...questionForm.options, '']
    });
  };

  const removeOption = (index: number) => {
    if (questionForm.options.length <= 2) return;
    const newOptions = questionForm.options.filter((_, i) => i !== index);
    setQuestionForm({
      ...questionForm,
      options: newOptions,
      correctAnswer: newOptions.includes(questionForm.correctAnswer) ? questionForm.correctAnswer : ''
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...questionForm.options];
    newOptions[index] = value;
    setQuestionForm({
      ...questionForm,
      options: newOptions
    });
  };

  const addMatchingPair = () => {
    setQuestionForm({
      ...questionForm,
      matchingPairs: [...questionForm.matchingPairs, { left: '', right: '' }]
    });
  };

  const removeMatchingPair = (index: number) => {
    if (questionForm.matchingPairs.length <= 2) return;
    const newPairs = questionForm.matchingPairs.filter((_, i) => i !== index);
    setQuestionForm({
      ...questionForm,
      matchingPairs: newPairs
    });
  };

  const updateMatchingPair = (index: number, field: 'left' | 'right', value: string) => {
    const newPairs = [...questionForm.matchingPairs];
    newPairs[index] = { ...newPairs[index], [field]: value };
    setQuestionForm({
      ...questionForm,
      matchingPairs: newPairs
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'hard': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const filteredQuestions = questions.filter(question =>
    question.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  Question Management
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
              Question Management
            </h1>
            <p className="text-gray-400 text-lg">Create and manage learning questions</p>
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
            <span>Add Question</span>
          </motion.button>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-cyber pl-10 w-full"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-cyber min-w-40"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value)}
              className="input-cyber min-w-32"
            >
              <option value="all">All Levels</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-cyber min-w-32"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </motion.div>

        {/* Questions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Questions Found</h3>
              <p className="text-gray-400">Try adjusting your search terms or create a new question.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className={`glass rounded-xl p-6 border transition-all ${
                    question.isActive 
                      ? 'border-gray-600 hover:border-red-500/40' 
                      : 'border-gray-700 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-2">{question.title}</h3>
                          
                          <div className="flex items-center space-x-4 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(question.difficulty)}`}>
                              {question.difficulty}
                            </span>
                            <span className="text-red-400 font-medium capitalize">{question.category}</span>
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded border border-purple-500/30">
                              {question.type === 'multiple_choice' ? 'Выбор' :
                               question.type === 'true_false' ? 'Правда/Ложь' :
                               question.type === 'matching' ? 'Соединение' :
                               question.type === 'image' ? 'С картинкой' :
                               question.type === 'phrase' ? 'Фраза' : 'Текст'}
                            </span>
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Coins className="w-4 h-4" />
                              <span className="font-medium">{question.points} pts</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              question.isActive 
                                ? 'bg-green-400/20 text-green-400' 
                                : 'bg-red-400/20 text-red-400'
                            }`}>
                              {question.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-4 line-clamp-2">{question.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{question.submissionCount} submissions</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>{question.correctSubmissions} correct</span>
                          </div>
                          {question.submissionCount > 0 && (
                            <div className="flex items-center space-x-1">
                              <TrendingUp className="w-3 h-3" />
                              <span>{Math.round((question.correctSubmissions / question.submissionCount) * 100)}% accuracy</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(question.createdAt).toLocaleDateString()}</span>
                          </div>
                          {question.createdByName && (
                            <span>by {question.createdByName}</span>
                          )}
                        </div>

                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => router.push(`/questions/${question.id}`)}
                            className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                            title="Preview Question"
                          >
                            <Eye className="w-4 h-4" />
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(question)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Edit Question"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          
                          {question.isActive && (
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteQuestion(question.id);
                              }}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Удалить вопрос"
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      </div>
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

      {/* Create/Edit Question Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                {showCreateModal ? 'Создать новый вопрос' : 'Редактировать вопрос'}
              </h3>
              
              <div className="space-y-4 mb-6">
                {/* Title */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Название вопроса *
                  </label>
                  <input
                    type="text"
                    value={questionForm.title}
                    onChange={(e) => setQuestionForm({ ...questionForm, title: e.target.value })}
                    className="input-cyber w-full"
                    placeholder="Введите название вопроса"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Описание вопроса *
                  </label>
                  <textarea
                    value={questionForm.description}
                    onChange={(e) => setQuestionForm({ ...questionForm, description: e.target.value })}
                    className="input-cyber w-full h-24 resize-none"
                    placeholder="Опишите вопрос подробно"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Type */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Тип вопроса
                    </label>
                    <select
                      value={questionForm.type}
                      onChange={(e) => setQuestionForm({ ...questionForm, type: e.target.value })}
                      className="input-cyber w-full"
                    >
                      {questionTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Points */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Баллы
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={questionForm.points}
                      onChange={(e) => setQuestionForm({ ...questionForm, points: parseInt(e.target.value) || 10 })}
                      className="input-cyber w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Сложность
                    </label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      className="input-cyber w-full"
                    >
                      {difficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty === 'easy' ? 'Легкая' : difficulty === 'medium' ? 'Средняя' : 'Сложная'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Категория
                    </label>
                    <input
                      type="text"
                      list="categories"
                      value={questionForm.category}
                      onChange={(e) => setQuestionForm({ ...questionForm, category: e.target.value })}
                      className="input-cyber w-full"
                      placeholder="Введите категорию или выберите из списка"
                    />
                    <datalist id="categories">
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </datalist>
                  </div>
                </div>

                {/* Options for Multiple Choice */}
                {questionForm.type === 'multiple_choice' && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Варианты ответа *
                    </label>
                    <div className="space-y-2">
                      {questionForm.options.map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            className="input-cyber flex-1"
                            placeholder={`Вариант ${index + 1}`}
                          />
                          {questionForm.options.length > 2 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeOption(index)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      ))}
                      {questionForm.options.length < 6 && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={addOption}
                          className="w-full py-2 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-purple-500 hover:text-purple-400 transition-colors"
                        >
                          + Добавить вариант
                        </motion.button>
                      )}
                    </div>
                  </div>
                )}

                {/* Matching Pairs for Matching Questions */}
                {questionForm.type === 'matching' && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Пары для соединения *
                    </label>
                    <div className="space-y-3">
                      {questionForm.matchingPairs.map((pair, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={pair.left}
                            onChange={(e) => updateMatchingPair(index, 'left', e.target.value)}
                            className="input-cyber flex-1"
                            placeholder={`Левое значение ${index + 1}`}
                          />
                          <span className="text-gray-400">→</span>
                          <input
                            type="text"
                            value={pair.right}
                            onChange={(e) => updateMatchingPair(index, 'right', e.target.value)}
                            className="input-cyber flex-1"
                            placeholder={`Правое значение ${index + 1}`}
                          />
                          {questionForm.matchingPairs.length > 2 && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => removeMatchingPair(index)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </motion.button>
                          )}
                        </div>
                      ))}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={addMatchingPair}
                        className="w-full py-2 border-2 border-dashed border-gray-600 text-gray-400 rounded-lg hover:border-purple-500 hover:text-purple-400 transition-colors"
                      >
                        + Добавить пару
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Image Upload for Image Questions */}
                {questionForm.type === 'image' && (
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Изображение *
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setQuestionForm({ ...questionForm, image: file });
                        }
                      }}
                      className="input-cyber w-full"
                    />
                    {questionForm.image && (
                      <div className="mt-2">
                        <p className="text-gray-400 text-sm">Выбранный файл: {questionForm.image.name}</p>
                      </div>
                    )}
                    {selectedQuestion?.imageUrl && !questionForm.image && (
                      <div className="mt-2">
                        <p className="text-gray-400 text-sm">Текущее изображение:</p>
                        <img 
                          src={`http://localhost:5000${selectedQuestion.imageUrl}`} 
                          alt="Current" 
                          className="mt-2 max-w-xs rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Правильный ответ *
                  </label>
                  {questionForm.type === 'multiple_choice' ? (
                    <select
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="input-cyber w-full"
                    >
                      <option value="">Выберите правильный ответ</option>
                      {questionForm.options.filter(opt => opt.trim()).map((option, index) => (
                        <option key={index} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : questionForm.type === 'true_false' ? (
                    <select
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="input-cyber w-full"
                    >
                      <option value="">Выберите правильный ответ</option>
                      <option value="True">True (Правда)</option>
                      <option value="False">False (Ложь)</option>
                    </select>
                  ) : questionForm.type === 'matching' ? (
                    <div className="space-y-2">
                      <p className="text-gray-400 text-sm">
                        Правильный ответ автоматически генерируется на основе пар. Каждая левая часть должна быть соединена с соответствующей правой частью.
                      </p>
                      <div className="bg-dark-800/50 rounded-lg p-3">
                        {questionForm.matchingPairs.filter(p => p.left.trim() && p.right.trim()).map((pair, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm mb-2 last:mb-0">
                            <span className="text-white">{pair.left}</span>
                            <span className="text-gray-500">→</span>
                            <span className="text-green-400">{pair.right}</span>
                          </div>
                        ))}
                      </div>
                      <input type="hidden" value={questionForm.correctAnswer || ''} />
                    </div>
                  ) : (
                    <textarea
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      className="input-cyber w-full h-20 resize-none"
                      placeholder="Введите правильный ответ или ожидаемый ответ"
                    />
                  )}
                </div>
              </div>

              <div className="flex space-x-3">
                {showEditModal && selectedQuestion && (
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (confirm('Вы уверены, что хотите полностью удалить этот вопрос? Это действие нельзя отменить.')) {
                        handleDeleteQuestion(selectedQuestion.id);
                        setShowEditModal(false);
                        setSelectedQuestion(null);
                      }
                    }}
                    className="px-6 py-3 bg-red-500 text-white font-semibold rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Удалить</span>
                  </motion.button>
                )}
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    showCreateModal ? handleCreateQuestion() : handleEditQuestion();
                  }}
                  disabled={isSaving}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg btn-cyber disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isSaving ? (
                    <>
                      <div className="loading-spinner w-5 h-5" />
                      <span>{showCreateModal ? 'Создание...' : 'Сохранение...'}</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>{showCreateModal ? 'Создать вопрос' : 'Сохранить изменения'}</span>
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedQuestion(null);
                  }}
                  className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Отмена
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
