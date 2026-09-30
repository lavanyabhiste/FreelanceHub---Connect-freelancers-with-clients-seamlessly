const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@freelancehub.com';
    const adminName = process.env.ADMIN_NAME || 'FreelanceHub System Admin';

    // The admin password must come from the environment — never hardcode it.
    if (!process.env.ADMIN_PASSWORD) {
      throw new Error('ADMIN_PASSWORD is not set. Define it in Server/.env before seeding the admin account.');
    }
    const adminPassword = process.env.ADMIN_PASSWORD;

    // Connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelancehub'
      );
    }

    // Check if an admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });

    if (existingAdmin) {
      console.log(`[Admin Seeder] Admin user already exists: ${existingAdmin.email}`);
      return existingAdmin;
    }

    // Create system admin securely
    const admin = await User.create({
      name: adminName,
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword,
      role: 'Admin',
      bio: 'System Administrator of FreelanceHub platform.',
      isVerified: true,
    });

    console.log(`[Admin Seeder] System Admin created successfully: ${admin.email}`);
    return admin;
  } catch (error) {
    console.error(`[Admin Seeder Error]: ${error.message}`);
    throw error;
  }
};

// If run directly from CLI (e.g. node utils/seedAdmin.js)
if (require.main === module) {
  seedAdmin()
    .then(() => {
      console.log('[Admin Seeder] Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Admin Seeder] Failed:', err);
      process.exit(1);
    });
}

module.exports = seedAdmin;
