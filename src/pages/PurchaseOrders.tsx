import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ArrowDown, Check, Clock, X } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { getAllPurchaseOrders, updatePurchaseOrderStatus } from '@/api/purchaseOrder';
import { PurchaseOrder } from '@/lib/types';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription,
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";

const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [statusToUpdate, setStatusToUpdate] = useState<'pending' | 'ordered' | 'received' | 'canceled'>('received');
  const { toast } = useToast();

  // Fetch purchase orders on component mount
  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const orders = await getAllPurchaseOrders();
      setPurchaseOrders(orders);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load purchase orders',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (order: PurchaseOrder, status: 'pending' | 'ordered' | 'received' | 'canceled') => {
    setSelectedOrder(order);
    setStatusToUpdate(status);
    setConfirmDialogOpen(true);
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder) return;
    
    try {
      const updatedOrder = await updatePurchaseOrderStatus(selectedOrder.id, statusToUpdate);
      
      if (!updatedOrder) {
        throw new Error('Failed to update order status');
      }
      
      // Update the local state with the new status
      setPurchaseOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === updatedOrder.id ? updatedOrder : order
        )
      );
      
      const statusMessages = {
        pending: 'marked as pending',
        ordered: 'marked as ordered',
        received: 'received and stock levels updated',
        canceled: 'canceled'
      };
      
      toast({
        title: 'Status Updated',
        description: `Purchase order has been ${statusMessages[statusToUpdate]}`,
        variant: 'default'
      });
    } catch (error) {
      console.error('Error updating purchase order status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update purchase order status',
        variant: 'destructive'
      });
    } finally {
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'ordered':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Ordered</Badge>;
      case 'received':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Received</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Canceled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Purchase Orders</h1>
        <p className="text-muted-foreground">
          Manage your purchase orders and incoming inventory
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase Order List</CardTitle>
          <CardDescription>View and manage purchase orders</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : purchaseOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold">No Purchase Orders</h3>
              <p className="text-muted-foreground mt-2">
                There are no purchase orders in the system yet. 
                They will be created automatically when stock falls below reorder levels.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders
                  .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                  .map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}</TableCell>
                      <TableCell>{order.supplierName || 'Unknown Supplier'}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleTimeString()}</TableCell>
                      <TableCell>{formatDate(order.expectedDeliveryDate)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {order.products.map((product, idx) => (
                            <div key={idx} className="text-sm">
                              {product.quantity}x {product.productName || 'Unknown Product'}
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>₹{order.totalAmount.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {order.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(order, 'ordered')}
                            >
                              <ArrowDown className="h-4 w-4 mr-1" />
                              Mark Ordered
                            </Button>
                          )}
                          
                          {(order.status === 'pending' || order.status === 'ordered') && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleStatusChange(order, 'received')}
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800"
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Receive
                            </Button>
                          )}
                          
                          {(order.status === 'pending' || order.status === 'ordered') && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleStatusChange(order, 'canceled')}
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </Button>
                          )}

                          {order.status === 'received' && (
                            <span className="text-sm text-muted-foreground flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Completed {formatDate(order.deliveredDate)}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Status Change</AlertDialogTitle>
            <AlertDialogDescription>
              {statusToUpdate === 'received' ? (
                <>
                  Are you sure you want to mark this order as received? This will update stock levels for all products in this order.
                </>
              ) : statusToUpdate === 'canceled' ? (
                <>
                  Are you sure you want to cancel this order? This action cannot be undone.
                </>
              ) : (
                <>
                  Are you sure you want to change the status to {statusToUpdate}?
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={updateOrderStatus}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PurchaseOrders; 