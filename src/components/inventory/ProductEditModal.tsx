import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Product, Supplier } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { createProduct, updateProduct } from '@/api/product';
import { Checkbox } from '@/components/ui/checkbox';
import { getAllSuppliers } from '@/api/supplier';
import { useQuery } from '@tanstack/react-query';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Validation schema
const formSchema = z.object({
  id: z.string(),
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  barcode: z.string().min(8, { message: 'Barcode must be at least 8 characters' }),
  category: z.string().min(1, { message: 'Category is required' }),
  price: z.coerce.number().min(0.01, { message: 'Price must be at least 0.01' }),
  costPrice: z.coerce.number().min(0.01, { message: 'Cost price must be at least 0.01' }),
  stock: z.coerce.number().int().min(0, { message: 'Stock must be a positive integer or zero' }),
  imageUrl: z.string().optional(),
  supplier: z.string().optional(),
  reorderLevel: z.coerce.number().int().min(0).optional(),
  autoReorder: z.boolean().optional(),
  targetStockLevel: z.coerce.number().int().min(0).optional(),
});

interface ProductEditModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => void;
}

type FormValues = z.infer<typeof formSchema>;

const ProductEditModal: React.FC<ProductEditModalProps> = ({ 
  product, 
  isOpen, 
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const isNewProduct = product?.id === 'new';
  const title = isNewProduct ? 'Add New Product' : 'Edit Product';
  
  // Fetch suppliers for the dropdown
  const { data: suppliers = [] } = useQuery({
    queryKey: ['suppliers'],
    queryFn: getAllSuppliers,
    // Only fetch when modal is open
    enabled: isOpen,
  });
  
  // Initialize form with default or product values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: product?.id || 'new',
      name: product?.name || '',
      barcode: product?.barcode || '',
      category: product?.category || '',
      price: product?.price || 0,
      costPrice: product?.costPrice || 0,
      stock: product?.stock || 0,
      imageUrl: product?.imageUrl || '',
      supplier: product?.supplier || '',
      reorderLevel: product?.reorderLevel || 0,
      autoReorder: product?.autoReorder || false,
      targetStockLevel: product?.targetStockLevel || 0,
    }
  });
  
  // Reset form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        id: product.id || 'new',
        name: product.name || '',
        barcode: product.barcode || '',
        category: product.category || '',
        price: product.price || 0,
        costPrice: product.costPrice || 0,
        stock: product.stock || 0,
        imageUrl: product.imageUrl || '',
        supplier: product.supplier || '',
        reorderLevel: product.reorderLevel || 0,
        autoReorder: product.autoReorder || false,
        targetStockLevel: product.targetStockLevel || 0,
      });
    }
  }, [product, form]);
  
  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      let savedProduct: Product;
      
      if (isNewProduct) {
        // Create new product in MongoDB
        const { id, ...productData } = values;
        savedProduct = await createProduct(productData);
        toast({
          title: "Product Added",
          description: `${values.name} has been added to your inventory`,
          variant: 'default',
        });
      } else {
        // Update existing product in MongoDB
        const { id, ...updateData } = values;
        const result = await updateProduct(id, updateData);
        
        if (!result) {
          throw new Error('Failed to update product. Product not found.');
        }
        
        savedProduct = result;
        toast({
          title: "Product Updated",
          description: `${values.name} has been updated in your inventory`,
          variant: 'default',
        });
      }
      
      // Pass the updated product to the parent component
      onSave(savedProduct);
      
      // Close the dialog
      onClose();
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isNewProduct 
              ? 'Add a new product to your inventory' 
              : 'Edit the details of this product'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Hidden ID field */}
            <input type="hidden" {...form.register('id')} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Safari Adventure T-Shirt" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Barcode */}
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode*</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <FormControl>
                      <Input placeholder="Apparel" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Supplier */}
              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={field.value}
                        onChange={field.onChange}
                      >
                        <option value="">Select a supplier</option>
                        {suppliers && Array.isArray(suppliers) && suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Price */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="29.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Cost Price */}
              <FormField
                control={form.control}
                name="costPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="12.99" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Stock */}
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock*</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="42" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Reorder Level */}
              <FormField
                control={form.control}
                name="reorderLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reorder Level</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Auto Reorder */}
              <FormField
                control={form.control}
                name="autoReorder"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Auto Reorder</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Automatically create purchase orders when stock falls below reorder level
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Target Stock Level */}
              <FormField
                control={form.control}
                name="targetStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Stock Level</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                    <p className="text-xs text-muted-foreground">
                      Quantity to restock to when auto-reordering
                    </p>
                  </FormItem>
                )}
              />
              
              {/* Image URL */}
              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/product-image.jpg" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductEditModal; 