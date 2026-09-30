const jwt = require('jsonwebtoken');

/**
 * Generate JSON Web Token (JWT)
 * @param {string} id - User ID
 * @param {string} role - User Role (Client, Freelancer, Admin)
 * @returns {string} Signed JWT
 */
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    }
  );
};

module.exports = generateToken;
