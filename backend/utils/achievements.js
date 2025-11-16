const { db } = require('../config/database');

// Function to check and unlock achievements
function checkAchievements(userId, callback) {
  // Get user stats
  db.get(`SELECT 
            COUNT(CASE WHEN s.isCorrect = 1 THEN 1 END) as correctAnswers,
            u.tokenBalance as totalTokens
          FROM users u
          LEFT JOIN submissions s ON u.id = s.userId
          WHERE u.id = ?`, [userId], (err, stats) => {
    if (err) {
      console.error('Error getting user stats:', err);
      return callback();
    }

    // Get achievements user doesn't have
    db.all(`SELECT a.*
            FROM achievements a
            WHERE a.isActive = 1
            AND a.id NOT IN (
              SELECT achievementId 
              FROM userAchievements 
              WHERE userId = ?
            )`, [userId], (err, availableAchievements) => {
      if (err) {
        console.error('Error getting achievements:', err);
        return callback();
      }

      const newAchievements = [];

      availableAchievements.forEach(achievement => {
        let unlocked = false;

        if (achievement.condition_type === 'correct_answers' && 
            stats.correctAnswers >= achievement.condition_value) {
          unlocked = true;
        } else if (achievement.condition_type === 'total_tokens' && 
                   stats.totalTokens >= achievement.condition_value) {
          unlocked = true;
        }

        if (unlocked) {
          newAchievements.push(achievement);
        }
      });

      // Insert new achievements
      if (newAchievements.length > 0) {
        const insertAchievement = db.prepare(`INSERT INTO userAchievements (userId, achievementId) VALUES (?, ?)`);
        
        newAchievements.forEach(achievement => {
          insertAchievement.run([userId, achievement.id]);
          
          // Award bonus tokens if any
          if (achievement.tokensReward > 0) {
            db.run('UPDATE users SET tokenBalance = tokenBalance + ? WHERE id = ?', 
              [achievement.tokensReward, userId]);
            
            db.run(`INSERT INTO tokenTransactions (userId, type, amount, reason, adminId) 
                    VALUES (?, 'achievement', ?, ?, NULL)`,
              [userId, achievement.tokensReward, `Achievement unlocked: ${achievement.name}`]);
          }
        });
        
        insertAchievement.finalize();
      }

      callback();
    });
  });
}

module.exports = { checkAchievements };

