import Stripe from 'stripe';

// IMPORTANT NOTE: This is a client-side simulation of a server-side API endpoint.
// In a real application, this code should NEVER be run on the client.
// Payment Intents should always be created on the server to protect your Stripe secret key.
// This implementation is for demonstration purposes only.

// Initialize Stripe with the test secret key
// In a real application, this would be in a secure server environment
const stripeSecretKey = 'sk_test_51R5ANkQqLNd9hUolxovJxIAG74tE5VVlgT2PRnlNUJ0VJL6HVZ8csonjLqLaZ5CyCQU9PJqsaWY6eBskNKA11h8c00Q48VkiTG';
const stripe = new Stripe(stripeSecretKey);

// Interface for cart items
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Function to create a payment intent
export async function createPaymentIntent(
  items: CartItem[], 
  currency: string = 'inr'
): Promise<{ clientSecret: string }> {
  try {
    // Calculate order amount
    const amount = calculateOrderAmount(items);
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      // In a production app, you would collect this from the customer
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        order_items: JSON.stringify(
          items.map(item => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity
          }))
        )
      }
    });

    return {
      clientSecret: paymentIntent.client_secret!
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

// Calculate the order amount based on cart items
function calculateOrderAmount(items: CartItem[]): number {
  // Convert price to cents for Stripe
  return items.reduce((sum, item) => {
    return sum + (item.price * 100 * item.quantity);
  }, 0);
} 