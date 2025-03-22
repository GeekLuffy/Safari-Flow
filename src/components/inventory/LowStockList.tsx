import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Package, RefreshCw } from 'lucide-react';
import { Alert as AlertComponent, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ProductCard from './ProductCard';
import { Product } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { useQuery } from '@tanstack/react-query';
import { getAllProducts } from '@/api/product';
import ProductEditModal from './ProductEditModal';
import { Button } from '@/components/ui/button';
import { ReorderService } from '@/lib/services/reorderService';

const LowStockList: React.FC = () => {
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const { toast } = useToast();
  
  // Fetch products using React Query
  const { 
    data: products = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts,
    retry: 1
  });
  
  // Filter products with low stock
  useEffect(() => {
    if (products.length > 0) {
      const filtered = products.filter(product => {
        // If product has a reorder level, use it as threshold, otherwise use 5 as default
        const threshold = product.reorderLevel || 5;
        return product.stock <= threshold;
      });
      
      // Sort by stock level (lowest first)
      const sorted = [...filtered].sort((a, b) => a.stock - b.stock);
      
      setLowStockProducts(sorted);
    }
  }, [products]);
  
  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setEditModalOpen(true);
  };
  
  // Handle save product 
  const handleSaveProduct = (savedProduct: Product) => {
    try {
      // Close modal first to prevent UI glitches
      setEditModalOpen(false);
      
      // Force refetch after a short timeout
      setTimeout(() => {
        refetch();
        toast({
          title: 'Product Updated',
          description: 'Inventory has been updated successfully',
          variant: 'default',
        });
      }, 300);
    } catch (error: any) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle auto-reorder for eligible products
  const handleAutoReorder = async () => {
    try {
      setIsReordering(true);
      
      // Get eligible products (those with autoReorder enabled and below threshold)
      const eligibleProducts = lowStockProducts.filter(product => {
        const threshold = product.reorderLevel || 5;
        return product.autoReorder && 
               product.stock <= threshold && 
               product.targetStockLevel && 
               product.targetStockLevel > product.stock &&
               product.supplier;
      });
      
      if (eligibleProducts.length === 0) {
        toast({
          title: 'No Eligible Products',
          description: 'No products are set up for auto-reordering or all products have sufficient stock.',
          variant: 'default',
        });
        setIsReordering(false);
        return;
      }
      
      // Process auto-reorders
      await ReorderService.checkAndReorderProducts(products);
      
      toast({
        title: 'Auto-Reorder Complete',
        description: `Created purchase orders for ${eligibleProducts.length} products`,
        variant: 'default',
      });
    } catch (error: any) {
      console.error('Error during auto-reorder:', error);
      toast({
        title: 'Reorder Error',
        description: error.message || 'Failed to process auto-reorders',
        variant: 'destructive',
      });
    } finally {
      setIsReordering(false);
    }
  };
  
  // Count auto-reorder eligible products
  const eligibleForAutoReorder = lowStockProducts.filter(p => p.autoReorder && p.supplier).length;
  
  return (
    <div>
      {/* Error display */}
      {error && (
        <AlertComponent variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load inventory data. 
            {error instanceof Error ? ` ${error.message}` : ''}
          </AlertDescription>
        </AlertComponent>
      )}
      
      {/* Low stock products grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className="h-[320px] rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : lowStockProducts.length > 0 ? (
        <div>
          <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 flex-1">
              <h3 className="font-medium text-amber-900 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Low Stock Alert
              </h3>
              <p className="text-sm text-amber-700 mt-1">
                The following products are below their reorder threshold and need replenishment.
              </p>
            </div>
            
            {eligibleForAutoReorder > 0 && (
              <Button 
                onClick={handleAutoReorder} 
                disabled={isReordering}
                className="whitespace-nowrap h-full"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isReordering ? 'animate-spin' : ''}`} />
                {isReordering ? 'Processing...' : `Auto-Reorder (${eligibleForAutoReorder})`}
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {lowStockProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                onEdit={() => handleEditProduct(product)}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No low stock items found</h3>
          <p className="mt-2 text-muted-foreground">
            All your products have sufficient stock levels
          </p>
        </div>
      )}
      
      {/* Edit modal */}
      {productToEdit && (
        <ProductEditModal
          product={productToEdit}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSave={handleSaveProduct}
        />
      )}
    </div>
  );
};

export default LowStockList; 