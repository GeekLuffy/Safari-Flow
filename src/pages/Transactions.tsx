import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSalesStore } from '@/lib/stores/salesStore';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { Product, Sale } from '@/lib/types';
import { useNavigate } from 'react-router-dom';

const Transactions: React.FC = () => {
  const { sales, addSale } = useSalesStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // State for the new transaction form
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productCost, setProductCost] = useState('');
  const [productCategory, setProductCategory] = useState('souvenirs');
  const [quantity, setQuantity] = useState('1');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash');
  const [channel, setChannel] = useState<'in-store' | 'online'>('in-store');
  const [customerName, setCustomerName] = useState('');
  
  // Categories for the jungle safari shop
  const categories = [
    { value: 'souvenirs', label: 'Souvenirs' },
    { value: 'apparel', label: 'Safari Apparel' },
    { value: 'toys', label: 'Animal Toys' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'books', label: 'Wildlife Books' },
    { value: 'artwork', label: 'Tribal Artwork' }
  ];

  const handleAddSale = () => {
    if (!productName || !productPrice || !quantity) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Create a new product
    const newProduct: Product = {
      id: uuidv4(),
      name: productName,
      barcode: `BC-${Math.floor(Math.random() * 10000000)}`,
      category: productCategory,
      price: parseFloat(productPrice),
      costPrice: parseFloat(productCost) || parseFloat(productPrice) * 0.6, // Default to 60% of price if not provided
      stock: parseInt(quantity),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create the sale object with an explicit Date object for timestamp
    const newSale: Sale = {
      id: uuidv4(),
      products: [{
        product: newProduct,
        quantity: parseInt(quantity),
        priceAtSale: parseFloat(productPrice)
      }],
      totalAmount: parseFloat(productPrice) * parseInt(quantity),
      paymentMethod: paymentMethod,
      employeeId: "EMP-001", // Default employee ID
      channel: channel,
      customerName: customerName || undefined,
      timestamp: new Date() // Ensure this is explicitly a Date object
    };

    // Add the sale to the store
    addSale(newSale);

    // Show success message
    toast({
      title: "Transaction Added",
      description: `Successfully added sale for ${productName}`,
    });

    // Reset form
    setProductName('');
    setProductPrice('');
    setProductCost('');
    setQuantity('1');
    setCustomerName('');
  };

  const viewAnalytics = () => {
    navigate('/analytics');
  };

  return (
    <div className="p-6">
      <div className="mb-8 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SafariFlow Transactions</h1>
          <p className="text-muted-foreground">
            Record sales transactions and view history for your SafariFlow souvenir shop.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* New Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle>Record New Transaction</CardTitle>
            <CardDescription>Add a new sale to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="productName" className="text-sm font-medium">Product Name</label>
                  <Input 
                    id="productName" 
                    placeholder="Safari T-Shirt" 
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="category" className="text-sm font-medium">Category</label>
                  <Select value={productCategory} onValueChange={setProductCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="price" className="text-sm font-medium">Sale Price (₹)</label>
                  <Input 
                    id="price" 
                    type="number" 
                    placeholder="29.99" 
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="cost" className="text-sm font-medium">Cost Price (₹)</label>
                  <Input 
                    id="cost" 
                    type="number" 
                    placeholder="17.99" 
                    value={productCost}
                    onChange={(e) => setProductCost(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                  <Input 
                    id="quantity" 
                    type="number" 
                    min="1" 
                    placeholder="1" 
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="paymentMethod" className="text-sm font-medium">Payment Method</label>
                  <Select value={paymentMethod} onValueChange={(value: 'cash' | 'card' | 'online') => setPaymentMethod(value)}>
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
              </div>

              <div className="space-y-2">
                <label htmlFor="customerName" className="text-sm font-medium">Customer Name</label>
                <Input 
                  id="customerName" 
                  placeholder="John Doe" 
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="channel" className="text-sm font-medium">Sales Channel</label>
                <Select value={channel} onValueChange={(value: 'in-store' | 'online') => setChannel(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sales channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in-store">In-Store</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full" onClick={handleAddSale}>
                Record Sale
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Stats Card */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Summary</CardTitle>
            <CardDescription>Overview of recent transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Total Transactions</div>
                  <div className="text-2xl font-bold">{sales.length}</div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                  <div className="text-2xl font-bold">
                    ₹{sales.reduce((sum, sale) => sum + sale.totalAmount, 0).toLocaleString()}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Items Sold</div>
                  <div className="text-2xl font-bold">
                    {sales.reduce((sum, sale) => 
                      sum + sale.products.reduce((itemSum, prod) => itemSum + prod.quantity, 0), 0
                    )}
                  </div>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm font-medium text-muted-foreground">Avg Sale Value</div>
                  <div className="text-2xl font-bold">
                    ₹{sales.length > 0 
                      ? (sales.reduce((sum, sale) => sum + sale.totalAmount, 0) / sales.length).toFixed(2)
                      : '0.00'
                    }
                  </div>
                </div>
              </div>
              
              <Button className="w-full" onClick={viewAnalytics}>
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Recent sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...sales]
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map((sale) => (
                    <TableRow key={sale.id || `sale-${Math.random()}`}>
                      <TableCell className="font-medium">{sale.id ? sale.id.substring(0, 8) : 'N/A'}</TableCell>
                      <TableCell>{sale.timestamp.toLocaleString()}</TableCell>
                      <TableCell>{sale.customerName || 'Guest'}</TableCell>
                      <TableCell>
                        {sale.products.map((p, idx) => (
                          <div key={`${sale.id || 'unknown'}-product-${idx}`}>
                            {p.quantity}x {p.product?.name || 'Unknown Product'}
                          </div>
                        ))}
                      </TableCell>
                      <TableCell>{sale.channel}</TableCell>
                      <TableCell>{sale.paymentMethod}</TableCell>
                      <TableCell className="text-right">₹{sale.totalAmount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              No transactions recorded yet. Use the form above to add your first sale.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
