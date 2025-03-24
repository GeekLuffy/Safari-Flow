export interface Product {
  id: string;
  name: string;
  barcode: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  imageUrl?: string;
  supplier?: string;
  reorderLevel?: number;
  autoReorder?: boolean;
  targetStockLevel?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Sale {
  id: string;
  products: {
    product: Product;
    quantity: number;
    priceAtSale: number;
  }[];
  totalAmount: number;
  paymentMethod: 'cash' | 'card' | 'online';
  customerId?: string;
  customerName?: string;
  employeeId: string;
  channel: 'in-store' | 'online';
  timestamp: Date;
}

export interface BillItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  avatar?: string;
  permissions?: string[];
}

export interface StatsData {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
}

export interface ChartData {
  name: string;
  value: number;
  isProjected?: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  products: string[]; // product IDs
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  products: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }[];
  status: 'pending' | 'ordered' | 'received' | 'canceled';
  totalAmount: number;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  deliveredDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  loyaltyPoints: number;
  purchaseHistory: string[]; // sale IDs
}
