const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Admin: Get all achievements
router.get('/admin/all', authMiddleware('admin'), (req, res) => {
  db.all(`SELECT a.*, 
                 COUNT(ua.id) as unlockedCount
          FROM achievements a
          LEFT JOIN userAchievements ua ON a.id = ua.achievementId
          GROUP BY a.id
          ORDER BY a.createdAt DESC`,
    [],
    (err, achievements) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      res.json({ achievements });
    }
  );
});

// Admin: Get achievement by ID
router.get('/admin/:id', authMiddleware('admin'), (req, res) => {
  const achievementId = req.params.id;

  db.get('SELECT * FROM achievements WHERE id = ?', [achievementId], (err, achievement) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    res.json({ achievement });
  });
});

// Admin: Create new achievement
router.post('/admin', [
  authMiddleware('admin'),
  body('name').isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('description').isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('icon').notEmpty().withMessage('Icon is required'),
  body('condition_type').isIn(['correct_answers', 'total_tokens']).withMessage('Invalid condition type'),
  body('condition_value').isInt({ min: 1 }).withMessage('Condition value must be a positive integer'),
  body('tokensReward').isInt({ min: 0 }).withMessage('Tokens reward must be non-negative')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, icon, condition_type, condition_value, tokensReward, isActive } = req.body;

  db.run(`INSERT INTO achievements (name, description, icon, condition_type, condition_value, tokensReward, isActive) 
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, description, icon, condition_type, condition_value, tokensReward || 0, isActive !== undefined ? isActive : 1],
    function(err) {
      if (err) {
        console.error('Error creating achievement:', err);
        return res.status(500).json({ message: 'Error creating achievement' });
      }

      res.status(201).json({
        message: 'Achievement created successfully',
        achievementId: this.lastID
      });
    }
  );
});

// Admin: Update achievement
router.put('/admin/:id', [
  authMiddleware('admin'),
  body('name').optional().isLength({ min: 3 }).withMessage('Name must be at least 3 characters'),
  body('description').optional().isLength({ min: 5 }).withMessage('Description must be at least 5 characters'),
  body('icon').optional().notEmpty().withMessage('Icon cannot be empty'),
  body('condition_type').optional().isIn(['correct_answers', 'total_tokens']).withMessage('Invalid condition type'),
  body('condition_value').optional().isInt({ min: 1 }).withMessage('Condition value must be a positive integer'),
  body('tokensReward').optional().isInt({ min: 0 }).withMessage('Tokens reward must be non-negative')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const achievementId = req.params.id;
  const { name, description, icon, condition_type, condition_value, tokensReward, isActive } = req.body;

  const updates = [];
  const values = [];

  if (name !== undefined) {
    updates.push('name = ?');
    values.push(name);
  }

  if (description !== undefined) {
    updates.push('description = ?');
    values.push(description);
  }

  if (icon !== undefined) {
    updates.push('icon = ?');
    values.push(icon);
  }

  if (condition_type !== undefined) {
    updates.push('condition_type = ?');
    values.push(condition_type);
  }

  if (condition_value !== undefined) {
    updates.push('condition_value = ?');
    values.push(condition_value);
  }

  if (tokensReward !== undefined) {
    updates.push('tokensReward = ?');
    values.push(tokensReward);
  }

  if (isActive !== undefined) {
    updates.push('isActive = ?');
    values.push(isActive);
  }

  if (updates.length === 0) {
    return res.status(400).json({ message: 'No updates provided' });
  }

  values.push(achievementId);

  db.run(`UPDATE achievements SET ${updates.join(', ')} WHERE id = ?`,
    values, function(err) {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: 'Achievement not found' });
      }

      res.json({ message: 'Achievement updated successfully' });
    }
  );
});

// Admin: Delete achievement (soft delete)
router.delete('/admin/:id', authMiddleware('admin'), (req, res) => {
  const achievementId = req.params.id;

  db.run('UPDATE achievements SET isActive = 0 WHERE id = ?', 
    [achievementId], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    res.json({ message: 'Achievement deactivated successfully' });
  });
});

module.exports = router;

