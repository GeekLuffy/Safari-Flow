import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config(); // Load from .env
// Try to load from .env.local if it exists
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

// Ensure MongoDB URI is set
if (!process.env.VITE_MONGODB_URI) {
  console.error('ERROR: VITE_MONGODB_URI is not defined in environment variables');
  console.error('Please make sure your .env or .env.local file has VITE_MONGODB_URI set');
  process.exit(1);
}

// Get the current directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starting server with MongoDB URI:', process.env.VITE_MONGODB_URI ? 'Defined' : 'Not defined');

// Function to start the server
function startServer() {
  // Start the server as a child process
  const server = spawn('node', [join(__dirname, 'server.js')], {
    stdio: 'inherit',
    env: process.env
  });
  
  // Handle server close event
  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
    
    // If the server exited with an error, restart it after a delay
    if (code !== 0) {
      console.log('Server crashed, restarting in 5 seconds...');
      setTimeout(startServer, 5000);
    }
  });
  
  // Handle server error event
  server.on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

// Start the server
startServer(); 