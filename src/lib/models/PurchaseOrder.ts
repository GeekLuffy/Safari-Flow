import mongoose from 'mongoose';
import { PurchaseOrder } from '../types';

// Define the PurchaseOrder schema
const PurchaseOrderSchema = new mongoose.Schema({
  supplierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Supplier',
    required: true
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'ordered', 'received', 'canceled'],
    default: 'pending'
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  expectedDeliveryDate: {
    type: Date
  },
  deliveredDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Create and export the model if it doesn't already exist
export const PurchaseOrderModel = mongoose.models.PurchaseOrder || 
                                 mongoose.model<PurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);

// Function to get all purchase orders
export async function getAllPurchaseOrders(): Promise<PurchaseOrder[]> {
  return await PurchaseOrderModel.find({})
    .sort({ orderDate: -1 })
    .populate('supplierId')
    .populate('products.productId')
    .lean();
}

// Function to get purchase orders by status
export async function getPurchaseOrdersByStatus(status: string): Promise<PurchaseOrder[]> {
  return await PurchaseOrderModel.find({ status })
    .sort({ orderDate: -1 })
    .populate('supplierId')
    .populate('products.productId')
    .lean();
}

// Function to get a purchase order by ID
export async function getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
  return await PurchaseOrderModel.findById(id)
    .populate('supplierId')
    .populate('products.productId')
    .lean();
}

// Function to create a purchase order
export async function createPurchaseOrder(orderData: Omit<PurchaseOrder, 'id'>): Promise<PurchaseOrder> {
  const order = new PurchaseOrderModel(orderData);
  await order.save();
  return order.toObject();
}

// Function to update a purchase order
export async function updatePurchaseOrder(id: string, orderData: Partial<PurchaseOrder>): Promise<PurchaseOrder | null> {
  const order = await PurchaseOrderModel.findByIdAndUpdate(
    id,
    orderData,
    { new: true, runValidators: true }
  )
    .populate('supplierId')
    .populate('products.productId')
    .lean();
  
  return order;
}

// Function to update purchase order status
export async function updatePurchaseOrderStatus(id: string, status: 'pending' | 'ordered' | 'received' | 'canceled'): Promise<PurchaseOrder | null> {
  const updateData: any = { status };
  
  // If status is 'received', set deliveredDate to now
  if (status === 'received') {
    updateData.deliveredDate = new Date();
  }
  
  return await updatePurchaseOrder(id, updateData);
}

// Function to delete a purchase order
export async function deletePurchaseOrder(id: string): Promise<boolean> {
  const result = await PurchaseOrderModel.findByIdAndDelete(id);
  return !!result;
} 