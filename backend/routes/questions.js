const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/questions');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

// Get all questions (for users)
router.get('/', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;
  const category = req.query.category;
  const difficulty = req.query.difficulty;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let conditions = ['q.isActive = 1'];
  let params = [];

  if (category && category !== 'all') {
    conditions.push('q.category = ?');
    params.push(category);
  }

  if (difficulty && difficulty !== 'all') {
    conditions.push('q.difficulty = ?');
    params.push(difficulty);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get questions with submission status for current user
  db.all(`SELECT q.*, 
                 CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as hasSubmitted,
                 s.isCorrect as submissionCorrect,
                 s.status as submissionStatus,
                 s.tokensAwarded,
                 s.submittedAt
          FROM questions q
          LEFT JOIN submissions s ON q.id = s.questionId AND s.userId = ?
          ${whereClause}
          ORDER BY q.createdAt DESC
          LIMIT ? OFFSET ?`,
    [userId, ...params, limit, offset],
    (err, questions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Parse options and matchingPairs for questions
      questions.forEach(question => {
        if (question.options) {
          try {
            question.options = JSON.parse(question.options);
          } catch (e) {
            question.options = null;
          }
        }
        if (question.matchingPairs) {
          try {
            question.matchingPairs = JSON.parse(question.matchingPairs);
          } catch (e) {
            question.matchingPairs = null;
          }
        }
        // Don't send correct answer to users
        delete question.correctAnswer;
      });

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM questions q ${whereClause}`, params, (err, count) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          questions,
          pagination: {
            page,
            limit,
            total: count.total,
            totalPages: Math.ceil(count.total / limit)
          }
        });
      });
    }
  );
});

// Get question by ID (for users)
router.get('/:id', authMiddleware('user'), (req, res) => {
  const questionId = req.params.id;
  const userId = req.user.id;

  db.get(`SELECT q.*, 
                 CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as hasSubmitted,
                 s.isCorrect as submissionCorrect,
                 s.status as submissionStatus,
                 s.tokensAwarded,
                 s.submittedAt,
                 s.userAnswer,
                 s.feedback
          FROM questions q
          LEFT JOIN submissions s ON q.id = s.questionId AND s.userId = ?
          WHERE q.id = ? AND q.isActive = 1`,
    [userId, questionId], (err, question) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Parse options for multiple choice questions
    if (question.options) {
      try {
        question.options = JSON.parse(question.options);
      } catch (e) {
        question.options = null;
      }
    }

    // Parse matchingPairs for matching questions
    if (question.matchingPairs) {
      try {
        question.matchingPairs = JSON.parse(question.matchingPairs);
      } catch (e) {
        question.matchingPairs = null;
      }
    }

    // Don't send correct answer to users (unless they've already submitted)
    if (!question.hasSubmitted || question.submissionStatus === 'pending') {
      delete question.correctAnswer;
    }

    res.json({ question });
  });
});

// Get question categories
router.get('/meta/categories', authMiddleware('user'), (req, res) => {
  db.all('SELECT DISTINCT category FROM questions WHERE isActive = 1 ORDER BY category', 
    [], (err, categories) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const categoryList = categories.map(c => c.category);
    res.json({ categories: categoryList });
  });
});

// Get question difficulties
router.get('/meta/difficulties', authMiddleware('user'), (req, res) => {
  db.all('SELECT DISTINCT difficulty FROM questions WHERE isActive = 1 ORDER BY difficulty', 
    [], (err, difficulties) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const difficultyList = difficulties.map(d => d.difficulty);
    res.json({ difficulties: difficultyList });
  });
});

// Admin: Get all questions
router.get('/admin/all', authMiddleware('admin'), (req, res) => {
  const category = req.query.category;
  const difficulty = req.query.difficulty;
  const isActive = req.query.isActive;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  let conditions = [];
  let params = [];

  if (category && category !== 'all') {
    conditions.push('q.category = ?');
    params.push(category);
  }

  if (difficulty && difficulty !== 'all') {
    conditions.push('q.difficulty = ?');
    params.push(difficulty);
  }

  if (isActive !== undefined) {
    conditions.push('q.isActive = ?');
    params.push(isActive === 'true' ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  db.all(`SELECT q.*, a.fullName as createdByName,
                 COUNT(s.id) as submissionCount,
                 COUNT(CASE WHEN s.isCorrect = 1 THEN 1 END) as correctSubmissions
          FROM questions q
          LEFT JOIN admins a ON q.createdBy = a.id
          LEFT JOIN submissions s ON q.id = s.questionId
          ${whereClause}
          GROUP BY q.id
          ORDER BY q.createdAt DESC
          LIMIT ? OFFSET ?`,
    [...params, limit, offset],
    (err, questions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Parse options and matchingPairs for questions
      questions.forEach(question => {
        if (question.options) {
          try {
            question.options = JSON.parse(question.options);
          } catch (e) {
            question.options = null;
          }
        }
        if (question.matchingPairs) {
          try {
            question.matchingPairs = JSON.parse(question.matchingPairs);
          } catch (e) {
            question.matchingPairs = null;
          }
        }
      });

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM questions q ${whereClause}`, params, (err, count) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          questions,
          pagination: {
            page,
            limit,
            total: count.total,
            totalPages: Math.ceil(count.total / limit)
          }
        });
      });
    }
  );
});

// Admin: Get question by ID
router.get('/admin/:id', authMiddleware('admin'), (req, res) => {
  const questionId = req.params.id;

  db.get(`SELECT q.*, a.fullName as createdByName,
                 COUNT(s.id) as submissionCount,
                 COUNT(CASE WHEN s.isCorrect = 1 THEN 1 END) as correctSubmissions,
                 AVG(CASE WHEN s.isCorrect = 1 THEN 100.0 ELSE 0.0 END) as successRate
          FROM questions q
          LEFT JOIN admins a ON q.createdBy = a.id
          LEFT JOIN submissions s ON q.id = s.questionId
          WHERE q.id = ?
          GROUP BY q.id`,
    [questionId], (err, question) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Parse options and matchingPairs for questions
    if (question.options) {
      try {
        question.options = JSON.parse(question.options);
      } catch (e) {
        question.options = null;
      }
    }
    if (question.matchingPairs) {
      try {
        question.matchingPairs = JSON.parse(question.matchingPairs);
      } catch (e) {
        question.matchingPairs = null;
      }
    }

    question.successRate = Math.round(question.successRate || 0);

    res.json({ question });
  });
});

// Admin: Create new question
router.post('/admin', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Размер файла превышает 5MB' });
        }
        return res.status(400).json({ message: 'Ошибка загрузки файла: ' + err.message });
      }
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }
    next();
  });
}, [
  authMiddleware('admin'),
  body('title').isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('type').isIn(['multiple_choice', 'text', 'true_false', 'matching', 'phrase', 'image']).withMessage('Invalid question type'),
  body('correctAnswer').notEmpty().withMessage('Correct answer is required'),
  body('points').isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('category').isLength({ min: 2 }).withMessage('Category is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Remove uploaded file if validation fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ message: errorMessages });
  }

  const { title, description, type, options, correctAnswer, points, difficulty, category, matchingPairs } = req.body;
  const adminId = req.user.id;
  const imageUrl = req.file ? `/uploads/questions/${req.file.filename}` : null;

  // Parse JSON strings from FormData
  let parsedOptions = null;
  let parsedMatchingPairs = null;

  if (options) {
    try {
      parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid options format' });
    }
  }

  if (matchingPairs) {
    try {
      parsedMatchingPairs = typeof matchingPairs === 'string' ? JSON.parse(matchingPairs) : matchingPairs;
    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid matching pairs format' });
    }
  }

  // Validate options for multiple choice questions
  if (type === 'multiple_choice') {
    if (!parsedOptions || !Array.isArray(parsedOptions) || parsedOptions.length < 2) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Multiple choice questions must have at least 2 options' });
    }
    
    if (!parsedOptions.includes(correctAnswer)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Correct answer must be one of the provided options' });
    }
  }

  // Validate matching pairs for matching questions
  if (type === 'matching') {
    if (!parsedMatchingPairs || !Array.isArray(parsedMatchingPairs) || parsedMatchingPairs.length < 2) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Вопросы на соединение должны иметь минимум 2 пары' });
    }
    
    // Валидация правильного ответа для matching вопросов
    try {
      const parsedCorrectAnswer = typeof correctAnswer === 'string' ? JSON.parse(correctAnswer) : correctAnswer;
      if (typeof parsedCorrectAnswer !== 'object' || Array.isArray(parsedCorrectAnswer)) {
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(400).json({ message: 'Правильный ответ для вопросов на соединение должен быть объектом' });
      }
      // Проверяем, что все индексы пар присутствуют в правильном ответе
      for (let i = 0; i < parsedMatchingPairs.length; i++) {
        if (!parsedCorrectAnswer.hasOwnProperty(i.toString()) && !parsedCorrectAnswer.hasOwnProperty(i)) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(400).json({ message: `Правильный ответ должен содержать соединение для пары ${i + 1}` });
        }
      }
    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Неверный формат правильного ответа для вопроса на соединение' });
    }
  }

  // Validate image for image questions
  if (type === 'image' && !imageUrl) {
    return res.status(400).json({ message: 'Для вопросов с изображением необходимо загрузить файл' });
  }

  const optionsJson = parsedOptions ? JSON.stringify(parsedOptions) : null;
  const matchingPairsJson = parsedMatchingPairs ? JSON.stringify(parsedMatchingPairs) : null;

  db.run(`INSERT INTO questions (title, description, type, options, correctAnswer, points, difficulty, category, imageUrl, matchingPairs, createdBy) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description, type, optionsJson, correctAnswer, points, difficulty, category, imageUrl, matchingPairsJson, adminId],
    function(err) {
      if (err) {
        console.error('Error creating question:', err);
        if (req.file) fs.unlinkSync(req.file.path);
        return res.status(500).json({ message: 'Ошибка при создании вопроса: ' + err.message });
      }

      res.status(201).json({
        message: 'Question created successfully',
        questionId: this.lastID
      });
    }
  );
});

// Admin: Update question
router.put('/admin/:id', (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ message: 'Размер файла превышает 5MB' });
        }
        return res.status(400).json({ message: 'Ошибка загрузки файла: ' + err.message });
      }
      return res.status(400).json({ message: err.message || 'Ошибка загрузки файла' });
    }
    next();
  });
}, [
  authMiddleware('admin'),
  body('title').optional().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('type').optional().isIn(['multiple_choice', 'text', 'true_false', 'matching', 'phrase', 'image']).withMessage('Invalid question type'),
  body('correctAnswer').optional().notEmpty().withMessage('Correct answer cannot be empty'),
  body('points').optional().isInt({ min: 1, max: 100 }).withMessage('Points must be between 1 and 100'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('category').optional().isLength({ min: 2 }).withMessage('Category must be at least 2 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    if (req.file) fs.unlinkSync(req.file.path);
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.status(400).json({ message: errorMessages });
  }

  const questionId = req.params.id;
  let { title, description, type, options, correctAnswer, points, difficulty, category, isActive, matchingPairs } = req.body;

  // Parse JSON strings from FormData if needed
  if (options && typeof options === 'string') {
    try {
      options = JSON.parse(options);
    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid options format' });
    }
  }

  if (matchingPairs && typeof matchingPairs === 'string') {
    try {
      matchingPairs = JSON.parse(matchingPairs);
    } catch (e) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Invalid matching pairs format' });
    }
  }

  // Get current question
  db.get('SELECT * FROM questions WHERE id = ?', [questionId], (err, currentQuestion) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!currentQuestion) {
      return res.status(404).json({ message: 'Question not found' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }

    if (type !== undefined) {
      updates.push('type = ?');
      values.push(type);

      // Validate options for multiple choice questions
      if (type === 'multiple_choice') {
        const checkOptions = options !== undefined ? options : (currentQuestion.options ? JSON.parse(currentQuestion.options) : []);
        if (!Array.isArray(checkOptions) || checkOptions.length < 2) {
          return res.status(400).json({ message: 'Multiple choice questions must have at least 2 options' });
        }
        
        const checkAnswer = correctAnswer !== undefined ? correctAnswer : currentQuestion.correctAnswer;
        if (!checkOptions.includes(checkAnswer)) {
          return res.status(400).json({ message: 'Correct answer must be one of the provided options' });
        }
      }

      // Validate matching pairs for matching questions
      if (type === 'matching') {
        const checkPairs = matchingPairs !== undefined ? matchingPairs : (currentQuestion.matchingPairs ? JSON.parse(currentQuestion.matchingPairs) : []);
        if (!Array.isArray(checkPairs) || checkPairs.length < 2) {
          return res.status(400).json({ message: 'Вопросы на соединение должны иметь минимум 2 пары' });
        }
        
        // Валидация правильного ответа для matching вопросов
        const checkAnswer = correctAnswer !== undefined ? correctAnswer : currentQuestion.correctAnswer;
        try {
          const parsedCorrectAnswer = typeof checkAnswer === 'string' ? JSON.parse(checkAnswer) : checkAnswer;
          if (typeof parsedCorrectAnswer !== 'object' || Array.isArray(parsedCorrectAnswer)) {
            return res.status(400).json({ message: 'Правильный ответ для вопросов на соединение должен быть объектом' });
          }
          for (let i = 0; i < checkPairs.length; i++) {
            if (!parsedCorrectAnswer.hasOwnProperty(i.toString()) && !parsedCorrectAnswer.hasOwnProperty(i)) {
              return res.status(400).json({ message: `Правильный ответ должен содержать соединение для пары ${i + 1}` });
            }
          }
        } catch (e) {
          return res.status(400).json({ message: 'Неверный формат правильного ответа для вопроса на соединение' });
        }
      }
    }

    if (options !== undefined) {
      updates.push('options = ?');
      values.push(options ? JSON.stringify(options) : null);
    }

    if (matchingPairs !== undefined) {
      updates.push('matchingPairs = ?');
      values.push(matchingPairs ? JSON.stringify(matchingPairs) : null);
    }

    // Handle image upload
    if (req.file) {
      // Delete old image if exists
      if (currentQuestion.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', currentQuestion.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updates.push('imageUrl = ?');
      values.push(`/uploads/questions/${req.file.filename}`);
    }

    if (correctAnswer !== undefined) {
      updates.push('correctAnswer = ?');
      values.push(correctAnswer);
    }

    if (points !== undefined) {
      updates.push('points = ?');
      values.push(points);
    }

    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      values.push(difficulty);
    }

    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }

    if (isActive !== undefined) {
      updates.push('isActive = ?');
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(questionId);

    const query = `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.json({ message: 'Question updated successfully' });
    });
  });
});

// Admin: Delete question (hard delete)
router.delete('/admin/:id', authMiddleware('admin'), (req, res) => {
  const questionId = req.params.id;

  // First, get the question to check for image file
  db.get('SELECT imageUrl FROM questions WHERE id = ?', [questionId], (err, question) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }

    // Delete image file if exists
    if (question.imageUrl) {
      const imagePath = path.join(__dirname, '..', question.imageUrl);
      if (fs.existsSync(imagePath)) {
        try {
          fs.unlinkSync(imagePath);
        } catch (fileErr) {
          console.error('Error deleting image file:', fileErr);
          // Continue with database deletion even if file deletion fails
        }
      }
    }

    // Delete the question from database
    db.run('DELETE FROM questions WHERE id = ?', [questionId], function(deleteErr) {
      if (deleteErr) {
        console.error('Database error:', deleteErr);
        return res.status(500).json({ message: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Question not found' });
      }

      res.json({ message: 'Question deleted successfully' });
    });
  });
});

// Admin: Get question statistics
router.get('/admin/stats/overview', authMiddleware('admin'), (req, res) => {
  const queries = {
    totalQuestions: 'SELECT COUNT(*) as count FROM questions WHERE isActive = 1',
    totalSubmissions: 'SELECT COUNT(*) as count FROM submissions',
    averageSuccessRate: `SELECT AVG(CASE 
                                    WHEN total_submissions > 0 
                                    THEN (correct_submissions * 100.0 / total_submissions) 
                                    ELSE 0 
                                  END) as rate
                         FROM (
                           SELECT q.id,
                                  COUNT(s.id) as total_submissions,
                                  COUNT(CASE WHEN s.isCorrect = 1 THEN 1 END) as correct_submissions
                           FROM questions q
                           LEFT JOIN submissions s ON q.id = s.questionId
                           WHERE q.isActive = 1
                           GROUP BY q.id
                         )`,
    questionsByCategory: `SELECT category, COUNT(*) as count 
                          FROM questions 
                          WHERE isActive = 1 
                          GROUP BY category 
                          ORDER BY count DESC`,
    questionsByDifficulty: `SELECT difficulty, COUNT(*) as count 
                            FROM questions 
                            WHERE isActive = 1 
                            GROUP BY difficulty 
                            ORDER BY 
                              CASE difficulty 
                                WHEN 'easy' THEN 1 
                                WHEN 'medium' THEN 2 
                                WHEN 'hard' THEN 3 
                              END`,
    topPerformingQuestions: `SELECT q.title, q.category, q.difficulty,
                                    COUNT(s.id) as submissions,
                                    COUNT(CASE WHEN s.isCorrect = 1 THEN 1 END) as correct,
                                    CASE WHEN COUNT(s.id) > 0 
                                         THEN ROUND(COUNT(CASE WHEN s.isCorrect = 1 THEN 1 END) * 100.0 / COUNT(s.id))
                                         ELSE 0 END as success_rate
                             FROM questions q
                             LEFT JOIN submissions s ON q.id = s.questionId
                             WHERE q.isActive = 1
                             GROUP BY q.id
                             HAVING COUNT(s.id) > 0
                             ORDER BY success_rate DESC, submissions DESC
                             LIMIT 10`
  };

  const stats = {};

  // Execute all queries
  const executeQueries = async () => {
    try {
      stats.totalQuestions = await new Promise((resolve, reject) => {
        db.get(queries.totalQuestions, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      stats.totalSubmissions = await new Promise((resolve, reject) => {
        db.get(queries.totalSubmissions, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      stats.averageSuccessRate = await new Promise((resolve, reject) => {
        db.get(queries.averageSuccessRate, [], (err, result) => {
          if (err) reject(err);
          else resolve(Math.round(result.rate || 0));
        });
      });

      stats.questionsByCategory = await new Promise((resolve, reject) => {
        db.all(queries.questionsByCategory, [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      stats.questionsByDifficulty = await new Promise((resolve, reject) => {
        db.all(queries.questionsByDifficulty, [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      stats.topPerformingQuestions = await new Promise((resolve, reject) => {
        db.all(queries.topPerformingQuestions, [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.json({ stats });

    } catch (error) {
      console.error('Error getting question stats:', error);
      res.status(500).json({ message: 'Error retrieving question statistics' });
    }
  };

  executeQueries();
});

module.exports = router;
