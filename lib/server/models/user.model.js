import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    trim: true,
    minLength: [3, 'Name must be at least 3 characters'],
    maxLength: [30, 'Name must be less than 30 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
  },
  username: {
    type: String,
    required: [true, 'Please enter a username'],
    unique: true,
    minLength: [3, 'Username must be at least 3 characters'],
    maxLength: [30, 'Username must be less than 30 characters'],
    match: [/^[a-zA-Z0-9_]+$/, 'Username must be alphanumeric and underscores only'],
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minLength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  avatar: {
    public_id: { type: String, required: true },
    url: { type: String, required: true },
  },
  isAcceptingMessage: { type: Boolean, default: true },
  verifyCode: { type: String },
  verifyCodeExpiry: { type: Date },
  verifyCodeAttempts: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const bcrypt = await import('bcrypt');
  this.password = await bcrypt.hash(this.password, 10);
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
