// Self-contained script to initialize the database
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Please define the MONGODB_URI environment variable inside .env');
  process.exit(1);
}

// Define schemas
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  barcode: { type: String, required: true, unique: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  costPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  imageUrl: { type: String },
  supplier: { type: String },
  reorderLevel: { type: Number, min: 0 },
  autoReorder: { type: Boolean, default: false },
  targetStockLevel: { type: Number, min: 0 }
}, {
  timestamps: true
});

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  contactPerson: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true, trim: true },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }]
}, {
  timestamps: true
});

// Sample data
const mockProducts = [
  {
    name: 'Safari Adventure T-Shirt',
    barcode: '123456789001',
    category: 'Apparel',
    price: 29.99,
    costPrice: 12.99,
    stock: 42,
    imageUrl: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9',
    supplier: 'Jungle Threads Ltd',
    reorderLevel: 10
  },
  {
    name: 'Handcrafted Bastar Art Elephant',
    barcode: '123456789002',
    category: 'Bastar Art',
    price: 149.99,
    costPrice: 89.99,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1569385210018-127685230669',
    supplier: 'Tribal Artisans Co-op',
    reorderLevel: 5
  },
  {
    name: 'Jungle Safari Water Bottle',
    barcode: '123456789003',
    category: 'Bottles',
    price: 24.99,
    costPrice: 9.99,
    stock: 78,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    supplier: 'EcoBottle Supplies',
    reorderLevel: 20
  },
  {
    name: 'Animal Keyring Set',
    barcode: '123456789004',
    category: 'Keyrings',
    price: 12.99,
    costPrice: 4.99,
    stock: 120,
    imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4',
    supplier: 'Safari Gifts Inc',
    reorderLevel: 25
  }
];

const suppliers = [
  {
    name: 'Jungle Threads Ltd',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@junglethreads.com',
    phone: '+91-9876543210',
    address: '123 Safari Road, Bannerghatta, Bangalore 560083',
    products: []
  },
  {
    name: 'Tribal Artisans Co-op',
    contactPerson: 'Ravi Mehra',
    email: 'ravi@tribalartisans.org',
    phone: '+91-8765432109',
    address: '45 Heritage Lane, Bastar, Chhattisgarh 494001',
    products: []
  },
  {
    name: 'EcoBottle Supplies',
    contactPerson: 'Neha Patel',
    email: 'neha@ecobottle.com',
    phone: '+91-7654321098',
    address: '789 Green Avenue, Ooty, Tamil Nadu 643001',
    products: []
  },
  {
    name: 'Safari Gifts Inc',
    contactPerson: 'Amit Singh',
    email: 'amit@safarigifts.com',
    phone: '+91-6543210987',
    address: '56 Wildlife Road, Ranthambore, Rajasthan 322001',
    products: []
  }
];

async function initDatabase() {
  console.log('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Register models
    const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
    const SupplierModel = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
    
    // Clear existing data
    console.log('Clearing existing data...');
    await ProductModel.deleteMany({});
    await SupplierModel.deleteMany({});
    
    // Create suppliers
    console.log('Creating suppliers...');
    const createdSuppliers = await SupplierModel.insertMany(suppliers);
    console.log(`Created ${createdSuppliers.length} suppliers`);
    
    // Create products with proper supplier references
    console.log('Creating products...');
    const productsToCreate = mockProducts.map(product => {
      // Find matching supplier if any
      const matchingSupplier = createdSuppliers.find(s => s.name === product.supplier);
      
      return {
        ...product,
        // If we found a matching supplier, use its ID; otherwise leave as is
        supplier: matchingSupplier ? matchingSupplier._id : product.supplier
      };
    });
    
    const createdProducts = await ProductModel.insertMany(productsToCreate);
    console.log(`Created ${createdProducts.length} products`);
    
    // Update suppliers with their product references
    console.log('Updating supplier-product references...');
    for (const supplier of createdSuppliers) {
      const supplierProducts = createdProducts
        .filter(p => p.supplier?.toString() === supplier._id?.toString())
        .map(p => p._id);
      
      if (supplierProducts.length > 0) {
        await SupplierModel.findByIdAndUpdate(
          supplier._id,
          { products: supplierProducts },
          { new: true }
        );
      }
    }
    
    console.log('Database initialization complete');
    return { success: true };
  } catch (error) {
    console.error('Error initializing database:', error);
    return { success: false, error };
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
    console.log('Disconnected from database');
  }
}

// Run the initialization
initDatabase()
  .then(result => {
    if (result.success) {
      console.log('Successfully initialized the database');
      process.exit(0);
    } else {
      console.error('Failed to initialize the database');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 