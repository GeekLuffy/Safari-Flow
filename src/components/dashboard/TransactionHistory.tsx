import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useSalesStore } from '@/lib/stores/salesStore';
import { useToast } from "@/components/ui/use-toast";
import { mockProducts } from '@/lib/mockData';
import { Sale } from '@/lib/types';

const TransactionHistory: React.FC = () => {
  const { toast } = useToast();
  const { sales, addSale } = useSalesStore();
  
  // Form state
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "online">("cash");
  const [channel, setChannel] = useState<"in-store" | "online">("in-store");
  
  const handleAddTransaction = () => {
    // Validate inputs
    if (!selectedProduct || quantity <= 0) {
      toast({
        title: "Invalid input",
        description: "Please select a product and enter a valid quantity",
        variant: "destructive"
      });
      return;
    }
    
    // Find selected product
    const product = mockProducts.find(p => p.id === selectedProduct);
    if (!product) {
      toast({
        title: "Product not found",
        description: "The selected product could not be found",
        variant: "destructive"
      });
      return;
    }
    
    // Check if quantity is available
    if (quantity > product.stock) {
      toast({
        title: "Insufficient stock",
        description: `Only ${product.stock} items available`,
        variant: "destructive"
      });
      return;
    }
    
    // Create new sale
    const newSale: Sale = {
      id: (Math.max(0, ...sales.map(s => parseInt(s.id))) + 1).toString(),
      products: [
        {
          product: product,
          quantity: quantity,
          priceAtSale: product.price
        }
      ],
      totalAmount: product.price * quantity,
      paymentMethod: paymentMethod,
      employeeId: "1", // Default employee
      customerId: customerName ? `cust-${Date.now()}` : undefined,
      customerName: customerName || undefined,
      channel: channel,
      timestamp: new Date()
    };
    
    // Add the sale
    addSale(newSale);
    
    // Reset form
    setSelectedProduct("");
    setQuantity(1);
    setCustomerName("");
    
    toast({
      title: "Transaction added",
      description: `Sale of ${quantity} ${product.name} recorded successfully`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Add New Transaction</CardTitle>
            <CardDescription>Record a new sale in the system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Product</label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {mockProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} (₹{product.price.toFixed(2)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantity</label>
              <Input 
                type="number" 
                min="1" 
                value={quantity} 
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Customer Name (Optional)</label>
              <Input 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Enter customer name"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(value: "cash" | "card" | "online") => setPaymentMethod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Sales Channel</label>
              <Select value={channel} onValueChange={(value: "in-store" | "online") => setChannel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sales channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in-store">In-Store</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button 
              onClick={handleAddTransaction} 
              className="w-full mt-4"
            >
              Add Transaction
            </Button>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View all recorded sales transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>A list of your recent sales transactions.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length > 0 ? (
                  [...sales]
                    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                    .map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium">#{sale.id}</TableCell>
                        <TableCell>{sale.timestamp.toLocaleString()}</TableCell>
                        <TableCell>{sale.customerName || (sale.customerId ? sale.customerId : "Guest")}</TableCell>
                        <TableCell>
                          {sale.products.map((item, idx) => (
                            <div key={idx}>
                              {item.quantity}x {item.product.name}
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sale.channel === 'in-store' 
                              ? 'bg-blue-100 text-blue-800' 
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {sale.channel}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            sale.paymentMethod === 'cash' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : sale.paymentMethod === 'card'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {sale.paymentMethod}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">₹{sale.totalAmount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                      No transactions recorded yet. Add your first sale with the form.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TransactionHistory;
