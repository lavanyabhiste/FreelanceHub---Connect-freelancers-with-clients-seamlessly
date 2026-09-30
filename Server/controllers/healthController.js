const mongoose = require('mongoose');

/**
 * @desc   Check API and Database Health Status
 * @route  GET /api/health
 * @access Public
 */
const getHealthStatus = (req, res) => {
  const dbStatusMap = {
    0: 'Disconnected',
    1: 'Connected',
    2: 'Connecting',
    3: 'Disconnecting',
  };

  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    success: true,
    message: 'FreelanceHub backend is running seamlessly!',
    platform: 'FreelanceHub – Connect Freelancers with Clients Seamlessly',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())} seconds`,
    database: {
      status: dbStatusMap[dbState] || 'Unknown',
      stateCode: dbState,
    },
  });
};

module.exports = {
  getHealthStatus,
};
