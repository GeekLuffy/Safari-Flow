import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { getAllProducts } from '@/api/product';
import { Product } from '@/lib/types';
import ProductCard from '@/components/inventory/ProductCard';

export const LowStockList = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [displayLimit, setDisplayLimit] = useState(6);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const allProducts = await getAllProducts();
        setProducts(allProducts);
        setError('');
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleProductUpdated = (updatedProduct: Product) => {
    // Update the product in the products state
    setProducts(prevProducts => 
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };

  // Filter products with low stock
  const lowStockProducts = products.filter(product => {
    const reorderLevel = product.reorderLevel || 5; // Default to 5 if not set
    return product.stock <= reorderLevel;
  });

  // Sort by lowest stock percentage first
  const sortedLowStock = [...lowStockProducts].sort((a, b) => {
    const aLevel = a.reorderLevel || 5;
    const bLevel = b.reorderLevel || 5;
    const aPercentage = a.stock / aLevel;
    const bPercentage = b.stock / bLevel;
    return aPercentage - bPercentage;
  });

  // Limit number of products displayed
  const displayedProducts = sortedLowStock.slice(0, displayLimit);
  const hasMore = sortedLowStock.length > displayLimit;

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">Low Stock Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="text-center text-destructive p-4">{error}</div>
        ) : displayedProducts.length === 0 ? (
          <div className="text-center text-muted-foreground p-4">
            No low stock products found
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
              {displayedProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product}
                  onProductUpdated={handleProductUpdated}
                />
              ))}
            </div>
            
            {hasMore && (
              <div className="text-center mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setDisplayLimit(prev => prev + 6)}
                >
                  Show More
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}; 