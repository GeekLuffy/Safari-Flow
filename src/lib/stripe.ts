import { loadStripe } from '@stripe/stripe-js';

// Test mode Stripe public key
// In a real app this would be in .env.local
const STRIPE_PUBLIC_KEY = 'pk_test_51R5ANkQqLNd9hUoltIxiX5GJfq1Hiu9XBAgCxI4cx1e3eIHeJIxQXgmpFh72Bu525CrW0Qx6HO672HBvQ3dkvwcg00cR8010Hl';

// Initialize Stripe
export const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

// Calculate price in cents for Stripe
export const calculateOrderAmount = (items: any[]): number => {
  // Calculate the total price of items
  return items.reduce((total, item) => {
    return total + (item.price * item.quantity * 100); // Convert to cents
  }, 0);
};

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(price);
}; 