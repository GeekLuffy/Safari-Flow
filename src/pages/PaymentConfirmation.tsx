import React, { useEffect, useState } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StripeProvider } from '@/components/stripe/StripeProvider';
import { Link, useNavigate } from 'react-router-dom';
import { updateProductStock } from '@/lib/mockData';
import { useToast } from '@/components/ui/use-toast';

const PaymentConfirmation: React.FC = () => {
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPOSPayment, setIsPOSPayment] = useState(false);
  const [stockUpdated, setStockUpdated] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const stripe = useStripe();

  const checkStatus = async () => {
    // Get the query parameters from the URL
    const query = new URLSearchParams(window.location.search);
    const paymentIntentId = query.get('payment_intent');
    const redirectStatus = query.get('redirect_status');
    const fromPOS = query.get('from_pos') === 'true';
    
    setIsPOSPayment(fromPOS);

    if (paymentIntentId) {
      setPaymentId(paymentIntentId);
      
      if (redirectStatus === 'succeeded') {
        setStatus('success');
        
        // Check if we have pending bill items in session storage
        const pendingBillItems = sessionStorage.getItem('pendingBillItems');
        if (pendingBillItems) {
          // Update stock using the global function
          updateProductStock(JSON.parse(pendingBillItems));
          setStockUpdated(true);
          
          // Show toast notification
          toast({
            title: "Stock Updated",
            description: "Product stock has been updated successfully.",
            variant: "default"
          });
          
          // Clear session storage
          sessionStorage.removeItem('pendingBillItems');
          sessionStorage.removeItem('billTotal');
        }
        
        // Get payment method from session storage or default to card
        const paymentMethod = sessionStorage.getItem('paymentMethod') || 'card';

        // If from POS, redirect back to billing
        if (fromPOS) {
          setTimeout(() => {
            navigate('/billing', { 
              state: { 
                paymentComplete: true,
                paymentId: paymentIntentId,
                paymentMethod: paymentMethod,
                returnToPOS: true
              } 
            });
          }, 2000);
          
          // Clear session storage
          sessionStorage.removeItem('paymentMethod');
        }
      } else {
        setStatus('failed');
        setErrorMessage('Your payment could not be processed. Please try again.');
      }
    } else {
      // No payment intent ID, probably navigated directly to this page
      setStatus('failed');
      setErrorMessage('No payment information found.');
    }
  };
  
  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Payment Status</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Order Confirmation</CardTitle>
          <CardDescription>
            {status === 'loading' ? 'Checking payment status...' : 
             status === 'success' ? 'Thank you for your purchase!' : 
             'There was an issue with your payment'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'loading' ? (
            <div className="flex justify-center p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : status === 'success' ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Payment Successful!</AlertTitle>
                <AlertDescription>
                  Your payment has been processed successfully. Thank you for your purchase!
                  {stockUpdated && (
                    <p className="mt-1 text-green-600 font-medium">Product inventory has been updated.</p>
                  )}
                  {isPOSPayment && (
                    <p className="mt-2">Returning to the Point of Sale system...</p>
                  )}
                </AlertDescription>
              </Alert>
              {paymentId && (
                <div className="text-sm text-muted-foreground">
                  Payment ID: {paymentId}
                </div>
              )}
              {!isPOSPayment && (
                <div className="flex justify-between mt-6">
                  <Button asChild>
                    <Link to="/inventory">Back to Inventory</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link to="/">Go to Home</Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Payment Failed</AlertTitle>
                <AlertDescription>
                  {errorMessage || 'There was an error processing your payment.'}
                </AlertDescription>
              </Alert>
              <div className="flex justify-between mt-6">
                <Button asChild>
                  <Link to={isPOSPayment ? "/billing" : "/checkout"}>Try Again</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link to="/">Go to Home</Link>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Wrap the component with StripeProvider to ensure Stripe is initialized
const WrappedPaymentConfirmation: React.FC = () => (
  <StripeProvider>
    <PaymentConfirmation />
  </StripeProvider>
);

export default WrappedPaymentConfirmation; 