# 🎓 WellSchoolToken - Learning Reward Diary

A modern, dark-themed web application where users can answer questions, complete tasks, and earn WellSchoolTokens as rewards. Built with Next.js frontend and Node.js/Express backend.

## ✨ Features

### 👨‍🎓 User Features
- **Modern Dashboard** - View token balance, available questions, and progress
- **Interactive Learning** - Answer various types of questions and tasks
- **Token Rewards** - Earn WellSchoolTokens for correct answers
- **Achievement System** - Unlock badges and milestones
- **Progress Tracking** - Monitor learning journey with detailed statistics
- **Dark Theme** - Sleek, futuristic UI with neon accents and animations

### 🔧 Admin Features
- **Admin Dashboard** - Secure admin portal with analytics
- **User Management** - Add, edit, remove, and manage users
- **Question Management** - Create, edit, and organize questions/tasks
- **Manual Token Awards** - Award tokens to users manually
- **Submission Review** - Review and grade user answers
- **Activity Monitoring** - Track user activity and platform usage

### 🎨 Design Features
- **Responsive Design** - Works perfectly on desktop and mobile
- **Cyber Theme** - Dark mode with purple/pink neon accents
- **Smooth Animations** - Framer Motion powered micro-interactions
- **Modern UI Components** - Glass morphism effects and hover animations
- **Gamification Elements** - Progress bars, confetti animations, achievement badges

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - React framework with TypeScript
- **Tailwind CSS** - Utility-first CSS framework with custom cyber theme
- **Framer Motion** - Smooth animations and transitions
- **Axios** - HTTP client for API requests
- **React Hot Toast** - Modern toast notifications
- **Lucide React** - Beautiful icon library

### Backend
- **Node.js & Express** - Server and API framework
- **SQLite** - Lightweight database (easily replaceable with PostgreSQL/MongoDB)
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **Express Validator** - Input validation
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "WEll school token"
   ```

2. **Install dependencies for all components**
   ```bash
   npm run install:all
   ```

3. **Set up environment variables**
   
   Create `.env` file in the `backend` directory:
   ```env
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start both frontend (port 3000) and backend (port 5000) concurrently.

5. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:5000/api/health

## 🔐 Default Admin Credentials

```
Email: admin@wellschool.com
Password: admin123
```

## 📊 Database Schema

The application automatically creates the following tables:
- `users` - User accounts and token balances
- `admins` - Administrator accounts
- `questions` - Questions and tasks
- `submissions` - User answers and submissions
- `tokenTransactions` - Token award history
- `achievements` - Available achievements
- `userAchievements` - Unlocked user achievements

## 🎮 Sample Data

The application includes:
- **Sample Questions**: JavaScript, React, and reflection questions
- **Achievement System**: 5 built-in achievements with token rewards
- **Default Admin**: Ready-to-use admin account

## 🌟 Key Features Demonstration

### User Flow
1. **Registration/Login** - Create account or sign in
2. **Dashboard** - View token balance and available questions
3. **Answer Questions** - Submit answers for review
4. **Earn Tokens** - Get rewarded for correct answers
5. **Unlock Achievements** - Progress through learning milestones

### Admin Flow
1. **Admin Login** - Access admin portal
2. **Review Submissions** - Grade user answers and award tokens
3. **Manage Users** - Create/edit user accounts and manually award tokens
4. **Question Management** - Add/edit questions and tasks
5. **Analytics** - Monitor platform usage and user activity

## 🎨 UI/UX Highlights

- **Cyber Theme**: Dark background with purple/pink neon accents
- **Glass Morphism**: Translucent cards with backdrop blur
- **Micro-interactions**: Hover effects, button animations, loading states
- **Responsive Grid**: Adapts beautifully to all screen sizes
- **Achievement Animations**: Confetti effects for token rewards
- **Progress Indicators**: Visual feedback for user progress

## 📱 Mobile Responsive

The application is fully responsive and provides an excellent experience on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen orientations

## 🔧 Development Commands

```bash
# Install all dependencies
npm run install:all

# Start both frontend and backend in development
npm run dev

# Start only frontend (port 3000)
npm run dev:frontend

# Start only backend (port 5000)
npm run dev:backend

# Build frontend for production
npm run build
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/admin/login` - Admin login

### Users
- `GET /api/users/profile` - Get user profile
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/achievements` - Get user achievements

### Questions
- `GET /api/questions` - Get available questions
- `GET /api/questions/:id` - Get specific question
- `POST /api/users/submissions` - Submit answer

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/submissions` - Get submissions for review
- `POST /api/admin/submissions/:id/review` - Review submission
- `POST /api/admin/users/:id/award-tokens` - Award tokens manually

## 🎯 Future Enhancements

- Real-time notifications
- Discussion forums
- Leaderboards
- Certificate generation
- Integration with external learning platforms
- Mobile app version
- Social sharing features

## 📄 License

This project is created for educational and demonstration purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Built with ❤️ using modern web technologies**

Enjoy your learning journey with WellSchoolToken! 🎓✨
