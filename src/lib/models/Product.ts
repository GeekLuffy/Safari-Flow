import mongoose from 'mongoose';
import { Product } from '../types';
import { mockProducts } from '../mockData';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Define the Product schema (only used in Node.js environment)
const ProductSchema = !isBrowser ? new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  barcode: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  imageUrl: {
    type: String
  },
  supplier: {
    type: String
  },
  reorderLevel: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
}) : null;

// Create and export the model if it doesn't already exist and we're not in a browser
export const ProductModel = !isBrowser ? 
  (mongoose.models.Product || mongoose.model<Product>('Product', ProductSchema!)) : 
  null;

// For a browser environment, we'll create a mock implementation
export async function getAllProducts(): Promise<Product[]> {
  // In browser, we just return mock data
  console.log('Fetching products (browser mode)');
  return Promise.resolve(mockProducts);
}

export async function getProductById(id: string): Promise<Product | null> {
  // In browser, we find in mock data
  const product = mockProducts.find(p => p.id === id);
  return Promise.resolve(product || null);
}

export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  // In browser, we just log and return a mock
  console.log('Creating product (browser mode - no actual database update)');
  return Promise.resolve({
    ...productData,
    id: `mock-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  } as Product);
}

export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
  // In browser, we just log and return a mock
  console.log('Updating product (browser mode - no actual database update)');
  
  // Find the existing product in mocks
  const existingProduct = mockProducts.find(p => p.id === id);
  if (!existingProduct) {
    return Promise.resolve(null);
  }
  
  return Promise.resolve({
    ...existingProduct,
    ...productData,
    updatedAt: new Date()
  } as Product);
}

export async function deleteProduct(id: string): Promise<boolean> {
  // In browser, we just log and return success
  console.log('Deleting product (browser mode - no actual database update)');
  return Promise.resolve(true);
}

export async function searchProducts(query: string, category?: string): Promise<Product[]> {
  // In browser, we filter the mock data
  console.log('Searching products (browser mode)');
  
  const filtered = mockProducts.filter(product => {
    const matchesSearch = !query || 
      product.name.toLowerCase().includes(query.toLowerCase()) ||
      product.barcode.includes(query);
    const matchesCategory = !category || category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  
  return Promise.resolve(filtered.sort((a, b) => a.name.localeCompare(b.name)));
}

// If we need to access the actual mongoose model, it would be in a separate file
// that is only imported on the server side 