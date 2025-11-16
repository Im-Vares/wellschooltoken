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
  ArrowLeft,
  Search,
  Eye,
  Coins,
  Calendar,
  Users,
  CheckCircle,
  X,
  Save,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { Assignment, Question } from '../../types';

interface AssignmentForm {
  title: string;
  description: string;
  difficulty: string;
  category: string;
  questionIds: number[];
}

export default function AdminAssignments() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [assignmentForm, setAssignmentForm] = useState<AssignmentForm>({
    title: '',
    description: '',
    difficulty: 'easy',
    category: 'general',
    questionIds: []
  });

  const difficulties = ['easy', 'medium', 'hard'];
  const categories = ['programming', 'react', 'javascript', 'general', 'reflection', 'math', 'science'];

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    fetchAssignments();
    fetchAllQuestions();
  }, [admin, router]);

  const fetchAssignments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/assignments/admin/all');
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Не удалось загрузить задания');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllQuestions = async () => {
    try {
      const response = await axios.get('/questions/admin/all?limit=1000');
      setQuestions(response.data.questions.filter((q: Question) => q.isActive));
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  };

  const resetForm = () => {
    setAssignmentForm({
      title: '',
      description: '',
      difficulty: 'easy',
      category: 'general',
      questionIds: []
    });
  };

  const handleCreateAssignment = async () => {
    if (!assignmentForm.title || !assignmentForm.description) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (assignmentForm.questionIds.length === 0) {
      toast.error('Выберите хотя бы один вопрос');
      return;
    }

    setIsSaving(true);
    try {
      await axios.post('/assignments/admin', assignmentForm);
      toast.success('Задание успешно создано');
      setShowCreateModal(false);
      resetForm();
      fetchAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error(error.response?.data?.message || 'Не удалось создать задание');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditAssignment = async () => {
    if (!selectedAssignment) return;

    if (!assignmentForm.title || !assignmentForm.description) {
      toast.error('Пожалуйста, заполните все обязательные поля');
      return;
    }

    if (assignmentForm.questionIds.length === 0) {
      toast.error('Выберите хотя бы один вопрос');
      return;
    }

    setIsSaving(true);
    try {
      await axios.put(`/assignments/admin/${selectedAssignment.id}`, assignmentForm);
      toast.success('Задание успешно обновлено');
      setShowEditModal(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      toast.error(error.response?.data?.message || 'Не удалось обновить задание');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId: number) => {
    if (!confirm('Вы уверены, что хотите деактивировать это задание?')) return;
    
    try {
      await axios.delete(`/assignments/admin/${assignmentId}`);
      toast.success('Задание успешно деактивировано');
      fetchAssignments();
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      toast.error(error.response?.data?.message || 'Не удалось деактивировать задание');
    }
  };

  const openEditModal = async (assignment: Assignment) => {
    try {
      const response = await axios.get(`/assignments/admin/${assignment.id}`);
      const assignmentData = response.data.assignment;
      setSelectedAssignment(assignmentData);
      setAssignmentForm({
        title: assignmentData.title,
        description: assignmentData.description,
        difficulty: assignmentData.difficulty,
        category: assignmentData.category,
        questionIds: assignmentData.questions?.map((q: Question) => q.id) || []
      });
      setShowEditModal(true);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      toast.error('Не удалось загрузить задание');
    }
  };

  const toggleQuestion = (questionId: number) => {
    setAssignmentForm(prev => {
      const isSelected = prev.questionIds.includes(questionId);
      return {
        ...prev,
        questionIds: isSelected
          ? prev.questionIds.filter(id => id !== questionId)
          : [...prev.questionIds, questionId]
      };
    });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === assignmentForm.questionIds.length - 1) return;

    const newIds = [...assignmentForm.questionIds];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newIds[index], newIds[newIndex]] = [newIds[newIndex], newIds[index]];
    setAssignmentForm({ ...assignmentForm, questionIds: newIds });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400 bg-green-400/20 border-green-400/30';
      case 'medium': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'hard': return 'text-red-400 bg-red-400/20 border-red-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
    }
  };

  const filteredAssignments = assignments.filter(assignment =>
    assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    assignment.description.toLowerCase().includes(searchTerm.toLowerCase())
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
                <span>Назад в админ-панель</span>
              </motion.button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  Управление заданиями
                </span>
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
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-4xl font-cyber font-bold text-white mb-2">
              Управление заданиями
            </h1>
            <p className="text-gray-400 text-lg">Создавайте задания с несколькими вопросами</p>
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
            <span>Создать задание</span>
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
                placeholder="Поиск заданий..."
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
              <option value="all">Все категории</option>
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
              <option value="all">Все уровни</option>
              {difficulties.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Assignments List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Задания не найдены</h3>
              <p className="text-gray-400">Создайте новое задание или измените фильтры поиска.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment, index) => (
                <motion.div
                  key={assignment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className="glass rounded-xl p-6 border border-gray-600 hover:border-red-500/40 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{assignment.title}</h3>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(assignment.difficulty)}`}>
                          {assignment.difficulty}
                        </span>
                        <span className="text-red-400 font-medium capitalize">{assignment.category}</span>
                        <div className="flex items-center space-x-1 text-yellow-400">
                          <Coins className="w-4 h-4" />
                          <span className="font-medium">{assignment.totalPoints} баллов</span>
                        </div>
                        <div className="flex items-center space-x-1 text-blue-400">
                          <BookOpen className="w-4 h-4" />
                          <span className="font-medium">{assignment.questionCount || 0} вопросов</span>
                        </div>
                      </div>

                      <p className="text-gray-300 mb-4">{assignment.description}</p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6 text-sm text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{(assignment.submissionCount || assignment.submittedCount || 0)} попыток</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(assignment.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(assignment)}
                            className="p-2 text-green-400 hover:text-green-300 hover:bg-green-500/20 rounded-lg transition-colors"
                            title="Редактировать"
                          >
                            <Edit className="w-4 h-4" />
                          </motion.button>
                          
                          {assignment.isActive && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteAssignment(assignment.id)}
                              className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Деактивировать"
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
      </div>

      {/* Create/Edit Assignment Modal */}
      <AnimatePresence>
        {(showCreateModal || showEditModal) && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                {showCreateModal ? 'Создать новое задание' : 'Редактировать задание'}
              </h3>
              
              <div className="space-y-4 mb-6">
                {/* Title */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Название задания *
                  </label>
                  <input
                    type="text"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    className="input-cyber w-full"
                    placeholder="Введите название задания"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Описание задания *
                  </label>
                  <textarea
                    value={assignmentForm.description}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                    className="input-cyber w-full h-24 resize-none"
                    placeholder="Опишите задание"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Difficulty */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Сложность
                    </label>
                    <select
                      value={assignmentForm.difficulty}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, difficulty: e.target.value })}
                      className="input-cyber w-full"
                    >
                      {difficulties.map((difficulty) => (
                        <option key={difficulty} value={difficulty}>
                          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">
                      Категория
                    </label>
                    <select
                      value={assignmentForm.category}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, category: e.target.value })}
                      className="input-cyber w-full"
                    >
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Questions Selection */}
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Выберите вопросы * ({assignmentForm.questionIds.length} выбрано)
                  </label>
                  <div className="max-h-64 overflow-y-auto space-y-2 border border-gray-600 rounded-lg p-4">
                    {questions.map((question) => {
                      const isSelected = assignmentForm.questionIds.includes(question.id);
                      const selectedIndex = assignmentForm.questionIds.indexOf(question.id);
                      return (
                        <div
                          key={question.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? 'border-green-500 bg-green-500/10'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleQuestion(question.id)}
                            className="w-4 h-4 text-green-500"
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-white font-medium">{question.title}</span>
                              <span className="text-gray-400 text-sm">({question.type})</span>
                              <span className="text-yellow-400 text-sm">{question.points} баллов</span>
                            </div>
                            <p className="text-gray-400 text-sm line-clamp-1">{question.description}</p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center space-x-1">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(selectedIndex, 'up');
                                }}
                                disabled={selectedIndex === 0}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </motion.button>
                              <span className="text-gray-400 text-sm">{selectedIndex + 1}</span>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveQuestion(selectedIndex, 'down');
                                }}
                                disabled={selectedIndex === assignmentForm.questionIds.length - 1}
                                className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </motion.button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={showCreateModal ? handleCreateAssignment : handleEditAssignment}
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
                      <span>{showCreateModal ? 'Создать задание' : 'Сохранить изменения'}</span>
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowCreateModal(false);
                    setShowEditModal(false);
                    setSelectedAssignment(null);
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

