import React, { useEffect, useState } from 'react';
import BillingSystem from '@/components/billing/BillingSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link, useLocation } from "react-router-dom";
import { CreditCard, ShoppingCart, Users } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

const Billing: React.FC = () => {
  const location = useLocation();
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<{
    paymentId: string;
    paymentMethod: string;
  } | null>(null);
  
  // Check if returning from a completed payment
  useEffect(() => {
    if (location.state?.paymentComplete) {
      setShowSuccessAlert(true);
      setPaymentDetails({
        paymentId: location.state.paymentId || 'Unknown',
        paymentMethod: location.state.paymentMethod || 'card'
      });
      
      // Auto-dismiss alert after 5 seconds
      const timer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Jungle Safari Billing</h1>
        <p className="text-muted-foreground">
          Create bills, process payments, and track sales for your souvenir shop.
        </p>
      </div>
      
      {/* Payment success alert */}
      {showSuccessAlert && (
        <Alert className="mb-6 bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle>Payment Successful!</AlertTitle>
          <AlertDescription>
            The payment has been processed successfully. Payment ID: {paymentDetails?.paymentId}.
            Method: {paymentDetails?.paymentMethod === 'card' ? 'Credit Card (Stripe)' : paymentDetails?.paymentMethod}.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="pos" className="mb-6">
        <TabsList>
          <TabsTrigger value="pos">Point of Sale</TabsTrigger>
          <TabsTrigger value="online">Online Orders</TabsTrigger>
          <TabsTrigger value="customers">Customers & Loyalty</TabsTrigger>
          <TabsTrigger value="payments">Payment Options</TabsTrigger>
        </TabsList>
        <TabsContent value="pos">
          <BillingSystem />
        </TabsContent>
        <TabsContent value="online">
          <div className="text-center p-10 text-muted-foreground">
            <p>Online order management will appear here</p>
          </div>
        </TabsContent>
        <TabsContent value="customers">
          <div className="text-center p-10 text-muted-foreground">
            <p>Customer and loyalty program management will appear here</p>
          </div>
        </TabsContent>
        <TabsContent value="payments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Stripe Payments
                </CardTitle>
                <CardDescription>
                  Process credit card payments with Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Secure payment processing with support for all major credit cards,
                  including Visa, MasterCard, American Express, and more.
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link to="/checkout">
                    Go to Checkout Demo
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Cash Payments
                </CardTitle>
                <CardDescription>
                  Process cash transactions at the register
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Track cash transactions, calculate change, and manage your cash drawer
                  with our easy-to-use interface.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Open Cash Register
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Invoicing
                </CardTitle>
                <CardDescription>
                  Create and send invoices to customers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Generate professional invoices, track payments, and send reminders
                  to customers with pending invoices.
                </p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Create Invoice
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Billing;
