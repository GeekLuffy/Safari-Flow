import { PurchaseOrder } from '../lib/types';
import { updateProduct, getProductById } from './product';

// API Base URL
const API_BASE_URL = '/api';

// Fallback to mock data when API fails
let useFallbackMode = false;

// Mock purchase orders for fallback mode
const mockPurchaseOrders: PurchaseOrder[] = [];
let nextOrderId = 1;

/**
 * Get all purchase orders
 */
export const getAllPurchaseOrders = async (): Promise<PurchaseOrder[]> => {
  if (useFallbackMode) {
    return Promise.resolve(mockPurchaseOrders);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch purchase orders: ${response.status}`);
    }
    
    const data = await response.json();
    return data.map((order: any) => ({
      ...order,
      orderDate: new Date(order.orderDate),
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined,
      deliveredDate: order.deliveredDate ? new Date(order.deliveredDate) : undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    }));
  } catch (error) {
    console.error('Error fetching purchase orders:', error);
    useFallbackMode = true;
    return mockPurchaseOrders;
  }
};

/**
 * Get a specific purchase order by ID
 */
export const getPurchaseOrderById = async (id: string): Promise<PurchaseOrder | null> => {
  if (useFallbackMode) {
    const order = mockPurchaseOrders.find(o => o.id === id);
    return Promise.resolve(order || null);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to fetch purchase order: ${response.status}`);
    }
    
    const order = await response.json();
    return {
      ...order,
      orderDate: new Date(order.orderDate),
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined,
      deliveredDate: order.deliveredDate ? new Date(order.deliveredDate) : undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    };
  } catch (error) {
    console.error('Error fetching purchase order:', error);
    useFallbackMode = true;
    const order = mockPurchaseOrders.find(o => o.id === id);
    return order || null;
  }
};

/**
 * Create a new purchase order
 */
export const createPurchaseOrder = async (orderData: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
  if (useFallbackMode) {
    const newOrder: PurchaseOrder = {
      id: `po-${nextOrderId++}`,
      supplierId: orderData.supplierId || '',
      products: orderData.products || [],
      status: orderData.status || 'pending',
      totalAmount: orderData.totalAmount || 0,
      orderDate: orderData.orderDate || new Date(),
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      deliveredDate: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockPurchaseOrders.push(newOrder);
    return Promise.resolve(newOrder);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/purchase-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create purchase order: ${response.status}`);
    }
    
    const order = await response.json();
    return {
      ...order,
      orderDate: new Date(order.orderDate),
      expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate) : undefined,
      deliveredDate: order.deliveredDate ? new Date(order.deliveredDate) : undefined,
      createdAt: new Date(order.createdAt),
      updatedAt: new Date(order.updatedAt)
    };
  } catch (error) {
    console.error('Error creating purchase order:', error);
    useFallbackMode = true;
    
    const newOrder: PurchaseOrder = {
      id: `po-${nextOrderId++}`,
      supplierId: orderData.supplierId || '',
      products: orderData.products || [],
      status: orderData.status || 'pending',
      totalAmount: orderData.totalAmount || 0,
      orderDate: orderData.orderDate || new Date(),
      expectedDeliveryDate: orderData.expectedDeliveryDate,
      deliveredDate: undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockPurchaseOrders.push(newOrder);
    return newOrder;
  }
};

/**
 * Update purchase order status and handle stock updates when necessary
 */
export const updatePurchaseOrderStatus = async (
  id: string, 
  status: 'pending' | 'ordered' | 'received' | 'canceled',
  updateStock: boolean = true
): Promise<PurchaseOrder | null> => {
  if (useFallbackMode) {
    const orderIndex = mockPurchaseOrders.findIndex(o => o.id === id);
    if (orderIndex === -1) return null;
    
    const order = mockPurchaseOrders[orderIndex];
    
    // If marking as received, update stock levels (only in fallback mode)
    if (status === 'received' && order.status !== 'received' && updateStock) {
      await updateStockLevels(order);
    }
    
    const updatedOrder = {
      ...order,
      status,
      deliveredDate: status === 'received' ? new Date() : order.deliveredDate,
      updatedAt: new Date()
    };
    
    mockPurchaseOrders[orderIndex] = updatedOrder;
    return Promise.resolve(updatedOrder);
  }
  
  try {
    // First, get the current order to see if it's already received
    const currentOrder = await getPurchaseOrderById(id);
    if (!currentOrder) {
      throw new Error('Purchase order not found');
    }
    
    const response = await fetch(`${API_BASE_URL}/purchase-orders/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to update purchase order status: ${response.status}`);
    }
    
    const updatedOrder = await response.json();
    const result = {
      ...updatedOrder,
      orderDate: new Date(updatedOrder.orderDate),
      expectedDeliveryDate: updatedOrder.expectedDeliveryDate ? new Date(updatedOrder.expectedDeliveryDate) : undefined,
      deliveredDate: updatedOrder.deliveredDate ? new Date(updatedOrder.deliveredDate) : undefined,
      createdAt: new Date(updatedOrder.createdAt),
      updatedAt: new Date(updatedOrder.updatedAt)
    };
    
    // Note: We don't need to update stock levels here as the server handles this
    // when the status is changed to 'received'
    
    return result;
  } catch (error) {
    console.error('Error updating purchase order status:', error);
    useFallbackMode = true;
    return updatePurchaseOrderStatus(id, status, updateStock);
  }
};

/**
 * Update stock levels based on a received purchase order
 */
export const updateStockLevels = async (order: PurchaseOrder): Promise<void> => {
  console.log(`Updating stock levels for purchase order ${order.id}`);
  
  if (order.status !== 'received') {
    console.warn(`Cannot update stock for order ${order.id} with status ${order.status}`);
    return;
  }
  
  // Process each product in the order
  for (const item of order.products) {
    try {
      // Get current product
      const product = await getProductById(item.productId.toString());
      
      if (!product) {
        console.error(`Product not found: ${item.productId}`);
        continue;
      }
      
      // Calculate new stock level
      const newStock = product.stock + item.quantity;
      console.log(`Updating ${product.name} stock from ${product.stock} to ${newStock}`);
      
      // Update the product
      const updatedProduct = await updateProduct(product.id, {
        stock: newStock
      });
      
      if (updatedProduct) {
        console.log(`Successfully updated stock for ${product.name}`);
      } else {
        console.error(`Failed to update stock for ${product.name}`);
      }
    } catch (error) {
      console.error(`Error updating stock for product ${item.productId}:`, error);
    }
  }
  
  console.log(`Completed stock update for purchase order ${order.id}`);
}; 