const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const healthRoutes = require('./src/routes/health.routes');
const studentRoutes = require('./src/routes/studentRoutes');
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');

// 1. Load environment variables from .env
dotenv.config();

// 2. Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// 3. Built-in body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the Student Management API',
    endpoints: {
      health: '/api/health',
      students: '/api/students'
    }
  });
});

// 5. Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/students', studentRoutes);

// 6. Error handling middleware
app.use(notFound);
app.use(errorHandler);

// 7. Connect to Database and start HTTP Server
const startServer = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    console.log(`Health check available at: http://localhost:${PORT}/api/health`);
  });

  return server;
};

startServer();

module.exports = app;
