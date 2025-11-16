const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { checkAchievements } = require('../utils/achievements');

const router = express.Router();

// Get all users
router.get('/users', authMiddleware('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search || '';
  const offset = (page - 1) * limit;

  let searchCondition = '';
  let searchParams = [];
  
  if (search) {
    searchCondition = 'WHERE username LIKE ? OR email LIKE ? OR fullName LIKE ?';
    const searchTerm = `%${search}%`;
    searchParams = [searchTerm, searchTerm, searchTerm];
  }

  db.all(`SELECT id, username, email, fullName, avatar, tokenBalance, isActive, createdAt, updatedAt
          FROM users 
          ${searchCondition}
          ORDER BY createdAt DESC
          LIMIT ? OFFSET ?`,
    [...searchParams, limit, offset],
    (err, users) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM users ${searchCondition}`, 
        searchParams, (err, count) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          users,
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

// Get user by ID
router.get('/users/:id', authMiddleware('admin'), (req, res) => {
  const userId = req.params.id;

  db.get(`SELECT id, username, email, fullName, avatar, tokenBalance, isActive, createdAt, updatedAt
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

// Create new user
router.post('/users', [
  authMiddleware('admin'),
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').isLength({ min: 2 }).withMessage('Full name must be at least 2 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, fullName, tokenBalance = 0 } = req.body;

  // Check if user already exists
  db.get('SELECT * FROM users WHERE email = ? OR username = ?', [email, username], async (err, existingUser) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (existingUser) {
      return res.status(400).json({ 
        message: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    db.run(`INSERT INTO users (username, email, password, fullName, tokenBalance) 
            VALUES (?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, fullName, tokenBalance],
      function(err) {
        if (err) {
          console.error('Error creating user:', err);
          return res.status(500).json({ message: 'Error creating user' });
        }

        res.status(201).json({
          message: 'User created successfully',
          userId: this.lastID
        });
      }
    );
  });
});

// Update user
router.put('/users/:id', [
  authMiddleware('admin'),
  body('fullName').optional().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('tokenBalance').optional().isInt({ min: 0 }).withMessage('Token balance must be a non-negative integer')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  const { fullName, email, tokenBalance, isActive } = req.body;
  
  const updates = [];
  const values = [];
  
  if (fullName !== undefined) {
    updates.push('fullName = ?');
    values.push(fullName);
  }
  
  if (email !== undefined) {
    updates.push('email = ?');
    values.push(email);
  }
  
  if (tokenBalance !== undefined) {
    updates.push('tokenBalance = ?');
    values.push(tokenBalance);
  }
  
  if (isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(isActive);
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

    res.json({ message: 'User updated successfully' });
  });
});

// Delete user
router.delete('/users/:id', authMiddleware('admin'), (req, res) => {
  const userId = req.params.id;

  db.run('UPDATE users SET isActive = 0 WHERE id = ?', [userId], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User deactivated successfully' });
  });
});

// Award tokens to user
router.post('/users/:id/award-tokens', [
  authMiddleware('admin'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('reason').notEmpty().withMessage('Reason is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const userId = req.params.id;
  const { amount, reason } = req.body;
  const adminId = req.user.id;

  // Start transaction-like operations
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Update user token balance
    db.run('UPDATE users SET tokenBalance = tokenBalance + ? WHERE id = ?', 
      [amount, userId], function(err) {
      if (err) {
        db.run('ROLLBACK');
        console.error('Error updating token balance:', err);
        return res.status(500).json({ message: 'Error updating token balance' });
      }

      if (this.changes === 0) {
        db.run('ROLLBACK');
        return res.status(404).json({ message: 'User not found' });
      }

      // Record transaction
      db.run(`INSERT INTO tokenTransactions (userId, type, amount, reason, adminId) 
              VALUES (?, 'award', ?, ?, ?)`,
        [userId, amount, reason, adminId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error recording transaction:', err);
          return res.status(500).json({ message: 'Error recording transaction' });
        }

        // Check for achievements
        checkAchievements(userId, () => {
          db.run('COMMIT');
          res.json({ 
            message: 'Tokens awarded successfully',
            transactionId: this.lastID
          });
        });
      });
    });
  });
});

// Get all submissions for review
router.get('/submissions', authMiddleware('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const status = req.query.status || 'all';
  const offset = (page - 1) * limit;

  let statusCondition = '';
  let statusParams = [];
  
  if (status !== 'all') {
    statusCondition = 'WHERE s.status = ?';
    statusParams = [status];
  }

  db.all(`SELECT s.*, u.username, u.fullName as userFullName, u.email,
                 q.title, q.description, q.correctAnswer, q.points, q.type, q.options,
                 a.fullName as reviewedByName
          FROM submissions s
          JOIN users u ON s.userId = u.id
          JOIN questions q ON s.questionId = q.id
          LEFT JOIN admins a ON s.reviewedBy = a.id
          ${statusCondition}
          ORDER BY s.submittedAt DESC
          LIMIT ? OFFSET ?`,
    [...statusParams, limit, offset],
    (err, submissions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Parse options for questions that have them
      submissions.forEach(submission => {
        if (submission.options) {
          try {
            submission.options = JSON.parse(submission.options);
          } catch (e) {
            submission.options = null;
          }
        }
      });

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM submissions s ${statusCondition}`, 
        statusParams, (err, count) => {
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

// Review submission
router.post('/submissions/:id/review', [
  authMiddleware('admin'),
  body('isCorrect').isBoolean().withMessage('isCorrect must be boolean'),
  body('tokensAwarded').optional().isInt({ min: 0 }).withMessage('Tokens awarded must be non-negative'),
  body('feedback').optional().isString().withMessage('Feedback must be a string')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const submissionId = req.params.id;
  const { isCorrect, tokensAwarded = 0, feedback = '' } = req.body;
  const adminId = req.user.id;

  // Get submission details
  db.get(`SELECT s.*, q.points, u.tokenBalance
          FROM submissions s
          JOIN questions q ON s.questionId = q.id
          JOIN users u ON s.userId = u.id
          WHERE s.id = ?`, [submissionId], (err, submission) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    if (submission.status !== 'pending') {
      return res.status(400).json({ message: 'Submission already reviewed' });
    }

    const finalTokensAwarded = tokensAwarded > 0 ? tokensAwarded : (isCorrect ? submission.points : 0);

    // Start transaction-like operations
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Update submission
      db.run(`UPDATE submissions 
              SET isCorrect = ?, tokensAwarded = ?, reviewedBy = ?, 
                  reviewedAt = CURRENT_TIMESTAMP, status = 'reviewed', feedback = ?
              WHERE id = ?`,
        [isCorrect, finalTokensAwarded, adminId, feedback, submissionId], function(err) {
        if (err) {
          db.run('ROLLBACK');
          console.error('Error updating submission:', err);
          return res.status(500).json({ message: 'Error updating submission' });
        }

        if (finalTokensAwarded > 0) {
          // Update user token balance
          db.run('UPDATE users SET tokenBalance = tokenBalance + ? WHERE id = ?', 
            [finalTokensAwarded, submission.userId], function(err) {
            if (err) {
              db.run('ROLLBACK');
              console.error('Error updating user tokens:', err);
              return res.status(500).json({ message: 'Error updating user tokens' });
            }

            // Record transaction
            db.run(`INSERT INTO tokenTransactions (userId, type, amount, reason, submissionId, adminId) 
                    VALUES (?, 'earned', ?, 'Question answered correctly', ?, ?)`,
              [submission.userId, finalTokensAwarded, submissionId, adminId], function(err) {
              if (err) {
                db.run('ROLLBACK');
                console.error('Error recording transaction:', err);
                return res.status(500).json({ message: 'Error recording transaction' });
              }

              // Check for achievements
              checkAchievements(submission.userId, () => {
                db.run('COMMIT');
                res.json({ 
                  message: 'Submission reviewed successfully',
                  tokensAwarded: finalTokensAwarded
                });
              });
            });
          });
        } else {
          db.run('COMMIT');
          res.json({ 
            message: 'Submission reviewed successfully',
            tokensAwarded: 0
          });
        }
      });
    });
  });
});


// Get admin dashboard statistics
router.get('/dashboard/stats', authMiddleware('admin'), (req, res) => {
  const queries = {
    totalUsers: 'SELECT COUNT(*) as count FROM users WHERE isActive = 1',
    totalSubmissions: 'SELECT COUNT(*) as count FROM submissions',
    pendingReviews: 'SELECT COUNT(*) as count FROM submissions WHERE status = "pending"',
    totalQuestions: 'SELECT COUNT(*) as count FROM questions WHERE isActive = 1',
    totalTokensAwarded: 'SELECT SUM(amount) as total FROM tokenTransactions WHERE type IN ("earned", "award")',
    recentActivity: `SELECT s.*, u.username, q.title as questionTitle
                     FROM submissions s
                     JOIN users u ON s.userId = u.id
                     JOIN questions q ON s.questionId = q.id
                     ORDER BY s.submittedAt DESC
                     LIMIT 10`
  };

  const stats = {};

  // Execute all queries
  const executeQueries = async () => {
    try {
      stats.totalUsers = await new Promise((resolve, reject) => {
        db.get(queries.totalUsers, [], (err, result) => {
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

      stats.pendingReviews = await new Promise((resolve, reject) => {
        db.get(queries.pendingReviews, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      stats.totalQuestions = await new Promise((resolve, reject) => {
        db.get(queries.totalQuestions, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      stats.totalTokensAwarded = await new Promise((resolve, reject) => {
        db.get(queries.totalTokensAwarded, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.total || 0);
        });
      });

      stats.recentActivity = await new Promise((resolve, reject) => {
        db.all(queries.recentActivity, [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.json({ stats });

    } catch (error) {
      console.error('Error getting admin stats:', error);
      res.status(500).json({ message: 'Error retrieving statistics' });
    }
  };

  executeQueries();
});

module.exports = router;
