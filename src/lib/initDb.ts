import bcrypt from 'bcryptjs';
import { connectToDatabase, disconnectFromDatabase } from './db';
import { UserModel } from './models/User';

interface InitializationResult {
  success: boolean;
  error?: string;
}

// Default admin user
const defaultAdmin = {
  name: 'Admin User',
  email: 'admin@example.com',
  password: 'password',  // This will be hashed
  role: 'admin'
};

// Default staff user
const defaultStaff = {
  name: 'Staff User',
  email: 'staff@example.com',
  password: 'password',  // This will be hashed
  role: 'staff'
};

export async function initDatabase(): Promise<InitializationResult> {
  try {
    // Connect to MongoDB
    await connectToDatabase();
    console.log('Connected to database successfully');
    
    // Initialize Users collection
    await initUsers();
    console.log('Users initialized successfully');
    
    // Disconnect from MongoDB
    await disconnectFromDatabase();
    
    return { success: true };
  } catch (error: any) {
    console.error('Database initialization failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function initUsers() {
  // Check if users collection already has documents
  const userCount = await UserModel.countDocuments();
  
  // If users already exist, skip initialization
  if (userCount > 0) {
    console.log(`Users collection already has ${userCount} documents. Skipping initialization.`);
    return;
  }
  
  console.log('Creating default users...');
  
  // Create default admin user
  const adminSalt = await bcrypt.genSalt(10);
  const adminHashedPassword = await bcrypt.hash(defaultAdmin.password, adminSalt);
  
  await UserModel.create({
    name: defaultAdmin.name,
    email: defaultAdmin.email,
    password: adminHashedPassword,
    role: defaultAdmin.role,
    avatar: 'https://github.com/shadcn.png'
  });
  
  // Create default staff user
  const staffSalt = await bcrypt.genSalt(10);
  const staffHashedPassword = await bcrypt.hash(defaultStaff.password, staffSalt);
  
  await UserModel.create({
    name: defaultStaff.name,
    email: defaultStaff.email,
    password: staffHashedPassword,
    role: defaultStaff.role,
    avatar: 'https://github.com/shadcn.png'
  });
  
  console.log('Default users created successfully');
}