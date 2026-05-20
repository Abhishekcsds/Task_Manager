// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// require('dotenv').config();

// const authRoutes = require('./routes/auth');
// const projectRoutes = require('./routes/projects');
// const taskRoutes = require('./routes/tasks');
// const userRoutes = require('./routes/users');

// const app = express();

// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL || '*',
//   credentials: true
// }));
// app.use(express.json());

// // Health check
// app.get('/health', (req, res) => {
//   res.json({ status: 'OK', message: 'Team Task Manager API is running' });
// });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/tasks', taskRoutes);
// app.use('/api/users', userRoutes);

// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res.status(500).json({ message: 'Something went wrong!', error: err.message });
// });

// // Connect to MongoDB and start server
// const PORT = process.env.PORT || 5000;
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/team-task-manager';

// mongoose.connect(MONGODB_URI)
//   .then(() => {
//     console.log('✅ Connected to MongoDB');
//     app.listen(PORT, '0.0.0.0', () => {
//       console.log(`🚀 Server running on port ${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.error('❌ MongoDB connection error:', err);
//     process.exit(1);
//   });

// module.exports = app;



if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/users');

const app = express();

// --- CORS: allow both production frontend and localhost ---
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman, mobile apps)
    if (!origin) return callback(null, true);
    
    // Get allowed origins from env or fallback to localhost
    const allowedOrigins = [
      process.env.FRONTEND_URL,
      'http://localhost:3000'
    ].filter(Boolean).map(url => url.replace(/\/$/, '')); // remove trailing slash
    
    // Also allow any *.railway.app domain during debugging (optional)
    const isRailwayApp = origin.includes('.up.railway.app');
    
    if (allowedOrigins.includes(origin) || isRailwayApp) {
      callback(null, true);
    } else {
      console.log(`CORS blocked: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Team Task Manager API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// --- Connect to MongoDB (no fallback to localhost) ---
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ Fatal error: MONGODB_URI environment variable is not set.');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

module.exports = app;