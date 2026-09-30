const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protect routes - Verifies JWT from Bearer Authorization header
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Extract token from header
      token = req.headers.authorization.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. No token provided.',
        });
      }

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Fetch user belonging to the token (excluding password)
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User belonging to this token no longer exists.',
        });
      }

      // Deactivated accounts lose access immediately (even with a valid token)
      if (user.isActive === false) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact the platform administrator.',
        });
      }

      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Your token has expired. Please log in again.',
        });
      }

      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Authorization denied.',
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Authentication failed. Please log in.',
      });
    }
  } else {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Bearer token is required.',
    });
  }
};

/**
 * Grant access to specific roles
 * @param  {...string} roles - e.g. 'Client', 'Freelancer', 'Admin'
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required before checking role authorization.',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required role(s): [${roles.join(', ')}]`,
      });
    }

    next();
  };
};

// Convenience role-specific middleware
const isClient = authorize('Client');
const isFreelancer = authorize('Freelancer');
const isAdmin = authorize('Admin');

module.exports = {
  protect,
  authorize,
  isClient,
  isFreelancer,
  isAdmin,
};
