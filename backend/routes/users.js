const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;
  
  db.get(`SELECT id, username, email, fullName, avatar, tokenBalance, createdAt 
          FROM users WHERE id = ?`, [userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  });
});

// Update user profile
router.put('/profile', [
  authMiddleware('user'),
  body('fullName').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.id;
  const { fullName, email } = req.body;
  
  const updates = [];
  const values = [];
  
  if (fullName) {
    updates.push('fullName = ?');
    values.push(fullName);
  }
  
  if (email) {
    updates.push('email = ?');
    values.push(email);
  }
  
  if (updates.length === 0) {
    return res.status(400).json({ message: 'No updates provided' });
  }
  
  updates.push('updatedAt = CURRENT_TIMESTAMP');
  values.push(userId);
  
  const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
  
  db.run(query, values, function(err) {
    if (err) {
      console.error('Database error:', err);
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ message: 'Email already exists' });
      }
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Profile updated successfully' });
  });
});

// Get user's token history
router.get('/tokens/history', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.all(`SELECT tt.*, s.questionId, q.title as questionTitle
          FROM tokenTransactions tt
          LEFT JOIN submissions s ON tt.submissionId = s.id
          LEFT JOIN questions q ON s.questionId = q.id
          WHERE tt.userId = ?
          ORDER BY tt.createdAt DESC
          LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    (err, transactions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get total count
      db.get('SELECT COUNT(*) as total FROM tokenTransactions WHERE userId = ?', 
        [userId], (err, count) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          transactions,
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

// Get user's submissions
router.get('/submissions', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.all(`SELECT s.*, q.title, q.category, q.difficulty, q.points,
                 a.fullName as reviewedByName
          FROM submissions s
          JOIN questions q ON s.questionId = q.id
          LEFT JOIN admins a ON s.reviewedBy = a.id
          WHERE s.userId = ?
          ORDER BY s.submittedAt DESC
          LIMIT ? OFFSET ?`,
    [userId, limit, offset],
    (err, submissions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get total count
      db.get('SELECT COUNT(*) as total FROM submissions WHERE userId = ?', 
        [userId], (err, count) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          submissions,
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

// Submit answer to question
router.post('/submissions', [
  authMiddleware('user'),
  body('questionId').isInt().withMessage('Question ID is required'),
  body('answer').notEmpty().withMessage('Answer is required'),
  body('assignmentId').optional().isInt().withMessage('Assignment ID must be an integer')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.user.id;
  const { questionId, answer, assignmentId } = req.body;

  // Check if question exists and is active
  db.get('SELECT * FROM questions WHERE id = ? AND isActive = 1', [questionId], (err, question) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!question) {
      return res.status(404).json({ message: 'Question not found or inactive' });
    }

    // If assignmentId is provided, verify it exists and contains this question
    if (assignmentId) {
      db.get(`SELECT * FROM assignment_questions 
              WHERE assignmentId = ? AND questionId = ?`, 
        [assignmentId, questionId], (err, assignmentQuestion) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (!assignmentQuestion) {
          return res.status(400).json({ message: 'Question does not belong to this assignment' });
        }

        // Check if user already submitted for this question in this assignment
        db.get(`SELECT * FROM submissions 
                WHERE userId = ? AND questionId = ? AND assignmentId = ?`, 
          [userId, questionId, assignmentId], (err, existingSubmission) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
          }

          if (existingSubmission) {
            return res.status(400).json({ message: 'You have already submitted an answer for this question' });
          }

          // Create submission with assignmentId
          db.run(`INSERT INTO submissions (userId, questionId, assignmentId, userAnswer, status) 
                  VALUES (?, ?, ?, ?, 'pending')`,
            [userId, questionId, assignmentId, answer],
            function(err) {
              if (err) {
                console.error('Error creating submission:', err);
                return res.status(500).json({ message: 'Error submitting answer' });
              }

              res.status(201).json({
                message: 'Answer submitted successfully. Awaiting review.',
                submissionId: this.lastID
              });
            }
          );
        });
      });
    } else {
      // Check if user already submitted for this question (standalone)
      db.get('SELECT * FROM submissions WHERE userId = ? AND questionId = ? AND assignmentId IS NULL', 
        [userId, questionId], (err, existingSubmission) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (existingSubmission) {
          return res.status(400).json({ message: 'You have already submitted an answer for this question' });
        }

        // Create submission without assignmentId
        db.run(`INSERT INTO submissions (userId, questionId, userAnswer, status) 
                VALUES (?, ?, ?, 'pending')`,
          [userId, questionId, answer],
          function(err) {
            if (err) {
              console.error('Error creating submission:', err);
              return res.status(500).json({ message: 'Error submitting answer' });
            }

            res.status(201).json({
              message: 'Answer submitted successfully. Awaiting review.',
              submissionId: this.lastID
            });
          }
        );
      });
    }
  });
});

// Get user's achievements
router.get('/achievements', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;

  // Get user's unlocked achievements
  db.all(`SELECT ua.*, a.name, a.description, a.icon, a.tokensReward
          FROM userAchievements ua
          JOIN achievements a ON ua.achievementId = a.id
          WHERE ua.userId = ?
          ORDER BY ua.unlockedAt DESC`,
    [userId],
    (err, unlockedAchievements) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get all available achievements
      db.all(`SELECT a.*, 
                     CASE WHEN ua.id IS NOT NULL THEN 1 ELSE 0 END as unlocked
              FROM achievements a
              LEFT JOIN userAchievements ua ON a.id = ua.achievementId AND ua.userId = ?
              WHERE a.isActive = 1
              ORDER BY unlocked DESC, a.id`,
        [userId],
        (err, allAchievements) => {
          if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ message: 'Database error' });
          }

          res.json({
            unlockedAchievements,
            allAchievements
          });
        }
      );
    }
  );
});

// Get user statistics
router.get('/stats', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;

  // Get various statistics
  const queries = {
    totalSubmissions: 'SELECT COUNT(*) as count FROM submissions WHERE userId = ?',
    correctAnswers: 'SELECT COUNT(*) as count FROM submissions WHERE userId = ? AND isCorrect = 1',
    totalTokens: 'SELECT tokenBalance FROM users WHERE id = ?',
    achievements: 'SELECT COUNT(*) as count FROM userAchievements WHERE userId = ?',
    recentActivity: `SELECT s.*, q.title, q.category 
                     FROM submissions s
                     JOIN questions q ON s.questionId = q.id
                     WHERE s.userId = ?
                     ORDER BY s.submittedAt DESC
                     LIMIT 5`
  };

  const stats = {};

  // Execute all queries
  const executeQueries = async () => {
    try {
      // Total submissions
      stats.totalSubmissions = await new Promise((resolve, reject) => {
        db.get(queries.totalSubmissions, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      // Correct answers
      stats.correctAnswers = await new Promise((resolve, reject) => {
        db.get(queries.correctAnswers, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      // Total tokens
      stats.totalTokens = await new Promise((resolve, reject) => {
        db.get(queries.totalTokens, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.tokenBalance);
        });
      });

      // Achievements count
      stats.achievements = await new Promise((resolve, reject) => {
        db.get(queries.achievements, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      // Recent activity
      stats.recentActivity = await new Promise((resolve, reject) => {
        db.all(queries.recentActivity, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      // Calculate accuracy
      stats.accuracy = stats.totalSubmissions > 0 
        ? Math.round((stats.correctAnswers / stats.totalSubmissions) * 100)
        : 0;

      res.json({ stats });

    } catch (error) {
      console.error('Error getting stats:', error);
      res.status(500).json({ message: 'Error retrieving statistics' });
    }
  };

  executeQueries();
});

module.exports = router;
