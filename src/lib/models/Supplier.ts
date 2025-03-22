import mongoose from 'mongoose';
import { Supplier } from '../types';

// Define the Supplier schema
const SupplierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  contactPerson: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

// Create and export the model if it doesn't already exist
export const SupplierModel = mongoose.models.Supplier || mongoose.model<Supplier>('Supplier', SupplierSchema);

// Function to get all suppliers
export async function getAllSuppliers(): Promise<Supplier[]> {
  return await SupplierModel.find({}).sort({ name: 1 }).lean();
}

// Function to get a supplier by ID
export async function getSupplierById(id: string): Promise<Supplier | null> {
  return await SupplierModel.findById(id).lean();
}

// Function to create a supplier
export async function createSupplier(supplierData: Omit<Supplier, 'id'>): Promise<Supplier> {
  const supplier = new SupplierModel(supplierData);
  await supplier.save();
  return supplier.toObject();
}

// Function to update a supplier
export async function updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> {
  const supplier = await SupplierModel.findByIdAndUpdate(
    id,
    supplierData,
    { new: true, runValidators: true }
  ).lean();
  
  return supplier;
}

// Function to delete a supplier
export async function deleteSupplier(id: string): Promise<boolean> {
  const result = await SupplierModel.findByIdAndDelete(id);
  return !!result;
} 