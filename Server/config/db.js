const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelancehub');
    console.log(`[MongoDB Connected] Host: ${conn.connection.host}, Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);
    // In production or local setup without active mongo service, log guidance
    console.warn('⚠️ Make sure MongoDB is running locally or provide a valid MONGO_URI in .env');
  }
};

module.exports = connectDB;
