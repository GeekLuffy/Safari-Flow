import { useNotificationStore } from '../stores/notificationStore';
import { Product } from '../types';

// Default threshold when product doesn't have a reorderLevel
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Keep track of last notification times
let lastNotificationTimes: { [key: string]: number } = {};

// Function to get the notification store from outside a React component
const getNotificationStore = () => {
  return useNotificationStore.getState();
};

// Helper to check if enough time has passed since last notification
const canShowNotification = (key: string): boolean => {
  const now = Date.now();
  const lastTime = lastNotificationTimes[key] || 0;
  if (now - lastTime > 2000) { // 2 seconds debounce
    lastNotificationTimes[key] = now;
    return true;
  }
  return false;
};

// Notification service functions
export const NotificationService = {
  // Check stock levels and create notifications for low/out of stock items
  checkStockLevels: async (products: Product[]) => {
    if (!canShowNotification('stock-check')) return;
    
    const store = getNotificationStore();
    const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= 5);
    const outOfStockItems = products.filter(p => p.stock === 0);
    
    console.log(`Found ${lowStockItems.length} low stock items, ${outOfStockItems.length} out of stock items`);
    
    // Create notifications for low stock items
    lowStockItems.forEach(product => {
      store.addNotification({
        type: 'warning',
        title: 'Low Stock Alert',
        message: `${product.name} is running low (${product.stock} left, threshold: 5)`,
        link: '/inventory'
      });
    });
    
    // Create notifications for out of stock items
    outOfStockItems.forEach(product => {
      store.addNotification({
        type: 'error',
        title: 'Out of Stock Alert',
        message: `${product.name} is out of stock!`,
        link: '/inventory'
      });
    });
  },
  
  // Notify when a new product is added
  notifyNewProduct: (product: Product) => {
    if (!canShowNotification(`new-product-${product.id}`)) return;
    
    const store = getNotificationStore();
    
    store.addNotification({
      type: 'success',
      title: 'New Product Added',
      message: `${product.name} has been added to inventory`,
      link: '/inventory'
    });
    
    console.log(`NEW PRODUCT: ${product.name} has been added to inventory`);
  },
  
  // Notify when a product is updated
  notifyProductUpdate: (product: Product) => {
    if (!canShowNotification(`product-update-${product.id}`)) return;
    
    const store = getNotificationStore();
    
    store.addNotification({
      type: 'info',
      title: 'Product Updated',
      message: `${product.name} has been updated`,
      link: '/inventory'
    });
    
    console.log(`PRODUCT UPDATED: ${product.name} has been updated`);
  },
  
  // Notify for new transaction
  notifyNewTransaction: (totalAmount: number, items: number) => {
    if (!canShowNotification('new-transaction')) return;
    
    const store = getNotificationStore();
    const formattedAmount = totalAmount.toLocaleString();
    
    store.addNotification({
      type: 'success',
      title: 'New Transaction',
      message: `₹${formattedAmount} sale completed for ${items} item${items !== 1 ? 's' : ''}`,
      link: '/transactions'
    });
    
    console.log(`NEW TRANSACTION: ₹${formattedAmount} sale completed for ${items} item${items !== 1 ? 's' : ''}`);
  },
  
  // Notify for stock update after a transaction
  notifyStockUpdate: (itemsUpdated: number) => {
    if (!canShowNotification('stock-update')) return;
    
    const store = getNotificationStore();
    
    store.addNotification({
      type: 'info',
      title: 'Stock Updated',
      message: `Stock levels updated for ${itemsUpdated} product${itemsUpdated !== 1 ? 's' : ''}`,
      link: '/inventory'
    });
    
    console.log(`STOCK UPDATED: Stock levels updated for ${itemsUpdated} product${itemsUpdated !== 1 ? 's' : ''}`);
  }
}; 