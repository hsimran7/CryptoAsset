import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const holdingSchema = new mongoose.Schema({
  symbol: { type: String, required: true },
  amount: { type: Number, required: true, default: 0 },
  avgBuyPrice: { type: Number, required: true, default: 0 }
}, { _id: false });

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email address'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [function () { return !this.googleId; }, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop'
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'USER', 'ADMIN'],
    default: 'user'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  verificationToken: String,
  verificationTokenExpire: Date,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  cashUSD: {
    type: Number,
    required: true,
    default: 12500.00
  },
  holdings: {
    type: [holdingSchema],
    default: [
      { symbol: 'BTC', amount: 1.25, avgBuyPrice: 62100.00 },
      { symbol: 'ETH', amount: 8.50, avgBuyPrice: 3150.00 },
      { symbol: 'SOL', amount: 120.00, avgBuyPrice: 115.50 },
      { symbol: 'LINK', amount: 250.00, avgBuyPrice: 12.80 },
      { symbol: 'FET', amount: 1500.00, avgBuyPrice: 1.10 }
    ]
  },
  watchlist: {
    type: [String],
    default: ['BTC', 'ETH', 'SOL', 'FET', 'LINK']
  },
  joinedDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  if (!this.password) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
