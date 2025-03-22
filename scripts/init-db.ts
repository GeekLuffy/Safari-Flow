import { initDatabase } from '../src/lib/initDb.js';

// Run the database initialization
(async () => {
  console.log('Starting database initialization...');
  
  try {
    const result = await initDatabase();
    
    if (result.success) {
      console.log('Database initialization completed successfully');
      process.exit(0);
    } else {
      console.error('Database initialization failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('Unhandled error during database initialization:', error);
    process.exit(1);
  }
})(); 