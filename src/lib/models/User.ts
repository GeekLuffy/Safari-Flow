import mongoose from 'mongoose';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'staff', 'guest'],
    default: 'staff'
  },
  avatar: {
    type: String
  }
}, {
  timestamps: true
});

// Create a model safely, handling browser environment
export const UserModel = isBrowser 
  ? null // In browser, don't try to access mongoose.models
  : (mongoose.models.User || mongoose.model('User', UserSchema));