const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server: SocketIOServer } = require('socket.io');

// Load environment variables
dotenv.config();

// Fail fast when required secrets are missing — never fall back to
// hardcoded values (see .env.example for the full list).
if (!process.env.JWT_SECRET) {
  console.error(
    '[Startup] JWT_SECRET is not set. Copy Server/.env.example to Server/.env and set a strong secret.'
  );
  process.exit(1);
}

// Database Connection
const connectDB = require('./config/db');

// Route Imports
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const chatRoutes = require('./routes/chatRoutes');
const freelancerRoutes = require('./routes/freelancerRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const adminRoutes = require('./routes/adminRoutes');
const disputeRoutes = require('./routes/disputeRoutes');

// Middleware Imports
const { notFound, errorHandler } = require('./middleware/errorHandler');

// Admin provisioning util (ensures a system admin exists on boot)
const seedAdmin = require('./utils/seedAdmin');

// Initialize Database, then ensure the system admin account exists
connectDB()
  .then(() => seedAdmin())
  .catch((err) => console.error('[Startup] Seeding failed:', err.message));

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
});

// Configure CORS
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Folder for Uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Socket.IO Connection Handler — authenticated rooms for chat + notifications
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
io.use((socket, next) => {
  // Authenticate socket with JWT from handshake
  const token =
    socket.handshake.auth?.token ||
    (socket.handshake.headers?.authorization || '').replace('Bearer ', '');
  if (!token) return next(new Error('Authentication required'));
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  console.log(`[Socket.IO] User ${socket.userId} connected: ${socket.id}`);

  // Personal room for notifications — always joined
  socket.join(`user_${socket.userId}`);

  // Join a specific chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
  });

  // Leave a chat room
  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
  });

  // Read receipts: tell the other party messages were read
  socket.on('mark_read', ({ chatId, userId }) => {
    if (userId) {
      io.to(`user_${userId}`).emit('messages_read', { chatId, readBy: socket.userId });
    }
  });

  // Typing indicator: relay to everyone else in the chat room
  socket.on('typing', ({ chatId, userId }) => {
    if (chatId) {
      socket.to(`chat_${chatId}`).emit('typing', { chatId, userId: userId || socket.userId });
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User ${socket.userId} disconnected: ${socket.id}`);
  });
});

// Make io accessible across routes/controllers if needed via req.app.get('io')
app.set('io', io);

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/freelancers', freelancerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/disputes', disputeRoutes);

// Base route for API info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'FreelanceHub API',
    description: 'Connect Freelancers with Clients Seamlessly',
    version: '1.0.0',
    documentation: '/api/health',
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[FreelanceHub Server] Running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`[FreelanceHub Server] Health check available at: http://localhost:${PORT}/api/health`);
});
