// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Only import mongoose if we're not in a browser
let mongoose: any = null;
if (!isBrowser) {
  // This import will never execute in the browser
  mongoose = require('mongoose');
}

// In Vite, environment variables are exposed through import.meta.env
// and must be prefixed with VITE_
const MONGODB_URI = isBrowser ? 'browser-mock-uri' : import.meta.env.VITE_MONGODB_URI;

// For browser environments, provide mock implementations
export async function connectToDatabase() {
  if (isBrowser) {
    console.log('Browser environment detected, mocking database connection');
    return null;
  }
  
  if (!MONGODB_URI) {
    throw new Error('Please define the VITE_MONGODB_URI environment variable');
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
    return mongoose;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export function disconnectFromDatabase() {
  if (isBrowser) {
    console.log('Browser environment detected, no need to disconnect');
    return Promise.resolve();
  }
  
  return mongoose.disconnect();
}

// Function to check if connected to the database
export function isConnected() {
  if (isBrowser) {
    return false; // Browser is never connected to the real database
  }
  
  return mongoose.connection.readyState === 1;
} 