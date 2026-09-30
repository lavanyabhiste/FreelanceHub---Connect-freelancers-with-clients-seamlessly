const User = require('../models/User');
const generateToken = require('../utils/generateToken');

/**
 * @desc    Register a new user (Client or Freelancer)
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role, bio, skills, portfolio, experience, profileImage } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    // Enforce role restrictions: Only Client or Freelancer permitted for public registration
    let normalizedRole = 'Freelancer';
    if (role) {
      const formattedRole = role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();

      if (formattedRole === 'Admin') {
        return res.status(400).json({
          success: false,
          message: 'Admin accounts cannot be self-registered. Admin is provisioned securely by the system.',
        });
      }

      if (formattedRole !== 'Client' && formattedRole !== 'Freelancer') {
        return res.status(400).json({
          success: false,
          message: "Invalid role specified. Public registration permits only 'Client' or 'Freelancer'.",
        });
      }

      normalizedRole = formattedRole;
    }

    // Check if user with given email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email address already exists.',
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.',
      });
    }

    // Create user in database (password is automatically hashed by the User pre-save hook)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: normalizedRole,
      bio: bio || '',
      skills: Array.isArray(skills) ? skills : skills ? skills.split(',').map((s) => s.trim()) : [],
      portfolio: portfolio || [],
      experience: experience || '',
      profileImage: profileImage || '',
    });

    // Generate JWT
    const token = generateToken(user._id, user.role);

    // Prepare safe user object for response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      skills: user.skills,
      portfolio: user.portfolio,
      experience: user.experience,
      rating: user.rating,
      totalReviews: user.totalReviews,
      isVerified: user.isVerified,
      isActive: user.isActive !== false,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      success: true,
      message: `${user.role} registered successfully.`,
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login user & return JWT token
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email and password inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    // Query user and explicitly select password field
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Verify password match using bcrypt
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Block deactivated accounts
    if (user.isActive === false) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the platform administrator.',
      });
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Prepare safe user object
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      bio: user.bio,
      skills: user.skills,
      portfolio: user.portfolio,
      experience: user.experience,
      rating: user.rating,
      totalReviews: user.totalReviews,
      isVerified: user.isVerified,
      isActive: user.isActive !== false,
      createdAt: user.createdAt,
    };

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      token,
      user: userResponse,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Logout user / invalidate session client-side
 * @route   POST /api/auth/logout
 * @access  Public
 */
const logout = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully. Clear client token to finish logout.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated user profile
 * @route   GET /api/auth/me
 * @access  Private (Requires JWT)
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
};
