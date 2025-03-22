// This is a plain JavaScript version of the initialization script
// It directly requires the compiled JavaScript version or uses dynamic import

async function main() {
  console.log('Starting database initialization...');
  
  try {
    // Use dynamic import for ESM compatibility
    const { initDatabase } = await import('../src/lib/initDb.js');
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
}

main(); 