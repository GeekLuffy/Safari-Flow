import React, { useState } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/stripe';
import { Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface CheckoutFormProps {
  amount: number;
  onSuccess?: (paymentIntent: any) => void;
  onError?: (error: Error) => void;
}

export const CheckoutForm: React.FC<CheckoutFormProps> = ({ 
  amount, 
  onSuccess,
  onError
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const location = useLocation();
  
  // Check if this checkout is from the POS
  const isPOSCheckout = location.state?.fromPOS === true;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Build the return URL with query parameters
      const returnUrl = new URL(`${window.location.origin}/payment-confirmation`);
      
      // Add from_pos parameter if coming from POS
      if (isPOSCheckout) {
        returnUrl.searchParams.append('from_pos', 'true');
      }
      
      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: returnUrl.toString(),
        },
        redirect: 'if_required',
      });

      if (error) {
        // Show error to your customer
        setErrorMessage(error.message || 'An unexpected error occurred.');
        onError?.(new Error(error.message || 'Payment failed'));
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // The payment has been processed!
        onSuccess?.(paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('An unexpected error occurred.');
      onError?.(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <PaymentElement />
      </div>
      
      {/* Show any error messages */}
      {errorMessage && (
        <div className="text-red-500 text-sm">{errorMessage}</div>
      )}
      
      <div className="pt-4 border-t">
        <div className="flex justify-between items-center mb-4">
          <span className="font-medium">Total</span>
          <span className="font-bold text-lg">{formatPrice(amount / 100)}</span>
        </div>
        
        <Button 
          disabled={!stripe || !elements || isLoading} 
          className="w-full py-6" 
          size="lg"
        >
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            `Pay ${formatPrice(amount / 100)}`
          )}
        </Button>
      </div>
    </form>
  );
};

export default CheckoutForm; 