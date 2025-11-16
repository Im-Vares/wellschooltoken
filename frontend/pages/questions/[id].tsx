import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Coins,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Zap,
  Star,
  Trophy,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

interface Question {
  id: number;
  title: string;
  description: string;
  type: string;
  options?: string[];
  matchingPairs?: Array<{ left: string; right: string }>;
  imageUrl?: string;
  points: number;
  difficulty: string;
  category: string;
  hasSubmitted: boolean;
  submissionCorrect?: boolean;
  submissionStatus?: string;
  tokensAwarded?: number;
  submittedAt?: string;
  userAnswer?: string;
  feedback?: string;
  correctAnswer?: string;
}

export default function QuestionDetail() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedTrueFalse, setSelectedTrueFalse] = useState('');
  const [matchingSelections, setMatchingSelections] = useState<Record<number, string>>({});
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchQuestion();
    }
  }, [user, router, id]);

  const fetchQuestion = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/questions/${id}`);
      const questionData = response.data.question;
      
      // Parse matchingPairs if it's a string
      if (questionData.matchingPairs && typeof questionData.matchingPairs === 'string') {
        try {
          questionData.matchingPairs = JSON.parse(questionData.matchingPairs);
        } catch (e) {
          console.error('Error parsing matchingPairs:', e);
          questionData.matchingPairs = [];
        }
      }
      
      // Parse options if it's a string
      if (questionData.options && typeof questionData.options === 'string') {
        try {
          questionData.options = JSON.parse(questionData.options);
        } catch (e) {
          console.error('Error parsing options:', e);
          questionData.options = [];
        }
      }
      
      setQuestion(questionData);
      
      // Pre-fill answer if already submitted
      if (questionData.hasSubmitted && questionData.userAnswer) {
        if (questionData.type === 'multiple_choice') {
          setSelectedOption(questionData.userAnswer);
        } else if (questionData.type === 'true_false') {
          setSelectedTrueFalse(questionData.userAnswer);
        } else if (questionData.type === 'matching') {
          try {
            const parsed = JSON.parse(questionData.userAnswer);
            setMatchingSelections(parsed);
          } catch {
            setAnswer(questionData.userAnswer);
          }
        } else {
          setAnswer(questionData.userAnswer);
        }
      }
    } catch (error) {
      console.error('Error fetching question:', error);
      toast.error('Failed to load question');
      router.push('/questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    let userAnswer = '';
    
    if (question?.type === 'multiple_choice') {
      userAnswer = selectedOption;
    } else if (question?.type === 'true_false') {
      userAnswer = selectedTrueFalse;
    } else if (question?.type === 'matching') {
      userAnswer = JSON.stringify(matchingSelections);
    } else {
      userAnswer = answer;
    }
    
    if (!userAnswer.trim()) {
      toast.error('Пожалуйста, предоставьте ответ');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await axios.post('/users/submissions', {
        questionId: question?.id,
        answer: userAnswer
      });

      toast.success(response.data.message);
      
      // Show confetti animation
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      // Refresh question data
      await fetchQuestion();
      
      // Refresh user data to update token balance
      if (user) {
        await refreshUser();
      }
      
    } catch (error: any) {
      console.error('Error submitting answer:', error);
      toast.error(error.response?.data?.message || 'Failed to submit answer');
    } finally {
      setIsSubmitting(false);
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

  const getStatusIcon = () => {
    if (!question?.hasSubmitted) return null;
    
    if (question.submissionStatus === 'pending') {
      return <Clock className="w-6 h-6 text-yellow-400" />;
    } else if (question.submissionStatus === 'reviewed') {
      return question.submissionCorrect ? 
        <CheckCircle className="w-6 h-6 text-green-400" /> : 
        <XCircle className="w-6 h-6 text-red-400" />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (!question?.hasSubmitted) return null;
    
    if (question.submissionStatus === 'pending') {
      return {
        title: 'Answer Submitted!',
        message: 'Your answer is under review by our admin team.',
        color: 'text-yellow-400'
      };
    } else if (question.submissionStatus === 'reviewed') {
      if (question.submissionCorrect) {
        return {
          title: 'Correct Answer!',
          message: `Congratulations! You earned ${question.tokensAwarded} tokens.`,
          color: 'text-green-400'
        };
      } else {
        return {
          title: 'Incorrect Answer',
          message: 'Keep learning and try other questions!',
          color: 'text-red-400'
        };
      }
    }
    return null;
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 cyber-grid flex items-center justify-center">
        <div className="loading-spinner w-12 h-12" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-dark-900 cyber-grid flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Question Not Found</h2>
          <button
            onClick={() => router.push('/questions')}
            className="text-purple-400 hover:text-purple-300"
          >
            ← Back to Questions
          </button>
        </div>
      </div>
    );
  }

  const statusMessage = getStatusMessage();

  return (
    <div className="min-h-screen bg-dark-900 cyber-grid">
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: 0 }}
                animate={{ y: window.innerHeight + 100, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 3, ease: 'easeOut', delay: i * 0.1 }}
                className="absolute w-4 h-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="border-b border-purple-500/20 bg-dark-800/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/questions')}
              className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Questions</span>
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg px-4 py-2"
            >
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="font-bold text-white">{user?.tokenBalance || 0}</span>
              <span className="text-purple-400">tokens</span>
            </motion.div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Question Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-8 mb-8"
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-cyber font-bold text-white mb-4">
                {question.title}
              </h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(question.difficulty)}`}>
                  {question.difficulty}
                </span>
                <span className="text-purple-400 font-medium">{question.category}</span>
                <div className="flex items-center space-x-1 text-yellow-400">
                  <Coins className="w-5 h-5" />
                  <span className="font-medium">{question.points} points</span>
                </div>
              </div>
            </div>
            {getStatusIcon() && (
              <div className="flex items-center">
                {getStatusIcon()}
              </div>
            )}
          </div>

          <p className="text-gray-300 text-lg leading-relaxed mb-4">
            {question.description}
          </p>

          {/* Image for image questions */}
          {question.imageUrl && (
            <div className="mt-6">
              <img 
                src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5001'}${question.imageUrl}`}
                alt="Question image"
                className="max-w-full h-auto rounded-lg border border-purple-500/20"
              />
            </div>
          )}
        </motion.div>

        {/* Status Message */}
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass rounded-xl p-6 mb-8 border-l-4 ${
              statusMessage.color === 'text-green-400' ? 'border-green-400' :
              statusMessage.color === 'text-yellow-400' ? 'border-yellow-400' :
              'border-red-400'
            }`}
          >
            <div className="flex items-center space-x-3 mb-2">
              {getStatusIcon()}
              <h3 className={`text-xl font-bold ${statusMessage.color}`}>
                {statusMessage.title}
              </h3>
            </div>
            <p className="text-gray-300">{statusMessage.message}</p>
            
            {question.feedback && (
              <div className="mt-4 p-4 bg-dark-700/50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-purple-400 font-semibold">Admin Feedback:</span>
                </div>
                <p className="text-gray-300">{question.feedback}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Answer Form */}
        {!question.hasSubmitted ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Your Answer</h2>
            
            <form onSubmit={handleSubmit}>
              {question.type === 'multiple_choice' ? (
                <div className="space-y-3 mb-6">
                  {question.options?.map((option, index) => (
                    <motion.label
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedOption === option
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option}
                        checked={selectedOption === option}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="w-4 h-4 text-purple-500"
                      />
                      <span className="text-gray-300 font-medium">{option}</span>
                    </motion.label>
                  ))}
                </div>
              ) : question.type === 'true_false' ? (
                <div className="space-y-3 mb-6">
                  {['True', 'False'].map((option) => (
                    <motion.label
                      key={option}
                      whileHover={{ scale: 1.01 }}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-all ${
                        selectedTrueFalse === option
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-600 hover:border-purple-500/50 hover:bg-purple-500/5'
                      }`}
                    >
                      <input
                        type="radio"
                        name="trueFalse"
                        value={option}
                        checked={selectedTrueFalse === option}
                        onChange={(e) => setSelectedTrueFalse(e.target.value)}
                        className="w-4 h-4 text-purple-500"
                      />
                      <span className="text-gray-300 font-medium">{option}</span>
                    </motion.label>
                  ))}
                </div>
              ) : question.type === 'matching' && question.matchingPairs ? (
                <div className="space-y-4 mb-6">
                  <p className="text-gray-400 text-sm mb-4">Соедините левые элементы с правыми:</p>
                  {(() => {
                    // Ensure matchingPairs is an array
                    let pairs = question.matchingPairs;
                    if (typeof pairs === 'string') {
                      try {
                        pairs = JSON.parse(pairs);
                      } catch {
                        pairs = [];
                      }
                    }
                    if (!Array.isArray(pairs)) {
                      pairs = [];
                    }
                    
                    const rightOptions = pairs.map(p => p.right) || [];
                    
                    return pairs.map((pair: { left: string; right: string }, index: number) => (
                      <div key={index} className="flex items-center space-x-4 p-4 bg-dark-800/50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-white font-medium">{pair.left}</span>
                        </div>
                        <span className="text-gray-500">→</span>
                        <div className="flex-1">
                          <select
                            value={matchingSelections[index] || ''}
                            onChange={(e) => setMatchingSelections({ ...matchingSelections, [index]: e.target.value })}
                            className="input-cyber w-full"
                          >
                            <option value="">Выберите...</option>
                            {rightOptions.map((right, rightIndex) => (
                              <option key={rightIndex} value={right}>
                                {right}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <div className="mb-6">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Введите ваш ответ..."
                    rows={6}
                    className="input-cyber w-full h-32 resize-none"
                    required
                  />
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={
                  isSubmitting || 
                  (question.type === 'multiple_choice' && !selectedOption) ||
                  (question.type === 'true_false' && !selectedTrueFalse) ||
                  (question.type === 'matching' && Object.keys(matchingSelections).length === 0) ||
                  ((question.type === 'text' || question.type === 'phrase' || question.type === 'image') && !answer.trim())
                }
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg btn-cyber disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="loading-spinner w-5 h-5" />
                    <span>Отправка...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>Отправить ответ</span>
                  </>
                )}
              </motion.button>
            </form>
          </motion.div>
        ) : (
          /* Show submitted answer */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-xl p-8"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Ваш отправленный ответ</h2>
            <div className="bg-dark-700/50 rounded-lg p-4 mb-4">
              {question.type === 'matching' && question.matchingPairs ? (
                <div className="space-y-3">
                  {(() => {
                    try {
                      const parsed = JSON.parse(question.userAnswer || '{}');
                      let pairs = question.matchingPairs;
                      if (typeof pairs === 'string') {
                        pairs = JSON.parse(pairs);
                      }
                      if (!Array.isArray(pairs)) {
                        pairs = [];
                      }
                      return pairs.map((pair: { left: string; right: string }, index: number) => (
                        <div key={index} className="flex items-center space-x-4 p-3 bg-dark-800/50 rounded-lg">
                          <span className="text-white font-medium">{pair.left}</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-purple-400">{parsed[index] || 'Не выбрано'}</span>
                        </div>
                      ));
                    } catch {
                      return <p className="text-gray-300">{question.userAnswer}</p>;
                    }
                  })()}
                </div>
              ) : (
                <p className="text-gray-300">{question.userAnswer}</p>
              )}
            </div>
            
            {question.submissionStatus === 'reviewed' && question.correctAnswer && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <h3 className="text-green-400 font-semibold mb-2">Правильный ответ:</h3>
              {question.type === 'matching' && question.matchingPairs ? (
                <div className="space-y-2">
                  {(() => {
                    try {
                      const parsed = JSON.parse(question.correctAnswer);
                      let pairs = question.matchingPairs;
                      if (typeof pairs === 'string') {
                        pairs = JSON.parse(pairs);
                      }
                      if (!Array.isArray(pairs)) {
                        pairs = [];
                      }
                      return pairs.map((pair: { left: string; right: string }, index: number) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-300">{pair.left}</span>
                          <span className="text-gray-500">→</span>
                          <span className="text-green-400">{parsed[index] || pair.right}</span>
                        </div>
                      ));
                    } catch {
                      return <p className="text-gray-300">{question.correctAnswer}</p>;
                    }
                  })()}
                </div>
              ) : (
                  <p className="text-gray-300">{question.correctAnswer}</p>
                )}
              </div>
            )}

            <p className="text-gray-400 text-sm mt-4">
              Отправлено {question.submittedAt ? new Date(question.submittedAt).toLocaleDateString('ru-RU') : 'неизвестно'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
