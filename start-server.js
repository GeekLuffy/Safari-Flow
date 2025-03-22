import { spawn } from 'child_process';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

// Try to load from .env.local if it exists
if (fs.existsSync('.env.local')) {
  const envLocal = dotenv.parse(fs.readFileSync('.env.local'));
  
  // Add all variables from .env.local to process.env
  for (const key in envLocal) {
    process.env[key] = envLocal[key];
  }
}

// Ensure MongoDB URI is set
if (!process.env.VITE_MONGODB_URI) {
  console.error('ERROR: VITE_MONGODB_URI is not defined in environment variables');
  console.error('Please make sure your .env or .env.local file has VITE_MONGODB_URI set');
  process.exit(1);
}

console.log('Starting server with MongoDB URI:', process.env.VITE_MONGODB_URI ? 'Defined' : 'Not defined');

// Start server process with all environment variables
const serverProcess = spawn('node', ['server.js'], {
  stdio: 'inherit',
  env: process.env
});

// Handle server process events
serverProcess.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Server process exited with code ${code}`);
    process.exit(code);
  }
}); 