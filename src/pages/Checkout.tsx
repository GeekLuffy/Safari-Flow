import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShoppingCart, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { StripeProvider } from '@/components/stripe/StripeProvider';
import CheckoutForm from '@/components/stripe/CheckoutForm';
import { formatPrice } from '@/lib/stripe';
import { CartItem, createPaymentIntent } from '@/api/createPaymentIntent';
import { useLocation, useNavigate } from 'react-router-dom';
import { updateProductStock } from '@/lib/mockData';
import { BillItem, Sale } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { useSalesStore } from '@/lib/stores/salesStore';
import { v4 as uuidv4 } from 'uuid';
import { createSale } from '@/api/sales';
import { NotificationService } from '@/lib/services/notificationService';

// Sample cart items - used only if not coming from POS
const sampleCartItems: CartItem[] = [
  {
    id: '1',
    name: 'Safari Adventure T-Shirt',
    price: 29.99,
    quantity: 2
  },
  {
    id: '3',
    name: 'Jungle Safari Water Bottle',
    price: 24.99,
    quantity: 1
  }
];

const CheckoutPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { addSale } = useSalesStore();
  const [paymentStatus, setPaymentStatus] = useState<'none' | 'processing' | 'succeeded' | 'failed'>('none');
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stockUpdated, setStockUpdated] = useState(false);
  
  // Get cart items from location state (if coming from POS) or use sample items
  const isPOSCheckout = location.state?.fromPOS === true;
  const cartItems: CartItem[] = isPOSCheckout ? location.state.cartItems : sampleCartItems;
  
  // If this is a POS checkout, parse the bill items for stock updates
  const billItems: BillItem[] = isPOSCheckout && location.state.billItems 
    ? JSON.parse(location.state.billItems) 
    : [];
  
  // Calculate totals - use provided totals if coming from POS, otherwise calculate
  const subtotal = isPOSCheckout ? location.state.subtotal : 
    cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = isPOSCheckout ? location.state.tax : subtotal * 0.07; // 7% tax
  const shipping = isPOSCheckout ? 0 : 5.99; // No shipping for in-store purchases
  const total = isPOSCheckout ? location.state.total : subtotal + tax + shipping;
  const customerName = isPOSCheckout ? location.state.customerName : '';

  // Get payment method and channel from location state or use defaults
  const paymentMethod = isPOSCheckout ? location.state.paymentMethod || 'card' : 'online';
  const channel = isPOSCheckout ? location.state.channel || 'in-store' : 'online';

  useEffect(() => {
    // Only create a payment intent for card payments
    if (paymentMethod === 'card' || paymentMethod === 'online') {
      // Create a payment intent when the component mounts
      const getPaymentIntent = async () => {
        try {
          setIsLoading(true);
          setError(null);
          
          // Get client secret from our simulated API
          const { clientSecret } = await createPaymentIntent(cartItems);
          setClientSecret(clientSecret);
        } catch (err) {
          console.error('Failed to create payment intent:', err);
          setError('There was a problem setting up the payment. Please try again later.');
        } finally {
          setIsLoading(false);
        }
      };

      getPaymentIntent();
    } else {
      // For cash payments, we don't need a payment intent
      setIsLoading(false);
    }
  }, [cartItems, paymentMethod]);

  // Process the sale and handle notifications
  const processSale = async (saleData: Omit<Sale, 'id' | 'timestamp'>) => {
    try {
      console.log('Processing sale:', saleData);
      
      // Update local stock if this is a POS checkout
      if (isPOSCheckout && billItems.length > 0 && channel === 'in-store') {
        updateProductStock(billItems);
        setStockUpdated(true);
        
        // Show toast notification
        toast({
          title: "Stock Updated",
          description: "Product inventory has been updated successfully.",
          variant: "default"
        });
      }
      
      // Create the sale in the database through the API
      const savedSale = await createSale(saleData);
      console.log('Sale saved to database:', savedSale);
      
      // Add to local transaction history
      addSale({
        ...savedSale,
        id: savedSale.id || uuidv4(), // Use server-generated ID or create one
        timestamp: savedSale.timestamp || new Date()
      });
      
      return savedSale;
    } catch (error) {
      console.error('Error processing sale:', error);
      throw error;
    }
  };

  const handlePaymentSuccess = async (paymentIntent: any) => {
    setPaymentStatus('succeeded');
    console.log('Payment succeeded:', paymentIntent);
    
    try {
      // Prepare sale data
      const saleData: Omit<Sale, 'id' | 'timestamp'> = {
        products: billItems.map(item => ({
          product: item.product.id, // Send just the ID for API
          quantity: item.quantity,
          priceAtSale: item.product.price
        })),
        totalAmount: total,
        paymentMethod: paymentMethod,
        employeeId: 'EMP-001', // Default employee ID
        channel: channel,
        customerName: customerName
      };
      
      // Process the sale
      await processSale(saleData);
      
      if (isPOSCheckout) {
        // For POS checkouts, navigate back to billing after successful payment
        setTimeout(() => {
          navigate('/billing', { 
            state: { 
              paymentComplete: true,
              paymentId: paymentIntent.id,
              paymentMethod: paymentMethod,
              returnToPOS: true
            } 
          });
        }, 2000);
      }
    } catch (err) {
      console.error('Error finalizing sale:', err);
      toast({
        title: "Error",
        description: "There was a problem finalizing your sale. The payment was processed, but there was an error saving the transaction.",
        variant: "destructive"
      });
    }
  };

  const handleCashPayment = async () => {
    try {
      setPaymentStatus('processing');
      
      // Prepare sale data
      const saleData: Omit<Sale, 'id' | 'timestamp'> = {
        products: billItems.map(item => ({
          product: item.product.id, // Send just the ID for API
          quantity: item.quantity,
          priceAtSale: item.product.price
        })),
        totalAmount: total,
        paymentMethod: 'cash',
        employeeId: 'EMP-001', // Default employee ID
        channel: 'in-store',
        customerName: customerName
      };
      
      // Process the sale
      await processSale(saleData);
      
      setPaymentStatus('succeeded');
      
      // For POS checkouts, navigate back to billing after successful payment
      setTimeout(() => {
        navigate('/billing', { 
          state: { 
            paymentComplete: true,
            paymentMethod: 'cash',
            returnToPOS: true
          } 
        });
      }, 2000);
    } catch (err) {
      console.error('Error processing cash payment:', err);
      setPaymentStatus('failed');
      setError('There was a problem processing your cash payment.');
    }
  };

  const handlePaymentError = (error: Error) => {
    setPaymentStatus('failed');
    console.error('Payment failed:', error);
    setError(error.message);
  };

  // Auto-process cash payments
  useEffect(() => {
    if (paymentMethod === 'cash' && isPOSCheckout && isLoading === false) {
      handleCashPayment();
    }
  }, [paymentMethod, isPOSCheckout, isLoading]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">
        {isPOSCheckout ? "Complete Purchase" : "Checkout"}
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order summary */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5" />
                Order Summary
              </CardTitle>
              {isPOSCheckout && (
                <CardDescription>Point of Sale Transaction</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cartItems.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <p>{formatPrice(item.price * item.quantity)}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between">
                  <p>Subtotal</p>
                  <p>{formatPrice(subtotal)}</p>
                </div>
                
                <div className="flex justify-between">
                  <p>Tax</p>
                  <p>{formatPrice(tax)}</p>
                </div>
                
                {!isPOSCheckout && (
                  <div className="flex justify-between">
                    <p>Shipping</p>
                    <p>{formatPrice(shipping)}</p>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <p>Total</p>
                  <p>{formatPrice(total)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Payment form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="mr-2 h-5 w-5" />
                Payment
              </CardTitle>
              <CardDescription>
                {paymentMethod === 'cash' 
                  ? 'Processing cash payment' 
                  : 'Complete your purchase securely with Stripe'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {paymentStatus === 'succeeded' ? (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Payment Successful!</AlertTitle>
                  <AlertDescription>
                    Your payment has been processed successfully. Thank you for your purchase!
                    {stockUpdated && (
                      <p className="mt-1 text-green-600 font-medium">Product inventory has been updated.</p>
                    )}
                    {isPOSCheckout && <p className="mt-2">Returning to POS...</p>}
                  </AlertDescription>
                </Alert>
              ) : error ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Payment Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ) : isLoading || paymentStatus === 'processing' ? (
                <div className="flex justify-center p-6">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="ml-3 text-muted-foreground">
                    {paymentMethod === 'cash' ? 'Processing cash payment...' : 'Setting up payment...'}
                  </p>
                </div>
              ) : clientSecret && (paymentMethod === 'card' || paymentMethod === 'online') ? (
                <StripeProvider clientSecret={clientSecret}>
                  <CheckoutForm 
                    amount={Math.round(total * 100)} // Convert to cents
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </StripeProvider>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage; 