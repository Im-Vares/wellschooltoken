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

      // Insert new achievements (using INSERT OR IGNORE to prevent duplicates)
      if (newAchievements.length > 0) {
        let processed = 0;
        
        newAchievements.forEach(achievement => {
          // Use INSERT OR IGNORE to prevent duplicates
          db.run(`INSERT OR IGNORE INTO userAchievements (userId, achievementId) VALUES (?, ?)`,
            [userId, achievement.id],
            function(err) {
              if (err) {
                console.error(`Error inserting achievement ${achievement.id} for user ${userId}:`, err);
                processed++;
                if (processed === newAchievements.length) {
                  callback();
                }
                return;
              }
              
              // Only award tokens if the insert was successful (this.changes > 0)
              // If it was ignored due to duplicate, this.changes will be 0
              if (this.changes > 0 && achievement.tokensReward > 0) {
                db.run('UPDATE users SET tokenBalance = tokenBalance + ? WHERE id = ?', 
                  [achievement.tokensReward, userId], (err) => {
                    if (err) {
                      console.error(`Error updating token balance for user ${userId}:`, err);
                    }
                  });
                
                db.run(`INSERT INTO tokenTransactions (userId, type, amount, reason, adminId) 
                        VALUES (?, 'achievement', ?, ?, NULL)`,
                  [userId, achievement.tokensReward, `Achievement unlocked: ${achievement.name}`],
                  (err) => {
                    if (err) {
                      console.error(`Error recording token transaction for user ${userId}:`, err);
                    }
                  });
              }
              
              processed++;
              if (processed === newAchievements.length) {
                callback();
              }
            }
          );
        });
      } else {
        callback();
      }
    });
  });
}

module.exports = { checkAchievements };

