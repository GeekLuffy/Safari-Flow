import { Product } from '../types';
import { useNotificationStore } from '../stores/notificationStore';
import { createPurchaseOrder } from '@/api/purchaseOrder';
import { updateProduct, getAllProducts } from '@/api/product';

// Keep track of last reorder times
const lastReorderTimes = new Map<string, number>();
const REORDER_COOLDOWN = 30 * 60 * 1000; // 30 minutes cooldown

/**
 * Set up a timer to check for auto-reordering products periodically
 * This function should be called when the app initializes
 */
export const setupAutoReorderSchedule = () => {
  let isChecking = false;
  
  const checkForReorders = async () => {
    if (isChecking) {
      console.log("Skipping reorder check - previous check still in progress");
      return;
    }
    
    try {
      isChecking = true;
      const products = await getAllProducts();
      await ReorderService.checkAndReorderProducts(products);
    } catch (error) {
      console.error("Failed to run auto-reorder check:", error);
    } finally {
      isChecking = false;
    }
  };
  
  // Initial check after 1 minute
  setTimeout(checkForReorders, 60 * 1000);
  
  // Check every 15 minutes
  setInterval(checkForReorders, 15 * 60 * 1000);
};

export const ReorderService = {
  /**
   * Check products and create purchase orders for those that need restocking
   */
  checkAndReorderProducts: async (products: Product[]) => {
    if (!products || products.length === 0) return;
    
    const now = Date.now();
    const supplierGroups: { [key: string]: Product[] } = {};
    
    // Filter products that need reordering
    products.forEach(product => {
      if (!product.autoReorder || !product.targetStockLevel || product.targetStockLevel <= 0) return;
      
      const lastReorderTime = lastReorderTimes.get(product.id) || 0;
      const timeSinceLastReorder = now - lastReorderTime;
      
      if (product.stock < product.reorderLevel && timeSinceLastReorder >= REORDER_COOLDOWN) {
        const supplierId = product.supplier?.toString() || 'default';
        if (!supplierGroups[supplierId]) {
          supplierGroups[supplierId] = [];
        }
        supplierGroups[supplierId].push(product);
        lastReorderTimes.set(product.id, now);
      }
    });
    
    // Create purchase orders by supplier
    for (const [supplier, supplierProducts] of Object.entries(supplierGroups)) {
      try {
        const orderProducts = supplierProducts.map(product => ({
          productId: product.id,
          quantity: product.targetStockLevel,
          unitPrice: product.costPrice
        }));
        
        const purchaseOrderData = {
          supplierId: supplier,
          products: orderProducts,
          status: 'pending',
          totalAmount: orderProducts.reduce((total, item) => 
            total + (item.quantity * item.unitPrice), 0),
          orderDate: new Date(),
          expectedDeliveryDate: new Date(now + 7 * 24 * 60 * 60 * 1000)
        };
        
        await createPurchaseOrder(purchaseOrderData);
        
        // Send notifications
        supplierProducts.forEach(product => {
          ReorderService.notifyAutoReorder(product, product.targetStockLevel);
        });
      } catch (error) {
        console.error('Failed to create auto purchase order:', error);
        // Reset reorder times for failed products
        supplierProducts.forEach(product => lastReorderTimes.delete(product.id));
      }
    }
  },
  
  /**
   * Create a notification for auto-reorder
   */
  notifyAutoReorder: (product: Product, quantity: number) => {
    const { addNotification } = useNotificationStore.getState();
    addNotification({
      type: 'info',
      title: 'Auto Reorder Initiated',
      message: `${product.name}: Ordered ${quantity} units (Standard Order Quantity)`,
      link: '/purchase-orders'
    });
  },
  
  /**
   * Toggle auto-reorder status for a product and persist it to the database
   */
  toggleAutoReorder: async (product: Product, enabled: boolean): Promise<Product | null> => {
    try {
      console.log(`Toggling auto-reorder for product ${product.name} (${product.id}) to ${enabled}`);
      
      // Set a reasonable target stock level if enabling auto-reorder and no target is set
      let updateData: Partial<Product> = { autoReorder: enabled };
      
      // If enabling auto-reorder and no target level is set, set a default one
      if (enabled && (!product.targetStockLevel || product.targetStockLevel <= 0)) {
        // Set target to reorderLevel * 2 or at least 10 units
        const newTargetLevel = Math.max((product.reorderLevel || 5) * 2, 10);
        updateData.targetStockLevel = newTargetLevel;
        console.log(`Setting standard order quantity to ${newTargetLevel} for product ${product.name}`);
      }
      
      // Update the product in the database
      console.log(`Calling updateProduct API with:`, { id: product.id, data: updateData });
      const updatedProduct = await updateProduct(product.id, updateData);
      
      if (!updatedProduct) {
        console.error(`Failed to toggle auto-reorder for ${product.name} - API returned null`);
        return null;
      }
      
      console.log('Successfully updated product from API:', updatedProduct);
      
      // Verify the update was correctly applied
      if (updatedProduct.autoReorder !== enabled) {
        console.warn(`API returned product with autoReorder=${updatedProduct.autoReorder}, expected ${enabled}`);
      }
      
      return updatedProduct;
    } catch (error) {
      console.error(`Failed to toggle auto-reorder status for ${product.name}:`, error);
      return null;
    }
  },
  
  /**
   * Update target stock level for a product and persist it to the database
   */
  updateTargetStockLevel: async (product: Product, targetLevel: number): Promise<Product | null> => {
    try {
      if (targetLevel < 0) {
        throw new Error('Standard order quantity cannot be negative');
      }
      
      // Update the product in the database
      const updatedProduct = await updateProduct(product.id, { 
        targetStockLevel: targetLevel 
      });
      
      return updatedProduct;
    } catch (error) {
      console.error('Failed to update standard order quantity:', error);
      return null;
    }
  }
}; 