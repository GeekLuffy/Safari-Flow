import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, SlidersHorizontal, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProductCard from './ProductCard';
import ProductEditModal from './ProductEditModal';
import { Product } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { NotificationService } from '@/lib/services/notificationService';
import { ReorderService } from '@/lib/services/reorderService';
import { getAllProducts, createProduct, updateProduct, deleteProduct as apiDeleteProduct } from '@/api/product';

const InventoryList: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
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
  
  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product Added',
        description: 'New product has been added to your inventory',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create product',
        variant: 'destructive',
      });
    }
  });
  
  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: Partial<Product> }) => updateProduct(id, data),
    onSuccess: (updatedProduct, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      
      // Check if stock level was updated
      if ('stock' in variables.data) {
        // Retrieve all products to check for auto-reorder
        getAllProducts().then(allProducts => {
          // Check for auto-reorder needs
          ReorderService.checkAndReorderProducts(allProducts);
        });
      }
      
      toast({
        title: 'Product Updated',
        description: 'Product has been updated in your inventory',
        variant: 'default',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update product',
        variant: 'destructive',
      });
    }
  });
  
  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiDeleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: 'Product Deleted',
        description: 'Product has been removed from your inventory',
        variant: 'default',
      });
      setConfirmDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete product',
        variant: 'destructive',
      });
    }
  });
  
  // Get unique categories from actual data
  const categories = ['all', ...Array.from(new Set(products.map(p => p.category)))];
  
  // Filter and sort products whenever products, searchQuery, or category changes
  useEffect(() => {
    // Function to filter products
    const filterProducts = () => {
      const filtered = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.barcode.includes(searchQuery);
        const matchesCategory = category === 'all' || product.category === category;
        return matchesSearch && matchesCategory;
      });
      
      // Sort filtered products
      const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'price-asc':
            return a.price - b.price;
          case 'price-desc':
            return b.price - a.price;
          case 'stock-asc':
            return a.stock - b.stock;
          case 'stock-desc':
            return b.stock - a.stock;
          default:
            return 0;
        }
      });
      
      setFilteredProducts(sorted);
    };
    
    filterProducts();
  }, [products, searchQuery, category, sortBy]);
  
  // Handle edit product
  const handleEditProduct = (product: Product) => {
    setProductToEdit(product);
    setEditModalOpen(true);
  };
  
  // Handle save product (new or edited)
  const handleSaveProduct = (savedProduct: Product) => {
    try {
      if (savedProduct.id === 'new') {
        // Create new product
        const { id, createdAt, updatedAt, ...productData } = savedProduct;
        createProductMutation.mutate(productData);
      } else {
        // Update existing product
        const { id, createdAt, updatedAt, ...productData } = savedProduct;
        updateProductMutation.mutate({ id, data: productData });
      }
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Handle delete product confirmation
  const handleDeleteConfirm = (product: Product) => {
    setProductToDelete(product);
    setConfirmDialogOpen(true);
  };
  
  // Delete product
  const deleteProduct = () => {
    if (!productToDelete) return;
    
    deleteProductMutation.mutate(productToDelete.id);
  };
  
  // Create a new empty product
  const createEmptyProduct = (): Product => ({
    id: 'new',
    name: '',
    barcode: '',
    category: '',
    price: 0,
    costPrice: 0,
    stock: 0,
    imageUrl: '',
    supplier: '',
    reorderLevel: 0,
    autoReorder: false,
    targetStockLevel: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // Handle click on add product button
  const handleAddProduct = () => {
    setProductToEdit(createEmptyProduct());
    setEditModalOpen(true);
  };
  
  const handleProductUpdated = (updatedProduct: Product) => {
    // Update the product in the list
    setFilteredProducts(prevProducts => 
      prevProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
    );
  };
  
  return (
    <div>
      {/* Error display */}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load inventory data. 
            {error instanceof Error ? ` ${error.message}` : ''}
          </AlertDescription>
        </Alert>
      )}
      
      {/* Search and filter controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search products..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-row gap-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat === 'all' ? 'All Categories' : cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name (A-Z)</SelectItem>
              <SelectItem value="price-asc">Price (Low to High)</SelectItem>
              <SelectItem value="price-desc">Price (High to Low)</SelectItem>
              <SelectItem value="stock-asc">Stock (Low to High)</SelectItem>
              <SelectItem value="stock-desc">Stock (High to Low)</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleAddProduct}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>
      
      {/* Product grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className="h-[320px] rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map(product => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onEdit={() => handleEditProduct(product)}
              onDelete={() => handleDeleteConfirm(product)}
              onProductUpdated={handleProductUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">No products found</h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || category !== 'all' 
              ? "Try adjusting your search or filter criteria" 
              : "Get started by adding your first product"}
          </p>
          {!searchQuery && category === 'all' && (
            <Button onClick={handleAddProduct} className="mt-4">
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          )}
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
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {productToDelete?.name} from your inventory.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={deleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default InventoryList;
