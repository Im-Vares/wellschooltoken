const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { checkAchievements } = require('../utils/achievements');

const router = express.Router();

// Get user's token balance
router.get('/balance', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;
  
  db.get('SELECT tokenBalance FROM users WHERE id = ?', [userId], (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!result) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ balance: result.tokenBalance });
  });
});

// Get token transactions for user
router.get('/transactions', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const type = req.query.type; // 'earned', 'award', 'achievement', or 'all'
  const offset = (page - 1) * limit;

  let typeCondition = '';
  let typeParams = [];
  
  if (type && type !== 'all') {
    typeCondition = 'AND type = ?';
    typeParams = [type];
  }

  db.all(`SELECT tt.*, s.questionId, q.title as questionTitle, a.fullName as adminName
          FROM tokenTransactions tt
          LEFT JOIN submissions s ON tt.submissionId = s.id
          LEFT JOIN questions q ON s.questionId = q.id
          LEFT JOIN admins a ON tt.adminId = a.id
          WHERE tt.userId = ? ${typeCondition}
          ORDER BY tt.createdAt DESC
          LIMIT ? OFFSET ?`,
    [userId, ...typeParams, limit, offset],
    (err, transactions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM tokenTransactions WHERE userId = ? ${typeCondition}`, 
        [userId, ...typeParams], (err, count) => {
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

// Get token statistics for user
router.get('/stats', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;

  // Get token statistics
  const queries = {
    totalEarned: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE userId = ? AND type IN ("earned", "award", "achievement")',
    earnedFromQuestions: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE userId = ? AND type = "earned"',
    earnedFromAwards: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE userId = ? AND type = "award"',
    earnedFromAchievements: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE userId = ? AND type = "achievement"',
    currentBalance: 'SELECT tokenBalance FROM users WHERE id = ?',
    transactionCount: 'SELECT COUNT(*) as count FROM tokenTransactions WHERE userId = ?'
  };

  const stats = {};

  // Execute all queries
  const executeQueries = async () => {
    try {
      stats.totalEarned = await new Promise((resolve, reject) => {
        db.get(queries.totalEarned, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.earnedFromQuestions = await new Promise((resolve, reject) => {
        db.get(queries.earnedFromQuestions, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.earnedFromAwards = await new Promise((resolve, reject) => {
        db.get(queries.earnedFromAwards, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.earnedFromAchievements = await new Promise((resolve, reject) => {
        db.get(queries.earnedFromAchievements, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.currentBalance = await new Promise((resolve, reject) => {
        db.get(queries.currentBalance, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.tokenBalance);
        });
      });

      stats.transactionCount = await new Promise((resolve, reject) => {
        db.get(queries.transactionCount, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      // Get recent transactions
      stats.recentTransactions = await new Promise((resolve, reject) => {
        db.all(`SELECT tt.*, s.questionId, q.title as questionTitle
                FROM tokenTransactions tt
                LEFT JOIN submissions s ON tt.submissionId = s.id
                LEFT JOIN questions q ON s.questionId = q.id
                WHERE tt.userId = ?
                ORDER BY tt.createdAt DESC
                LIMIT 5`, [userId], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.json({ stats });

    } catch (error) {
      console.error('Error getting token stats:', error);
      res.status(500).json({ message: 'Error retrieving token statistics' });
    }
  };

  executeQueries();
});

// Admin: Get all token transactions
router.get('/admin/transactions', authMiddleware('admin'), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const userId = req.query.userId;
  const type = req.query.type;
  const offset = (page - 1) * limit;

  let conditions = [];
  let params = [];

  if (userId) {
    conditions.push('tt.userId = ?');
    params.push(userId);
  }

  if (type && type !== 'all') {
    conditions.push('tt.type = ?');
    params.push(type);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  db.all(`SELECT tt.*, u.username, u.fullName, s.questionId, q.title as questionTitle, a.fullName as adminName
          FROM tokenTransactions tt
          JOIN users u ON tt.userId = u.id
          LEFT JOIN submissions s ON tt.submissionId = s.id
          LEFT JOIN questions q ON s.questionId = q.id
          LEFT JOIN admins a ON tt.adminId = a.id
          ${whereClause}
          ORDER BY tt.createdAt DESC
          LIMIT ? OFFSET ?`,
    [...params, limit, offset],
    (err, transactions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM tokenTransactions tt 
              JOIN users u ON tt.userId = u.id ${whereClause}`, params, (err, count) => {
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

// Admin: Award tokens to user (manual)
router.post('/admin/award', [
  authMiddleware('admin'),
  body('userId').isInt().withMessage('User ID is required'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('reason').notEmpty().withMessage('Reason is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { userId, amount, reason } = req.body;
  const adminId = req.user.id;

  // Verify user exists
  db.get('SELECT * FROM users WHERE id = ? AND isActive = 1', [userId], (err, user) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found or inactive' });
    }

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
              transactionId: this.lastID,
              newBalance: user.tokenBalance + amount
            });
          });
        });
      });
    });
  });
});

// Admin: Get token statistics summary
router.get('/admin/stats', authMiddleware('admin'), (req, res) => {
  const queries = {
    totalTokensAwarded: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE type IN ("earned", "award", "achievement")',
    totalTokensFromQuestions: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE type = "earned"',
    totalTokensFromAwards: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE type = "award"',
    totalTokensFromAchievements: 'SELECT COALESCE(SUM(amount), 0) as total FROM tokenTransactions WHERE type = "achievement"',
    totalActiveUsers: 'SELECT COUNT(*) as count FROM users WHERE isActive = 1 AND tokenBalance > 0',
    averageTokenBalance: 'SELECT AVG(tokenBalance) as average FROM users WHERE isActive = 1',
    topUsers: `SELECT u.username, u.fullName, u.tokenBalance, 
                      COUNT(tt.id) as transactionCount,
                      COALESCE(SUM(tt.amount), 0) as totalEarned
               FROM users u
               LEFT JOIN tokenTransactions tt ON u.id = tt.userId
               WHERE u.isActive = 1
               GROUP BY u.id
               ORDER BY u.tokenBalance DESC
               LIMIT 10`
  };

  const stats = {};

  // Execute all queries
  const executeQueries = async () => {
    try {
      stats.totalTokensAwarded = await new Promise((resolve, reject) => {
        db.get(queries.totalTokensAwarded, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.totalTokensFromQuestions = await new Promise((resolve, reject) => {
        db.get(queries.totalTokensFromQuestions, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.totalTokensFromAwards = await new Promise((resolve, reject) => {
        db.get(queries.totalTokensFromAwards, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.totalTokensFromAchievements = await new Promise((resolve, reject) => {
        db.get(queries.totalTokensFromAchievements, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.total);
        });
      });

      stats.totalActiveUsers = await new Promise((resolve, reject) => {
        db.get(queries.totalActiveUsers, [], (err, result) => {
          if (err) reject(err);
          else resolve(result.count);
        });
      });

      stats.averageTokenBalance = await new Promise((resolve, reject) => {
        db.get(queries.averageTokenBalance, [], (err, result) => {
          if (err) reject(err);
          else resolve(Math.round(result.average || 0));
        });
      });

      stats.topUsers = await new Promise((resolve, reject) => {
        db.all(queries.topUsers, [], (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });

      res.json({ stats });

    } catch (error) {
      console.error('Error getting token admin stats:', error);
      res.status(500).json({ message: 'Error retrieving token statistics' });
    }
  };

  executeQueries();
});

module.exports = router;
