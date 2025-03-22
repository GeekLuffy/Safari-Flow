import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash, RefreshCw, Power } from 'lucide-react';
import { Product } from '@/lib/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ReorderService } from '@/lib/services/reorderService';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';

interface ProductCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
  onProductUpdated?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onDelete, onProductUpdated }) => {
  const { name, price, stock, category, barcode, imageUrl, reorderLevel, autoReorder: initialAutoReorder, targetStockLevel } = product;
  const [isToggling, setIsToggling] = React.useState(false);
  const [localAutoReorder, setLocalAutoReorder] = React.useState(initialAutoReorder);
  const { toast } = useToast();
  
  // Sync state when product prop changes
  React.useEffect(() => {
    setLocalAutoReorder(initialAutoReorder);
  }, [initialAutoReorder]);
  
  // Use reorderLevel or default to 5
  const threshold = reorderLevel || 5;
  const stockStatus = stock === 0 ? 'out' : stock <= threshold ? 'low' : stock <= threshold * 2 ? 'medium' : 'high';
  
  // Handle auto-reorder toggle
  const handleAutoReorderToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    
    if (!product.supplier) {
      toast({
        title: "Missing Supplier",
        description: "Auto-reorder requires a supplier to be set. Please edit the product to add a supplier.",
        variant: "destructive",
      });
      return;
    }
    
    if (isToggling) return; // Prevent multiple clicks
    
    console.log(`Attempting to toggle auto-reorder for ${product.name} (${product.id}) from ${localAutoReorder} to ${!localAutoReorder}`);
    setIsToggling(true);
    
    // Optimistically update the UI
    setLocalAutoReorder(!localAutoReorder);
    
    try {
      // Toggle auto-reorder status
      const updatedProduct = await ReorderService.toggleAutoReorder(product, !localAutoReorder);
      
      if (updatedProduct) {
        console.log(`Successfully toggled auto-reorder for ${product.name}:`, updatedProduct);
        toast({
          title: localAutoReorder ? "Auto-Reorder Disabled" : "Auto-Reorder Enabled",
          description: localAutoReorder 
            ? `Auto-reorder has been disabled for ${name}`
            : `Auto-reorder has been enabled for ${name}. It will reorder when stock falls below ${threshold}.`,
          variant: "default",
        });
        
        // Notify parent of update
        if (onProductUpdated) {
          onProductUpdated(updatedProduct);
        }
      } else {
        // Revert optimistic update if failed
        setLocalAutoReorder(initialAutoReorder);
        
        console.error(`Failed to toggle auto-reorder for ${product.name} - no product returned`);
        toast({
          title: "Error",
          description: "Failed to update auto-reorder setting. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      // Revert optimistic update if failed
      setLocalAutoReorder(initialAutoReorder);
      
      console.error(`Error toggling auto-reorder for ${product.name}:`, error);
      toast({
        title: "Error",
        description: "Failed to update auto-reorder setting. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsToggling(false);
    }
  };
  
  return (
    <Card className="overflow-hidden transition-all duration-200 hover:shadow-md">
      <div className="aspect-video relative overflow-hidden bg-muted">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={name} 
            className="object-cover w-full h-full transition-transform duration-300 hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-muted">
            <span className="text-muted-foreground">No image</span>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-base line-clamp-1">
              {name}
              {localAutoReorder && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <RefreshCw className="h-3.5 w-3.5 text-green-600 ml-2 inline" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Auto-reorder enabled (Target: {targetStockLevel})</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </h3>
            <Badge 
              variant={
                stockStatus === 'out' ? 'destructive' : 
                stockStatus === 'low' ? 'destructive' : 
                stockStatus === 'medium' ? 'outline' : 'secondary'
              }
              className="ml-2 whitespace-nowrap"
            >
              {stock === 0 ? 'Out of stock' : 
               stockStatus === 'low' ? `${stock}/${threshold} in stock` : 
               `${stock} in stock`}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Category: {category}</p>
            <p>Barcode: {barcode}</p>
            {stockStatus === 'low' && <p className="text-amber-600">Reorder Level: {threshold}</p>}
            {localAutoReorder && stockStatus === 'low' && (
              <p className="text-green-600">Will auto-reorder to {targetStockLevel} units</p>
            )}
            
            {/* Auto-Reorder Toggle */}
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm">Auto-Reorder:</span>
              <Switch 
                checked={localAutoReorder} 
                disabled={isToggling}
                className={isToggling ? 'opacity-50' : ''}
                onCheckedChange={(checked) => {
                  if (!isToggling) {
                    handleAutoReorderToggle({
                      stopPropagation: () => {}
                    } as React.MouseEvent);
                  }
                }}
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="font-semibold">₹{price.toFixed(2)}</span>
            <div className="flex gap-2">
              {onEdit && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onEdit(product)}
                  aria-label={`Edit ${name}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => onDelete(product)}
                  aria-label={`Delete ${name}`}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductCard;
