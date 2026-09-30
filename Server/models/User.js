const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email address',
      ],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Prevents password from being returned in query projections by default
    },
    role: {
      type: String,
      enum: {
        values: ['Client', 'Freelancer', 'Admin'],
        message: '{VALUE} is not a supported role. Must be Client, Freelancer, or Admin',
      },
      default: 'Freelancer',
      index: true,
    },
    profileImage: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
      maxlength: [1000, 'Bio cannot exceed 1000 characters'],
    },
    skills: {
      type: [String],
      default: [],
      index: true,
    },
    portfolio: [
      {
        title: { type: String, trim: true },
        url: { type: String, trim: true },
        description: { type: String, trim: true },
      },
    ],
    experience: {
      type: String,
      default: '',
      trim: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val) => Math.round(val * 10) / 10, // Round to 1 decimal place
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: [0, 'Total reviews cannot be negative'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    // Admin activation control: deactivated users cannot log in or use the API
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password with bcryptjs before saving
// (promise-style hook — Mongoose 7+ does not pass `next` to async hooks)
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Instance method to verify password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Compound & text indexes for user discovery and search
userSchema.index({ name: 'text', skills: 'text', bio: 'text' });
userSchema.index({ role: 1, rating: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
