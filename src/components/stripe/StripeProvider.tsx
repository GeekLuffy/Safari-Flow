import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/lib/stripe';
import { StripeElementsOptions } from '@stripe/stripe-js';
import { StripeElements } from '@stripe/stripe-js';

// Define props for the StripeProvider
interface StripeProviderProps {
  children: React.ReactNode;
  clientSecret?: string;
  stripe?: StripeElements;
  colorMode?: string;
}

// Create a provider component that wraps the app with Stripe Elements
export const StripeProvider: React.FC<StripeProviderProps> = ({ children, clientSecret, stripe, colorMode }) => {
  // If no client secret is provided, don't render Stripe Elements
  if (!clientSecret) {
    return <div className="p-6 text-center">Preparing payment form...</div>;
  }
  
  // Create appearance object
  const appearance = {
    theme: colorMode === 'dark' ? 'night' : 'stripe' as const,
    variables: {
      colorPrimary: '#06b6d4',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      borderRadius: '0.375rem',
      fontSizeBase: '1rem'
    }
  };
  
  // Keep options minimal to avoid errors
  const options: StripeElementsOptions = {
    clientSecret,
    appearance,
    locale: 'en',
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      {children}
    </Elements>
  );
};

export default StripeProvider; 