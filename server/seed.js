import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('[Seed] Connected to database');

    // Clean existing users
    await User.deleteMany({});
    console.log('[Seed] Cleaned existing users');

    // Create TraderJoe
    const traderJoe = new User({
      username: 'TraderJoe',
      name: 'Trader Joe',
      email: 'traderjoe@example.com',
      password: 'trader123',
      role: 'user',
      isVerified: true,
      cashUSD: 12500.00
    });

    // Create CryptoAdmin
    const cryptoAdmin = new User({
      username: 'CryptoAdmin',
      name: 'Crypto Admin',
      email: 'cryptoadmin@example.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true,
      cashUSD: 25000.00
    });

    await traderJoe.save();
    console.log('[Seed] Created TraderJoe');

    await cryptoAdmin.save();
    console.log('[Seed] Created CryptoAdmin');

    await mongoose.connection.close();
    console.log('[Seed] Seeding completed successfully');
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error.message);
    process.exit(1);
  }
};

seed();
