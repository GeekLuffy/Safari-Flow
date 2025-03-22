import { Product } from '../types';
import { useNotificationStore } from '../stores/notificationStore';
import { createPurchaseOrder } from '@/api/purchaseOrder';
import { updateProduct, getAllProducts } from '@/api/product';

/**
 * Set up a timer to check for auto-reordering products periodically
 * This function should be called when the app initializes
 */
export const setupAutoReorderSchedule = () => {
  // Check for auto-reorder needs every 5 minutes
  console.log("Setting up auto-reorder schedule check");
  
  // Initial check after 10 seconds (to allow app to fully load)
  setTimeout(async () => {
    console.log("Running initial auto-reorder check");
    try {
      const products = await getAllProducts();
      await ReorderService.checkAndReorderProducts(products);
    } catch (error) {
      console.error("Failed to run initial auto-reorder check:", error);
    }
  }, 10000);
  
  // Set up recurring checks
  setInterval(async () => {
    console.log("Running scheduled auto-reorder check");
    try {
      const products = await getAllProducts();
      await ReorderService.checkAndReorderProducts(products);
    } catch (error) {
      console.error("Failed to run scheduled auto-reorder check:", error);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
};

export const ReorderService = {
  /**
   * Check if any products need reordering and create purchase orders for them
   */
  checkAndReorderProducts: async (products: Product[]) => {
    if (!products || products.length === 0) return;
    
    console.log("Checking for products that need reordering...");
    console.log(`Total products to check: ${products.length}`);
    
    // Filter products that need reordering
    const productsToReorder = products.filter(product => {
      const threshold = product.reorderLevel || 5;
      const needsReorder = product.autoReorder && 
                           product.stock <= threshold && 
                           product.targetStockLevel && 
                           product.targetStockLevel > product.stock &&
                           product.supplier; // Must have a supplier to reorder
      
      if (product.autoReorder) {
        console.log(`Product ${product.name}: autoReorder=${product.autoReorder}, stock=${product.stock}, threshold=${threshold}, targetLevel=${product.targetStockLevel}, needsReorder=${needsReorder}`);
      }
      
      return needsReorder;
    });
    
    console.log(`Found ${productsToReorder.length} products that need reordering`);
    
    if (productsToReorder.length === 0) return;
    
    // Group products by supplier
    const supplierGroups: Record<string, Product[]> = {};
    productsToReorder.forEach(product => {
      const supplier = product.supplier as string; // We've already filtered out undefined suppliers
      if (!supplierGroups[supplier]) {
        supplierGroups[supplier] = [];
      }
      supplierGroups[supplier].push(product);
    });
    
    // Create purchase orders by supplier
    for (const [supplier, products] of Object.entries(supplierGroups)) {
      try {
        // Create the purchase order data
        const purchaseOrderData = {
          supplierId: supplier,
          products: products.map(product => ({
            productId: product.id,
            quantity: (product.targetStockLevel || 0) - product.stock,
            unitPrice: product.costPrice
          })),
          status: 'pending',
          totalAmount: products.reduce((total, product) => {
            const quantity = (product.targetStockLevel || 0) - product.stock;
            return total + (product.costPrice * quantity);
          }, 0),
          orderDate: new Date(),
          expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        };
        
        console.log(`Creating auto purchase order for supplier ${supplier} with ${products.length} products`);
        
        // Call API to create purchase order
        const createdPO = await createPurchaseOrder(purchaseOrderData);
        console.log(`Successfully created purchase order:`, createdPO);
        
        // Notify about auto-reorder
        products.forEach(product => {
          ReorderService.notifyAutoReorder(product, (product.targetStockLevel || 0) - product.stock);
        });
      } catch (error) {
        console.error('Failed to create auto purchase order:', error);
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
      message: `${product.name}: Ordered ${quantity} units to restock to ${product.targetStockLevel} units`,
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
        console.log(`Setting target stock level to ${newTargetLevel} for product ${product.name}`);
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
        throw new Error('Target stock level cannot be negative');
      }
      
      // Update the product in the database
      const updatedProduct = await updateProduct(product.id, { 
        targetStockLevel: targetLevel 
      });
      
      return updatedProduct;
    } catch (error) {
      console.error('Failed to update target stock level:', error);
      return null;
    }
  }
}; 