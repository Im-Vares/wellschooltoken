import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  LogOut,
  ArrowLeft,
  User,
  Calendar,
  Coins,
  Eye,
  MessageSquare,
  Filter,
  Search,
  Star,
  AlertCircle
} from 'lucide-react';

interface Submission {
  id: number;
  username: string;
  userFullName: string;
  email: string;
  title: string;
  description: string;
  userAnswer: string;
  correctAnswer: string;
  points: number;
  type: string;
  options?: string[];
  submittedAt: string;
  status: string;
  reviewedByName?: string;
  category: string;
  difficulty: string;
  questionId: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ReviewData {
  isCorrect: boolean;
  tokensAwarded: number;
  feedback: string;
}

export default function AdminSubmissions() {
  const { admin, logout } = useAuth();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData>({
    isCorrect: false,
    tokensAwarded: 0,
    feedback: ''
  });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  useEffect(() => {
    if (!admin) {
      router.push('/admin/login');
      return;
    }
    fetchSubmissions();
  }, [admin, router, pagination.page, statusFilter]);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const response = await axios.get(`/admin/submissions?${params}`);
      setSubmissions(response.data.submissions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewModal = (submission: Submission) => {
    setSelectedSubmission(submission);
    setReviewData({
      isCorrect: false,
      tokensAwarded: submission.points,
      feedback: ''
    });
    setShowReviewModal(true);
  };

  const handleReviewSubmission = async () => {
    if (!selectedSubmission || isReviewing) return;

    setIsReviewing(true);
    try {
      await axios.post(`/admin/submissions/${selectedSubmission.id}/review`, reviewData);
      toast.success('Submission reviewed successfully');
      setShowReviewModal(false);
      setSelectedSubmission(null);
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error reviewing submission:', error);
      toast.error(error.response?.data?.message || 'Failed to review submission');
    } finally {
      setIsReviewing(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'reviewed': return <CheckCircle className="w-5 h-5 text-green-400" />;
      default: return <FileText className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-400/20 border-yellow-400/30';
      case 'reviewed': return 'text-green-400 bg-green-400/20 border-green-400/30';
      default: return 'text-gray-400 bg-gray-400/20 border-gray-400/30';
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
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-cyber font-bold text-white">
                  Submission Review
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
          className="mb-8"
        >
          <h1 className="text-4xl font-cyber font-bold text-white mb-2">
            Submission Review
          </h1>
          <p className="text-gray-400 text-lg">Review and grade student submissions</p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-xl p-6 mb-8"
        >
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-red-400" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination({ ...pagination, page: 1 });
              }}
              className="input-cyber min-w-40"
            >
              <option value="all">All Submissions</option>
              <option value="pending">Pending Review</option>
              <option value="reviewed">Reviewed</option>
            </select>
            
            <div className="flex-1 flex justify-end">
              <div className="text-gray-400 text-sm">
                Total: {pagination.total} submissions
                {statusFilter === 'pending' && (
                  <span className="ml-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                    {submissions.filter(s => s.status === 'pending').length} pending
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Submissions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-12 h-12" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Submissions Found</h3>
              <p className="text-gray-400">
                {statusFilter === 'pending' ? 'No pending submissions to review.' : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission, index) => (
                <motion.div
                  key={submission.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ scale: 1.01 }}
                  className={`glass rounded-xl p-6 border transition-all ${
                    submission.status === 'pending'
                      ? 'border-yellow-500/30 glow-yellow'
                      : 'border-gray-600 hover:border-red-500/40'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getStatusIcon(submission.status)}
                            <h3 className="text-xl font-bold text-white">{submission.title}</h3>
                          </div>
                          
                          <div className="flex items-center space-x-4 mb-3">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(submission.difficulty)}`}>
                              {submission.difficulty}
                            </span>
                            <span className="text-red-400 font-medium">{submission.category}</span>
                            <div className="flex items-center space-x-1 text-yellow-400">
                              <Coins className="w-4 h-4" />
                              <span className="font-medium">{submission.points} points</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(submission.status)}`}>
                              {submission.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Student Info */}
                      <div className="flex items-center space-x-3 mb-4 p-3 bg-dark-700/30 rounded-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <div className="text-white font-semibold">{submission.userFullName}</div>
                          <div className="text-gray-400 text-sm">@{submission.username} • {submission.email}</div>
                        </div>
                        <div className="ml-auto flex items-center space-x-1 text-gray-400 text-sm">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(submission.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Question */}
                      <div className="mb-4 p-4 bg-dark-700/50 rounded-lg">
                        <h4 className="text-white font-semibold mb-2">Question:</h4>
                        <p className="text-gray-300 mb-3">{submission.description}</p>
                        
                        {submission.type === 'multiple_choice' && submission.options && (
                          <div className="mt-3">
                            <p className="text-gray-400 text-sm mb-2">Options:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {submission.options.map((option, idx) => (
                                <li 
                                  key={idx} 
                                  className={`text-sm ${
                                    option === submission.correctAnswer 
                                      ? 'text-green-400 font-semibold' 
                                      : 'text-gray-300'
                                  }`}
                                >
                                  {option}
                                  {option === submission.correctAnswer && (
                                    <span className="ml-2 text-green-400">✓ Correct</span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Student Answer */}
                      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                        <h4 className="text-blue-400 font-semibold mb-2">Student Answer:</h4>
                        <p className="text-gray-300">{submission.userAnswer}</p>
                      </div>

                      {/* Correct Answer */}
                      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <h4 className="text-green-400 font-semibold mb-2">Expected Answer:</h4>
                        <p className="text-gray-300">{submission.correctAnswer}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          {submission.reviewedByName && (
                            <span>Reviewed by: {submission.reviewedByName}</span>
                          )}
                        </div>
                        
                        <div className="flex space-x-2">
                          {submission.status === 'pending' && (
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openReviewModal(submission)}
                              className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-lg btn-cyber"
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Review</span>
                            </motion.button>
                          )}
                          
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => router.push(`/questions/${submission.questionId}`)}
                            className="flex items-center space-x-2 px-4 py-2 bg-dark-700 text-white font-semibold rounded-lg hover:bg-dark-600 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                            <span>View Question</span>
                          </motion.button>
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

      {/* Review Modal */}
      <AnimatePresence>
        {showReviewModal && selectedSubmission && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="glass rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-2xl font-bold text-white mb-6">Review Submission</h3>
              
              {/* Question & Answer Summary */}
              <div className="space-y-4 mb-6">
                <div className="p-4 bg-dark-700/50 rounded-lg">
                  <h4 className="text-white font-semibold mb-2">Question: {selectedSubmission.title}</h4>
                  <p className="text-gray-300 text-sm mb-3">{selectedSubmission.description}</p>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(selectedSubmission.difficulty)}`}>
                      {selectedSubmission.difficulty}
                    </span>
                    <Coins className="w-4 h-4 text-yellow-400" />
                    <span className="text-yellow-400 text-sm">{selectedSubmission.points} points</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <h4 className="text-blue-400 font-semibold mb-2">Student Answer:</h4>
                    <p className="text-gray-300 text-sm">{selectedSubmission.userAnswer}</p>
                  </div>

                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <h4 className="text-green-400 font-semibold mb-2">Expected Answer:</h4>
                    <p className="text-gray-300 text-sm">{selectedSubmission.correctAnswer}</p>
                  </div>
                </div>
              </div>

              {/* Review Form */}
              <div className="space-y-6 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Is Answer Correct?</label>
                    <div className="flex space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setReviewData({ 
                          ...reviewData, 
                          isCorrect: true,
                          tokensAwarded: selectedSubmission.points 
                        })}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                          reviewData.isCorrect 
                            ? 'bg-green-500 text-white' 
                            : 'bg-dark-700 text-gray-300 hover:bg-green-500/20'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5 mx-auto mb-1" />
                        Correct
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setReviewData({ 
                          ...reviewData, 
                          isCorrect: false,
                          tokensAwarded: 0 
                        })}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                          !reviewData.isCorrect 
                            ? 'bg-red-500 text-white' 
                            : 'bg-dark-700 text-gray-300 hover:bg-red-500/20'
                        }`}
                      >
                        <XCircle className="w-5 h-5 mx-auto mb-1" />
                        Incorrect
                      </motion.button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-300 text-sm font-medium mb-2">Tokens to Award</label>
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
                    <p className="text-xs text-gray-500 mt-1">Max: {selectedSubmission.points} points</p>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    Feedback for Student (optional)
                  </label>
                  <textarea
                    value={reviewData.feedback}
                    onChange={(e) => setReviewData({ ...reviewData, feedback: e.target.value })}
                    className="input-cyber w-full h-24 resize-none"
                    placeholder="Provide constructive feedback to help the student learn..."
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReviewSubmission}
                  disabled={isReviewing}
                  className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold rounded-lg btn-cyber disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {isReviewing ? (
                    <>
                      <div className="loading-spinner w-5 h-5" />
                      <span>Submitting Review...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Submit Review</span>
                    </>
                  )}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowReviewModal(false)}
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
