import React, { useState, useEffect } from 'react';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from './StatsCard';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BarChart, Bar } from 'recharts';
import { useSalesStore } from '@/lib/stores/salesStore';
import { useQuery } from '@tanstack/react-query';
import { getAllProducts } from '@/api/product';
import { getSalesAnalytics } from '@/api/sales';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Updated vibrant colors similar to the screenshot
const COLORS = ['#FFB800', '#00C49F', '#16B1FF', '#FF5630'];

const DashboardOverview: React.FC = () => {
  const navigate = useNavigate();
  const { 
    sales, 
    fetchSales,
    getTotalRevenue,
    getTotalProfit,
    getProfitMargin,
    getMonthlySalesData,
    getSalesByCategory,
    getSalesByChannel,
    getTotalCost 
  } = useSalesStore();
  
  // Fetch sales data on component mount
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);
  
  // Fetch products data
  const { 
    data: products = [], 
    isLoading: productsLoading, 
    error: productsError 
  } = useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts
  });
  
  // Fetch analytics data
  const { 
    data: analytics, 
    isLoading: analyticsLoading, 
    error: analyticsError 
  } = useQuery({
    queryKey: ['salesAnalytics'],
    queryFn: getSalesAnalytics
  });
  
  const totalRevenue = getTotalRevenue();
  const totalCostPrice = getTotalCost();
  const profit = getTotalProfit();
  const profitMargin = getProfitMargin();
  
  const salesData = getMonthlySalesData();
  const categoryData = getSalesByCategory();
  const channelData = getSalesByChannel();
  
  const handleViewAnalytics = () => {
    navigate('/analytics');
  };
  
  const handleAddTransaction = () => {
    navigate('/transactions');
  };

  // Calculate inventory stats
  const lowStockItems = products.filter(p => {
    const threshold = p.reorderLevel || 5;
    return p.stock > 0 && p.stock <= threshold;
  });
  const outOfStockItems = products.filter(p => p.stock === 0);
  const healthyStockItems = products.filter(p => {
    const threshold = p.reorderLevel || 5;
    return p.stock > threshold;
  });

  // Prepare stats cards data
  const statsData = [
    {
      title: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString()}`,
      description: `${sales.length} total sales`,
      trend: "+12.3%",
      trendDirection: "up",
      icon: "currency"
    },
    {
      title: "Profit Margin",
      value: `${profitMargin < 0 ? '-' : ''}${Math.abs(profitMargin).toFixed(1)}%`,
      description: `₹${profit < 0 ? '-' : ''}${Math.abs(profit).toLocaleString()} total profit`,
      trend: profit < 0 ? "Loss" : "+2.5%",
      trendDirection: profit < 0 ? "down" : "up",
      icon: "profit"
    },
    {
      title: "Low Stock Items",
      value: `${lowStockItems.length}`,
      description: `${outOfStockItems.length} out of stock`,
      trend: lowStockItems.length > 5 ? "Warning" : "Healthy",
      trendDirection: lowStockItems.length > 5 ? "down" : "up",
      icon: "inventory"
    },
    {
      title: "Active Products",
      value: `${products.length}`,
      description: `${healthyStockItems.length} with healthy stock`,
      trend: "+3",
      trendDirection: "up",
      icon: "product"
    }
  ];

  // Show loading state
  if (productsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((_, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-10 w-24 mb-4" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-7">
          <Card className="md:col-span-5">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Skeleton className="h-[200px] w-full" />
              </div>
            </CardContent>
          </Card>
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <Skeleton className="h-[200px] w-full rounded-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show error state
  if (productsError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load dashboard data. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <StatsCard key={index} data={stat} />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-7">
        <Card className="md:col-span-5">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Monthly sales over the past year</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={salesData}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0070F3" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#0070F3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#888888', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                    border: 'none', 
                    padding: '8px' 
                  }} 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0070F3" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPv)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Product Categories</CardTitle>
            <CardDescription>Distribution by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData.length > 0 ? categoryData : [{name: 'No Data', value: 1}]}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    // Calculate percentage
                    const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                    return [`${percentage}%`, name];
                  }}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                    border: 'none' 
                  }}
                />
                <Legend
                  formatter={(value, entry, index) => {
                    const total = categoryData.reduce((sum, item) => sum + item.value, 0);
                    const item = categoryData[index]; 
                    if (item) {
                      const percentage = total > 0 ? Math.round((item.value / total) * 100) : 0;
                      return (
                        <span style={{ color: '#333', fontSize: '14px' }}>
                          {value} <span style={{ color: '#888' }}>{percentage}%</span>
                        </span>
                      );
                    }
                    return value;
                  }}
                  layout="vertical"
                  verticalAlign="middle"
                  align="right"
                  wrapperStyle={{ paddingLeft: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profit Overview</CardTitle>
            <CardDescription>Current period performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div key="revenue" className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">₹{totalRevenue.toLocaleString()}</p>
              </div>
              <div key="cost" className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="text-2xl font-bold">₹{totalCostPrice.toLocaleString()}</p>
              </div>
              <div key="profit" className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Profit</p>
                <p className={`text-2xl font-bold ${profit < 0 ? 'text-red-500' : 'text-green-500'}`}>
                  ₹{profit < 0 ? '-' : ''}{Math.abs(profit).toLocaleString()}
                </p>
              </div>
              <div key="margin" className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className={`text-2xl font-bold ${profitMargin < 0 ? 'text-red-500' : ''}`}>
                  {profitMargin < 0 ? '-' : ''}{Math.abs(profitMargin).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sales Channels</CardTitle>
            <CardDescription>In-store vs online distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={channelData.length > 0 ? channelData : [{name: 'No Data', value: 0}]}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" 
                  tickFormatter={(value) => `₹${value}`} 
                  axisLine={false} 
                  tickLine={false}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                />
                <Tooltip 
                  formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Sales']}
                  contentStyle={{ 
                    borderRadius: '8px', 
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', 
                    border: 'none' 
                  }}
                />
                <Bar dataKey="value" fill="#0070F3" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full" 
              onClick={handleAddTransaction}
            >
              Record New Sale
            </Button>
            
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleViewAnalytics}
            >
              View Detailed Analytics
            </Button>
            
            <div className="grid grid-cols-2 gap-2">
              <div 
                key="add-product" 
                className="rounded-lg border border-border p-3 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate('/inventory/new')}
              >
                <div className="text-sm font-medium mb-1">Add Product</div>
                <div className="text-xs text-muted-foreground">Add a new product to inventory</div>
              </div>
              <div 
                key="purchase-orders" 
                className="rounded-lg border border-border p-3 hover:bg-muted transition-colors cursor-pointer"
                onClick={() => navigate('/purchase-orders')}
              >
                <div className="text-sm font-medium mb-1">Purchase Orders</div>
                <div className="text-xs text-muted-foreground">Manage incoming orders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Inventory Status</CardTitle>
          <CardDescription>Product stock levels and alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Inventory Status Bars */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium">Healthy Stock</span>
                </div>
                <span className="text-sm font-medium">{healthyStockItems.length} products</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ 
                    width: `${products.length ? (healthyStockItems.length / products.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                  <span className="text-sm font-medium">Low Stock</span>
                </div>
                <span className="text-sm font-medium">{lowStockItems.length} products</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500" 
                  style={{ 
                    width: `${products.length ? (lowStockItems.length / products.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex space-x-2 items-center">
                  <div className="w-4 h-4 rounded-full bg-red-500"></div>
                  <span className="text-sm font-medium">Out of Stock</span>
                </div>
                <span className="text-sm font-medium">{outOfStockItems.length} products</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500" 
                  style={{ 
                    width: `${products.length ? (outOfStockItems.length / products.length) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Low Stock Products */}
            {lowStockItems.length > 0 && (
              <div className="mt-4">
                <h3 className="text-base font-medium mb-3">Low Stock Products</h3>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted/50">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Product
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Current Stock
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Reorder Level
                        </th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Auto-Reorder
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-border">
                      {lowStockItems.slice(0, 5).map((product) => (
                        <tr key={product.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                            {product.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                            <span className="px-2 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-medium">
                              {product.stock} units
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                            {product.reorderLevel || 5}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.autoReorder ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                              {product.autoReorder ? 'Enabled' : 'Disabled'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {lowStockItems.length > 5 && (
                  <div className="mt-2 text-right">
                    <Button 
                      variant="link" 
                      size="sm"
                      onClick={() => navigate('/low-stock')}
                    >
                      View all {lowStockItems.length} low stock items
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest 5 transactions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleViewAnalytics}>
            View All
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {sales.length > 0 ? (
              [...sales]
                .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                .slice(0, 5)
                .map((sale, index) => (
                  <div key={sale.id} className="flex items-center justify-between space-x-4">
                    <div className="flex items-center space-x-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        sale.paymentMethod === 'cash' 
                          ? 'bg-yellow-100 text-yellow-700' 
                          : sale.paymentMethod === 'card'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {sale.paymentMethod === 'cash' ? '₹' : sale.paymentMethod === 'card' ? 'C' : 'O'}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium">{sale.products[0].product.name}{sale.products.length > 1 ? ` +${sale.products.length - 1} more` : ''}</p>
                        <p className="text-sm text-muted-foreground">
                          {sale.customerName || 'Guest'} · {new Date(sale.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="font-medium">₹{sale.totalAmount.toLocaleString()}</div>
                  </div>
                ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No sales recorded yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardOverview;
