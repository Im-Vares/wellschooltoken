const express = require('express');
const { body, validationResult } = require('express-validator');
const { db } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all assignments (for users)
router.get('/', authMiddleware('user'), (req, res) => {
  const userId = req.user.id;
  const category = req.query.category;
  const difficulty = req.query.difficulty;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let conditions = ['a.isActive = 1'];
  let params = [];

  if (category && category !== 'all') {
    conditions.push('a.category = ?');
    params.push(category);
  }

  if (difficulty && difficulty !== 'all') {
    conditions.push('a.difficulty = ?');
    params.push(difficulty);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Get assignments with completion status
  db.all(`SELECT a.*, 
                 COUNT(aq.questionId) as questionCount,
                 COUNT(s.id) as submittedCount,
                 COUNT(CASE WHEN s.status = 'reviewed' AND s.isCorrect = 1 THEN 1 END) as correctCount
          FROM assignments a
          LEFT JOIN assignment_questions aq ON a.id = aq.assignmentId
          LEFT JOIN submissions s ON aq.questionId = s.questionId AND s.userId = ?
          ${whereClause}
          GROUP BY a.id
          ORDER BY a.createdAt DESC
          LIMIT ? OFFSET ?`,
    [userId, ...params, limit, offset],
    (err, assignments) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM assignments a ${whereClause}`, params, (err, count) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          assignments,
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

// Get assignment by ID with all questions
router.get('/:id', authMiddleware('user'), (req, res) => {
  const assignmentId = req.params.id;
  const userId = req.user.id;

  // Get assignment details
  db.get(`SELECT a.*, 
                 COUNT(aq.questionId) as questionCount
          FROM assignments a
          LEFT JOIN assignment_questions aq ON a.id = aq.assignmentId
          WHERE a.id = ? AND a.isActive = 1
          GROUP BY a.id`,
    [assignmentId], (err, assignment) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get all questions in this assignment
    db.all(`SELECT q.*, aq.orderIndex,
                   CASE WHEN s.id IS NOT NULL THEN 1 ELSE 0 END as hasSubmitted,
                   s.status as submissionStatus,
                   s.tokensAwarded,
                   s.userAnswer,
                   s.feedback
            FROM assignment_questions aq
            JOIN questions q ON aq.questionId = q.id
            LEFT JOIN submissions s ON q.id = s.questionId AND s.userId = ?
            WHERE aq.assignmentId = ?
            ORDER BY aq.orderIndex`,
      [userId, assignmentId], (err, questions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Parse question data
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
        // Don't send correct answer to users unless reviewed
        if (!question.hasSubmitted || question.submissionStatus !== 'reviewed') {
          delete question.correctAnswer;
        }
      });

      res.json({
        assignment: {
          ...assignment,
          questions
        }
      });
    });
  });
});

// Admin: Get all assignments
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
    conditions.push('a.category = ?');
    params.push(category);
  }

  if (difficulty && difficulty !== 'all') {
    conditions.push('a.difficulty = ?');
    params.push(difficulty);
  }

  if (isActive !== undefined) {
    conditions.push('a.isActive = ?');
    params.push(isActive === 'true' ? 1 : 0);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  db.all(`SELECT a.*, 
                 COUNT(DISTINCT aq.questionId) as questionCount,
                 COUNT(DISTINCT s.id) as submissionCount,
                 a2.fullName as createdByName
          FROM assignments a
          LEFT JOIN assignment_questions aq ON a.id = aq.assignmentId
          LEFT JOIN submissions s ON aq.questionId = s.questionId
          LEFT JOIN admins a2 ON a.createdBy = a2.id
          ${whereClause}
          GROUP BY a.id
          ORDER BY a.createdAt DESC
          LIMIT ? OFFSET ?`,
    [...params, limit, offset],
    (err, assignments) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Get total count
      db.get(`SELECT COUNT(*) as total FROM assignments a ${whereClause}`, params, (err, count) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        res.json({
          assignments,
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

// Admin: Get assignment by ID
router.get('/admin/:id', authMiddleware('admin'), (req, res) => {
  const assignmentId = req.params.id;

  db.get(`SELECT a.*, a2.fullName as createdByName
          FROM assignments a
          LEFT JOIN admins a2 ON a.createdBy = a2.id
          WHERE a.id = ?`,
    [assignmentId], (err, assignment) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get all questions in this assignment
    db.all(`SELECT q.*, aq.orderIndex
            FROM assignment_questions aq
            JOIN questions q ON aq.questionId = q.id
            WHERE aq.assignmentId = ?
            ORDER BY aq.orderIndex`,
      [assignmentId], (err, questions) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      // Parse question data
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

      res.json({
        assignment: {
          ...assignment,
          questions
        }
      });
    });
  });
});

// Admin: Create new assignment
router.post('/admin', [
  authMiddleware('admin'),
  body('title').isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('category').isLength({ min: 2 }).withMessage('Category is required'),
  body('questionIds').isArray({ min: 1 }).withMessage('At least one question is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { title, description, difficulty, category, questionIds } = req.body;
  const adminId = req.user.id;

  // Calculate total points
  db.all('SELECT SUM(points) as total FROM questions WHERE id IN (' + questionIds.map(() => '?').join(',') + ')',
    questionIds, (err, result) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    const totalPoints = result[0]?.total || 0;

    // Create assignment
    db.run(`INSERT INTO assignments (title, description, totalPoints, difficulty, category, createdBy) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description, totalPoints, difficulty, category, adminId],
      function(err) {
        if (err) {
          console.error('Error creating assignment:', err);
          return res.status(500).json({ message: 'Error creating assignment' });
        }

        const assignmentId = this.lastID;

        // Link questions to assignment
        const insertQuestion = db.prepare(`INSERT INTO assignment_questions (assignmentId, questionId, orderIndex) 
                                          VALUES (?, ?, ?)`);
        
        questionIds.forEach((questionId, index) => {
          insertQuestion.run([assignmentId, questionId, index]);
        });
        
        insertQuestion.finalize((err) => {
          if (err) {
            console.error('Error linking questions:', err);
            return res.status(500).json({ message: 'Error linking questions' });
          }

          res.status(201).json({
            message: 'Assignment created successfully',
            assignmentId: assignmentId
          });
        });
      }
    );
  });
});

// Admin: Update assignment
router.put('/admin/:id', [
  authMiddleware('admin'),
  body('title').optional().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
  body('description').optional().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('difficulty').optional().isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('category').optional().isLength({ min: 2 }).withMessage('Category must be at least 2 characters')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const assignmentId = req.params.id;
  const { title, description, difficulty, category, questionIds, isActive } = req.body;

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

  if (updates.length === 0 && !questionIds) {
    return res.status(400).json({ message: 'No updates provided' });
  }

  // Update assignment if there are field updates
  if (updates.length > 0) {
    updates.push('updatedAt = CURRENT_TIMESTAMP');
    values.push(assignmentId);

    db.run(`UPDATE assignments SET ${updates.join(', ')} WHERE id = ?`,
      values, function(err) {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: 'Assignment not found' });
        }

        // Update questions if provided
        if (questionIds && Array.isArray(questionIds)) {
          // Delete existing links
          db.run('DELETE FROM assignment_questions WHERE assignmentId = ?', [assignmentId], (err) => {
            if (err) {
              console.error('Error deleting question links:', err);
              return res.status(500).json({ message: 'Error updating questions' });
            }

            // Insert new links
            const insertQuestion = db.prepare(`INSERT INTO assignment_questions (assignmentId, questionId, orderIndex) 
                                              VALUES (?, ?, ?)`);
            
            questionIds.forEach((questionId, index) => {
              insertQuestion.run([assignmentId, questionId, index]);
            });
            
            insertQuestion.finalize((err) => {
              if (err) {
                console.error('Error linking questions:', err);
                return res.status(500).json({ message: 'Error linking questions' });
              }

              // Recalculate total points
              db.all('SELECT SUM(points) as total FROM questions WHERE id IN (' + questionIds.map(() => '?').join(',') + ')',
                questionIds, (err, result) => {
                if (!err && result[0]) {
                  db.run('UPDATE assignments SET totalPoints = ? WHERE id = ?', 
                    [result[0].total || 0, assignmentId]);
                }
                res.json({ message: 'Assignment updated successfully' });
              });
            });
          });
        } else {
          res.json({ message: 'Assignment updated successfully' });
        }
      }
    );
  } else if (questionIds && Array.isArray(questionIds)) {
    // Only update questions
    db.run('DELETE FROM assignment_questions WHERE assignmentId = ?', [assignmentId], (err) => {
      if (err) {
        console.error('Error deleting question links:', err);
        return res.status(500).json({ message: 'Error updating questions' });
      }

      const insertQuestion = db.prepare(`INSERT INTO assignment_questions (assignmentId, questionId, orderIndex) 
                                        VALUES (?, ?, ?)`);
      
      questionIds.forEach((questionId, index) => {
        insertQuestion.run([assignmentId, questionId, index]);
      });
      
      insertQuestion.finalize((err) => {
        if (err) {
          console.error('Error linking questions:', err);
          return res.status(500).json({ message: 'Error linking questions' });
        }

        // Recalculate total points
        db.all('SELECT SUM(points) as total FROM questions WHERE id IN (' + questionIds.map(() => '?').join(',') + ')',
          questionIds, (err, result) => {
          if (!err && result[0]) {
            db.run('UPDATE assignments SET totalPoints = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', 
              [result[0].total || 0, assignmentId]);
          }
          res.json({ message: 'Assignment updated successfully' });
        });
      });
    });
  }
});

// Admin: Delete assignment (soft delete)
router.delete('/admin/:id', authMiddleware('admin'), (req, res) => {
  const assignmentId = req.params.id;

  db.run('UPDATE assignments SET isActive = 0, updatedAt = CURRENT_TIMESTAMP WHERE id = ?', 
    [assignmentId], function(err) {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json({ message: 'Assignment deactivated successfully' });
  });
});

module.exports = router;

