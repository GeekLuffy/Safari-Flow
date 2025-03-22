import React, { useState, useEffect } from 'react';
import { QrCode, Plus, Search, Trash, CornerDownLeft, CreditCard, Banknote, Receipt } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BillItem, Product, Sale } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { createPaymentIntent } from '@/api/createPaymentIntent';
import { useSalesStore } from '@/lib/stores/salesStore';
import { v4 as uuidv4 } from 'uuid';
import { NotificationService } from '@/lib/services/notificationService';
import { getAllProducts } from '@/api/product';
import { useQuery } from '@tanstack/react-query';

const BillingSystem: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { addSale } = useSalesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerName, setCustomerName] = useState('');
  
  // Fetch products from MongoDB
  const { 
    data: products = [], 
    isLoading: isLoadingProducts,
    error: productsError,
    refetch: refetchProducts
  } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts,
    retry: 1
  });
  
  // Calculate totals
  const subtotal = billItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + tax;
  
  const handleAddToBill = () => {
    if (!selectedProduct) return;
    
    // Check stock level
    if (selectedProduct.stock < quantity) {
      toast({
        title: "Insufficient stock",
        description: `Only ${selectedProduct.stock} units available`,
        variant: "destructive"
      });
      return;
    }
    
    // Check if product is already in the bill
    const existingItemIndex = billItems.findIndex(item => item.product.id === selectedProduct.id);
    
    if (existingItemIndex >= 0) {
      // Update quantity if the product is already in the bill
      const updatedItems = [...billItems];
      const totalQuantity = updatedItems[existingItemIndex].quantity + quantity;
      
      // Check if updated quantity exceeds stock
      if (totalQuantity > selectedProduct.stock) {
        toast({
          title: "Insufficient stock",
          description: `Cannot add ${quantity} more units. Only ${selectedProduct.stock - updatedItems[existingItemIndex].quantity} more available`,
          variant: "destructive"
        });
        return;
      }
      
      updatedItems[existingItemIndex].quantity = totalQuantity;
      updatedItems[existingItemIndex].subtotal = totalQuantity * selectedProduct.price;
      setBillItems(updatedItems);
    } else {
      // Add as new item
      const newItem: BillItem = {
        product: selectedProduct,
        quantity: quantity,
        subtotal: quantity * selectedProduct.price
      };
      
      setBillItems([...billItems, newItem]);
    }
    
    // Reset selection
    setSelectedProduct(null);
    setQuantity(1);
    setSearchQuery('');
  };
  
  const handleRemoveItem = (index: number) => {
    const updatedItems = [...billItems];
    updatedItems.splice(index, 1);
    setBillItems(updatedItems);
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    
    // If search is cleared, reset selected product
    if (e.target.value === '') {
      setSelectedProduct(null);
    }
  };
  
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery(product.name);
  };
  
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };
  
  // Convert bill items to cart items for Stripe
  const getBillItemsForStripe = () => {
    return billItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));
  };
  
  const handleCompleteSale = async () => {
    if (billItems.length === 0) {
      toast({
        title: "No items in bill",
        description: "Please add items to complete a sale",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessingPayment(true);
    
    try {
      if (paymentMethod === 'cash') {
        // Create a new sale record and add it to the transaction history via MongoDB
        const saleData = {
          products: billItems.map(item => ({
            product: item.product.id, // Just the ID for the API
            quantity: item.quantity,
            priceAtSale: item.product.price
          })),
          totalAmount: total,
          paymentMethod: 'cash',
          customerName: customerName || undefined,
          employeeId: 'EMP-001', // Default employee ID
          channel: 'in-store',
          timestamp: new Date()
        };
        
        // Add sale to MongoDB via our store (which uses the API)
        await addSale({
          id: 'new', // Temporary ID that will be replaced by MongoDB
          products: billItems.map(item => ({
            product: item.product,
            quantity: item.quantity,
            priceAtSale: item.product.price
          })),
          totalAmount: total,
          paymentMethod: 'cash',
          customerName: customerName || undefined,
          employeeId: 'EMP-001', // Default employee ID
          channel: 'in-store',
          timestamp: new Date()
        });
        
        // Generate notifications
        NotificationService.notifyNewTransaction(total, billItems.length);
        NotificationService.notifyStockUpdate(billItems.length);
        
        // Refresh products to get updated stock levels
        refetchProducts();
        
        // Display success message
        toast({
          title: "Sale completed",
          description: `Cash payment of ₹${total.toFixed(2)} received`,
        });
        
        // Reset bill
        setBillItems([]);
      } else {
        // For card or online payments, use Stripe
        // Store bill items in session storage to retrieve after payment
        sessionStorage.setItem('pendingBillItems', JSON.stringify(billItems));
        sessionStorage.setItem('billTotal', total.toString());
        sessionStorage.setItem('paymentMethod', paymentMethod);
        sessionStorage.setItem('customerName', customerName || '');
        
        // Create a payment intent and redirect to checkout
        const cartItems = getBillItemsForStripe();
        
        // Set the correct channel based on payment method
        const channel = paymentMethod === 'online' ? 'online' : 'in-store';
        
        // Navigate to the checkout page with the cart items
        navigate('/checkout', { 
          state: { 
            fromPOS: true,
            cartItems,
            subtotal,
            tax,
            total,
            billItems: JSON.stringify(billItems), // Include bill items for stock update
            customerName,
            paymentMethod,
            channel
          } 
        });
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast({
        title: "Payment failed",
        description: error instanceof Error ? error.message : "There was an error processing your payment",
        variant: "destructive"
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  // Filter products based on search
  const filteredProducts = searchQuery 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.barcode.includes(searchQuery))
    : [];
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Add Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search product or scan barcode..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={handleSearch}
                  />
                </div>
                <Button variant="outline" size="icon">
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
              
              {isLoadingProducts && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading products...</p>
                </div>
              )}
              
              {productsError && (
                <div className="text-center py-4 text-destructive">
                  <p>Error loading products. Please try again.</p>
                </div>
              )}
              
              {searchQuery && !isLoadingProducts && (
                <div className="border rounded-md overflow-hidden">
                  <AnimatePresence>
                    {filteredProducts.length > 0 ? (
                      <div className="max-h-60 overflow-y-auto">
                        {filteredProducts.map(product => (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="p-3 border-b last:border-0 hover:bg-muted cursor-pointer flex justify-between items-center"
                            onClick={() => handleProductSelect(product)}
                          >
                            <div>
                              <p className="font-medium">{product.name}</p>
                              <p className="text-sm text-muted-foreground">Barcode: {product.barcode}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">₹{product.price.toFixed(2)}</p>
                              <p className="text-sm text-muted-foreground">{product.stock} in stock</p>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : searchQuery.length > 0 ? (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="p-3 text-center text-muted-foreground"
                      >
                        No products found
                      </motion.p>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
              
              {selectedProduct && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="border rounded-md p-4 space-y-3"
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium">{selectedProduct.name}</h3>
                    <p className="font-semibold">₹{selectedProduct.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-20">
                      <Input
                        type="number"
                        min="1"
                        max={selectedProduct.stock}
                        value={quantity}
                        onChange={handleQuantityChange}
                      />
                    </div>
                    <Button 
                      className="flex-1"
                      onClick={handleAddToBill}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add to Bill
                    </Button>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {selectedProduct.stock} units available in stock
                  </p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Current Bill</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billItems.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-muted-foreground">
                    <span>Item</span>
                    <div className="flex">
                      <span className="w-20 text-right">Price</span>
                      <span className="w-20 text-right">Qty</span>
                      <span className="w-24 text-right">Total</span>
                      <span className="w-8"></span>
                    </div>
                  </div>
                  <Separator />
                  <AnimatePresence>
                    {billItems.map((item, index) => (
                      <motion.div
                        key={`${item.product.id}-${index}`}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-between items-center py-2"
                      >
                        <span className="flex-1 font-medium">{item.product.name}</span>
                        <div className="flex items-center">
                          <span className="w-20 text-right">₹{item.product.price.toFixed(2)}</span>
                          <span className="w-20 text-right">{item.quantity}</span>
                          <span className="w-24 text-right font-medium">₹{item.subtotal.toFixed(2)}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8"
                            onClick={() => handleRemoveItem(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No items added to bill yet</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle>Payment Summary</CardTitle>
        </CardHeader>
        <CardContent className="pb-2">
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax (8%):</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            
            <div className="pt-4">
              <p className="text-sm font-medium mb-2">Customer Name</p>
              <Input
                placeholder="Enter customer name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            
            <div className="pt-4">
              <p className="text-sm font-medium mb-2">Payment Method</p>
              <div className="grid grid-cols-3 gap-2">
                <Button 
                  variant={paymentMethod === 'cash' ? 'default' : 'outline'} 
                  className="flex flex-col items-center py-3 h-auto"
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Banknote className="h-5 w-5 mb-1" />
                  Cash
                </Button>
                <Button 
                  variant={paymentMethod === 'card' ? 'default' : 'outline'} 
                  className="flex flex-col items-center py-3 h-auto"
                  onClick={() => setPaymentMethod('card')}
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  Card
                </Button>
                <Button 
                  variant={paymentMethod === 'online' ? 'default' : 'outline'} 
                  className="flex flex-col items-center py-3 h-auto"
                  onClick={() => setPaymentMethod('online')}
                >
                  <Receipt className="h-5 w-5 mb-1" />
                  Online
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col gap-2">
          <Button 
            className="w-full py-6" 
            size="lg" 
            onClick={handleCompleteSale}
            disabled={billItems.length === 0 || isProcessingPayment}
          >
            {isProcessingPayment ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <CornerDownLeft className="h-5 w-5 mr-2" />
            )}
            Complete Sale
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BillingSystem;
