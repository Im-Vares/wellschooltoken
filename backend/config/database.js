const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database.sqlite');
const db = new sqlite3.Database(dbPath);

const initialize = () => {
  console.log('🗄️  Initializing database...');
  
  // Create Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    tokenBalance INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create Admins table
  db.run(`CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create Questions table
  db.run(`CREATE TABLE IF NOT EXISTS questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'multiple_choice',
    options TEXT DEFAULT NULL,
    correctAnswer TEXT NOT NULL,
    points INTEGER DEFAULT 10,
    difficulty VARCHAR(20) DEFAULT 'easy',
    category VARCHAR(50) DEFAULT 'general',
    imageUrl VARCHAR(255) DEFAULT NULL,
    matchingPairs TEXT DEFAULT NULL,
    isActive BOOLEAN DEFAULT 1,
    createdBy INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES admins(id)
  )`);

  // Create Assignments table
  db.run(`CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    totalPoints INTEGER DEFAULT 0,
    difficulty VARCHAR(20) DEFAULT 'easy',
    category VARCHAR(50) DEFAULT 'general',
    isActive BOOLEAN DEFAULT 1,
    createdBy INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES admins(id)
  )`);

  // Create Assignment Questions table (many-to-many relationship)
  db.run(`CREATE TABLE IF NOT EXISTS assignment_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignmentId INTEGER NOT NULL,
    questionId INTEGER NOT NULL,
    orderIndex INTEGER DEFAULT 0,
    FOREIGN KEY (assignmentId) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY (questionId) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(assignmentId, questionId)
  )`);

  // Create Submissions table
  db.run(`CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    questionId INTEGER NOT NULL,
    assignmentId INTEGER DEFAULT NULL,
    userAnswer TEXT NOT NULL,
    isCorrect BOOLEAN DEFAULT 0,
    tokensAwarded INTEGER DEFAULT 0,
    submittedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewedBy INTEGER DEFAULT NULL,
    reviewedAt DATETIME DEFAULT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    feedback TEXT DEFAULT NULL,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (questionId) REFERENCES questions(id),
    FOREIGN KEY (assignmentId) REFERENCES assignments(id),
    FOREIGN KEY (reviewedBy) REFERENCES admins(id)
  )`);

  // Create Token Transactions table
  db.run(`CREATE TABLE IF NOT EXISTS tokenTransactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL,
    amount INTEGER NOT NULL,
    reason TEXT NOT NULL,
    submissionId INTEGER DEFAULT NULL,
    adminId INTEGER DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (submissionId) REFERENCES submissions(id),
    FOREIGN KEY (adminId) REFERENCES admins(id)
  )`);

  // Create Achievements table
  db.run(`CREATE TABLE IF NOT EXISTS achievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    condition_value INTEGER NOT NULL,
    tokensReward INTEGER DEFAULT 0,
    isActive BOOLEAN DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Create User Achievements table
  db.run(`CREATE TABLE IF NOT EXISTS userAchievements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    userId INTEGER NOT NULL,
    achievementId INTEGER NOT NULL,
    unlockedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id),
    FOREIGN KEY (achievementId) REFERENCES achievements(id),
    UNIQUE(userId, achievementId)
  )`);

  // Insert default admin user after all tables are created
  db.serialize(() => {
    const bcrypt = require('bcryptjs');
    const defaultAdminPassword = bcrypt.hashSync('admin123', 10);
    
    db.run(`INSERT OR IGNORE INTO admins (username, email, password, fullName, role) 
            VALUES ('admin', 'admin@wellschool.com', ?, 'System Administrator', 'super_admin')`,
      [defaultAdminPassword],
      function(err) {
        if (err) {
          console.error('Error creating default admin:', err.message);
        } else if (this.changes > 0) {
          console.log('✅ Default admin user created');
          console.log('   Username: admin');
          console.log('   Password: admin123');
        }
      }
    );

    // Insert default achievements
    const defaultAchievements = [
    {
      name: 'First Steps',
      description: 'Answer your first question correctly',
      icon: 'star',
      condition_type: 'correct_answers',
      condition_value: 1,
      tokensReward: 5
    },
    {
      name: 'Knowledge Seeker',
      description: 'Answer 5 questions correctly',
      icon: 'book',
      condition_type: 'correct_answers',
      condition_value: 5,
      tokensReward: 10
    },
    {
      name: 'Token Collector',
      description: 'Earn 50 tokens',
      icon: 'coins',
      condition_type: 'total_tokens',
      condition_value: 50,
      tokensReward: 15
    },
    {
      name: 'Scholar',
      description: 'Answer 10 questions correctly',
      icon: 'graduation-cap',
      condition_type: 'correct_answers',
      condition_value: 10,
      tokensReward: 25
    },
    {
      name: 'Master Learner',
      description: 'Earn 100 tokens',
      icon: 'crown',
      condition_type: 'total_tokens',
      condition_value: 100,
      tokensReward: 50
    }
  ];

  const insertAchievement = db.prepare(`INSERT OR IGNORE INTO achievements 
    (name, description, icon, condition_type, condition_value, tokensReward) 
    VALUES (?, ?, ?, ?, ?, ?)`);
  
  defaultAchievements.forEach(achievement => {
    insertAchievement.run([
      achievement.name,
      achievement.description,
      achievement.icon,
      achievement.condition_type,
      achievement.condition_value,
      achievement.tokensReward
    ]);
  });
  insertAchievement.finalize();

  // Sample questions removed - admin will create questions manually

    console.log('✅ Database initialized successfully');
  });
};

module.exports = { db, initialize };
