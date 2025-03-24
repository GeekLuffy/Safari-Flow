import { useNotificationStore } from '../stores/notificationStore';
import { Product } from '../types';

// Default threshold when product doesn't have a reorderLevel
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

// Function to get the notification store from outside a React component
const getNotificationStore = () => {
  return useNotificationStore.getState();
};

// Notification service functions
export const NotificationService = {
  // Check stock levels and create notifications for low/out of stock items
  checkStockLevels: (products: Product[]) => {
    if (!products || products.length === 0) return;
    
    const lowStockItems = products.filter(p => {
      // Use product's reorderLevel if available, otherwise use default threshold
      const threshold = p.reorderLevel || DEFAULT_LOW_STOCK_THRESHOLD;
      return p.stock > 0 && p.stock <= threshold;
    });
    
    const outOfStockItems = products.filter(p => p.stock === 0);
    
    console.log(`Found ${lowStockItems.length} low stock items, ${outOfStockItems.length} out of stock items`);
    
    // Notify for out of stock items
    outOfStockItems.forEach(product => {
      NotificationService.createStockAlert(product, 'out');
    });
    
    // Notify for low stock items
    lowStockItems.forEach(product => {
      NotificationService.createStockAlert(product, 'low');
    });
  },
  
  // Create stock alert notification
  createStockAlert: (product: Product, level: 'low' | 'out') => {
    // Verify the product exists and has valid data
    if (!product || !product.name) {
      console.warn('Attempted to create stock alert for invalid product');
      return;
    }
    
    const store = getNotificationStore();
    
    // For low stock, include the threshold in the message
    const threshold = product.reorderLevel || DEFAULT_LOW_STOCK_THRESHOLD;
    
    console.log(`Creating ${level} stock alert for ${product.name} (${product.stock}/${threshold})`);
    
    store.addNotification({
      type: level === 'out' ? 'error' : 'warning',
      title: `${level === 'out' ? 'Out of Stock' : 'Low Stock'} Alert`,
      message: level === 'out'
        ? `${product.name} is out of stock`
        : `${product.name} is running low (${product.stock} left, threshold: ${threshold})`,
      link: '/inventory'
    });
  },
  
  // Notify when a new product is added
  notifyNewProduct: (product: Product) => {
    const store = getNotificationStore();
    
    store.addNotification({
      type: 'success',
      title: 'New Product Added',
      message: `${product.name} has been added to inventory`,
      link: '/inventory'
    });
  },
  
  // Notify when a product is updated
  notifyProductUpdate: (product: Product) => {
    const store = getNotificationStore();
    
    store.addNotification({
      type: 'info',
      title: 'Product Updated',
      message: `${product.name} has been updated`,
      link: '/inventory'
    });
  },
  
  // Notify for new transaction
  notifyNewTransaction: (totalAmount: number, items: number) => {
    const store = getNotificationStore();
    
    console.log(`Creating transaction notification: ₹${totalAmount} for ${items} items`);
    
    store.addNotification({
      type: 'success',
      title: 'New Transaction',
      message: `₹${totalAmount.toLocaleString()} sale completed for ${items} item${items > 1 ? 's' : ''}`,
      link: '/transactions'
    });
  },
  
  // Notify for stock update after a transaction
  notifyStockUpdate: (itemsUpdated: number) => {
    const store = getNotificationStore();
    
    console.log(`Creating stock update notification for ${itemsUpdated} items`);
    
    store.addNotification({
      type: 'info',
      title: 'Stock Updated',
      message: `Stock levels updated for ${itemsUpdated} product${itemsUpdated > 1 ? 's' : ''}`,
      link: '/inventory'
    });
  }
}; 