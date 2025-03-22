import { Product, Sale, User, StatsData, ChartData, BillItem } from './types';

// Initialize mockProducts from localStorage if available, otherwise use default data
const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Safari Adventure T-Shirt',
    barcode: '123456789001',
    category: 'Apparel',
    price: 29.99,
    costPrice: 12.99,
    stock: 42,
    imageUrl: 'https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?q=80&w=2069&auto=format&fit=crop',
    supplier: 'Jungle Threads Ltd',
    reorderLevel: 10,
    autoReorder: true,
    targetStockLevel: 50,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-05-20')
  },
  {
    id: '2',
    name: 'Handcrafted Bastar Art Elephant',
    barcode: '123456789002',
    category: 'Bastar Art',
    price: 149.99,
    costPrice: 89.99,
    stock: 15,
    imageUrl: 'https://images.unsplash.com/photo-1569385210018-127685230669?q=80&w=2070&auto=format&fit=crop',
    supplier: 'Tribal Artisans Co-op',
    reorderLevel: 5,
    autoReorder: false,
    targetStockLevel: 20,
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-06-12')
  },
  {
    id: '3',
    name: 'Jungle Safari Water Bottle',
    barcode: '123456789003',
    category: 'Bottles',
    price: 24.99,
    costPrice: 9.99,
    stock: 78,
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?q=80&w=2073&auto=format&fit=crop',
    supplier: 'EcoBottle Supplies',
    reorderLevel: 20,
    autoReorder: true,
    targetStockLevel: 100,
    createdAt: new Date('2023-02-05'),
    updatedAt: new Date('2023-04-18')
  },
  {
    id: '4',
    name: 'Animal Keyring Set',
    barcode: '123456789004',
    category: 'Keyrings',
    price: 12.99,
    costPrice: 4.99,
    stock: 4,
    imageUrl: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=2070&auto=format&fit=crop',
    supplier: 'Safari Gifts Inc',
    reorderLevel: 25,
    autoReorder: true,
    targetStockLevel: 150,
    createdAt: new Date('2023-03-22'),
    updatedAt: new Date('2023-07-05')
  },
  {
    id: '5',
    name: 'Safari Landscape Canvas Print',
    barcode: '123456789005',
    category: 'Canvas',
    price: 79.99,
    costPrice: 39.99,
    stock: 24,
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2070&auto=format&fit=crop',
    supplier: 'WildArt Prints',
    reorderLevel: 8,
    createdAt: new Date('2023-02-18'),
    updatedAt: new Date('2023-05-30')
  },
  {
    id: '6',
    name: 'Wildlife Notebook Set',
    barcode: '123456789006',
    category: 'Stationery',
    price: 18.99,
    costPrice: 7.99,
    stock: 67,
    imageUrl: 'https://images.unsplash.com/photo-1531346680769-a1d79b57de5c?q=80&w=1932&auto=format&fit=crop',
    supplier: 'Jungle Stationery Co',
    reorderLevel: 15,
    createdAt: new Date('2023-01-25'),
    updatedAt: new Date('2023-06-08')
  }
];

// Helper function to load products from localStorage
const loadProductsFromStorage = (): Product[] => {
  try {
    const storedProducts = localStorage.getItem('inventoryProducts');
    if (storedProducts) {
      // Parse the JSON and convert string dates back to Date objects
      return JSON.parse(storedProducts, (key, value) => {
        if (key === 'createdAt' || key === 'updatedAt') {
          return new Date(value);
        }
        return value;
      });
    }
  } catch (error) {
    console.error('Error loading products from localStorage:', error);
  }
  return defaultProducts;
};

// Helper function to save products to localStorage
const saveProductsToStorage = (products: Product[]): void => {
  try {
    localStorage.setItem('inventoryProducts', JSON.stringify(products));
    console.log('Products saved to localStorage:', products);
  } catch (error) {
    console.error('Error saving products to localStorage:', error);
  }
};

// Initialize mockProducts from localStorage or default
export let mockProducts: Product[] = loadProductsFromStorage();

// Utility function to update product stock
export const updateProductStock = (items: BillItem[]): Product[] => {
  // Update stock for each product in the bill
  items.forEach(item => {
    const productIndex = mockProducts.findIndex(p => p.id === item.product.id);
    if (productIndex !== -1) {
      // Create a new product object with updated stock
      mockProducts[productIndex] = {
        ...mockProducts[productIndex],
        stock: mockProducts[productIndex].stock - item.quantity,
        updatedAt: new Date()
      };
    }
  });
  
  // Save the updated products to localStorage
  saveProductsToStorage(mockProducts);
  
  console.log('Updated global mockProducts stock:', mockProducts);
  return [...mockProducts]; // Return a copy of the updated array
};

// Function to reset stock to default values (useful for testing)
export const resetProductStock = (): Product[] => {
  mockProducts = [...defaultProducts];
  saveProductsToStorage(mockProducts);
  return mockProducts;
};

// Function to get product by ID
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find(product => product.id === id);
};

export const mockSales: Sale[] = [
  {
    id: '1',
    products: [
      {
        product: mockProducts[0],
        quantity: 1,
        priceAtSale: mockProducts[0].price
      }
    ],
    totalAmount: mockProducts[0].price,
    paymentMethod: 'card',
    employeeId: '1',
    channel: 'in-store',
    timestamp: new Date('2023-07-15T14:23:05')
  },
  {
    id: '2',
    products: [
      {
        product: mockProducts[1],
        quantity: 1,
        priceAtSale: mockProducts[1].price
      },
      {
        product: mockProducts[2],
        quantity: 2,
        priceAtSale: mockProducts[2].price
      }
    ],
    totalAmount: mockProducts[1].price + (mockProducts[2].price * 2),
    paymentMethod: 'cash',
    employeeId: '2',
    channel: 'in-store',
    timestamp: new Date('2023-07-16T10:45:22')
  },
  {
    id: '3',
    products: [
      {
        product: mockProducts[3],
        quantity: 1,
        priceAtSale: mockProducts[3].price
      }
    ],
    totalAmount: mockProducts[3].price,
    paymentMethod: 'online',
    customerId: 'cust001',
    employeeId: '1',
    channel: 'online',
    timestamp: new Date('2023-07-17T16:12:40')
  }
];

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'John Appleseed',
    email: 'john@invenhub.com',
    role: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=John+Appleseed&background=0D8ABC&color=fff'
  },
  {
    id: '2',
    name: 'Emily Parker',
    email: 'emily@invenhub.com',
    role: 'manager',
    avatar: 'https://ui-avatars.com/api/?name=Emily+Parker&background=2C3E50&color=fff'
  },
  {
    id: '3',
    name: 'Michael Smith',
    email: 'michael@invenhub.com',
    role: 'employee',
    avatar: 'https://ui-avatars.com/api/?name=Michael+Smith&background=E74C3C&color=fff'
  }
];

export const mockStatsData: StatsData[] = [
  {
    label: 'Total Sales',
    value: '₹32,549.00',
    change: 12.5,
    icon: 'dollar-sign'
  },
  {
    label: 'Products Sold',
    value: '1,342',
    change: 8.2,
    icon: 'shopping-bag'
  },
  {
    label: 'Active Products',
    value: '312',
    change: 4.1,
    icon: 'package'
  },
  {
    label: 'Low Stock Items',
    value: '28',
    change: -2.5,
    icon: 'alert-circle'
  }
];

export const mockSalesData: ChartData[] = [
  { name: 'Jan', value: 12400 },
  { name: 'Feb', value: 14500 },
  { name: 'Mar', value: 16500 },
  { name: 'Apr', value: 15200 },
  { name: 'May', value: 17800 },
  { name: 'Jun', value: 19500 },
  { name: 'Jul', value: 20100 },
  { name: 'Aug', value: 22500 },
  { name: 'Sep', value: 24100 },
  { name: 'Oct', value: 23400 },
  { name: 'Nov', value: 25800 },
  { name: 'Dec', value: 27900 }
];

export const mockCategoryData: ChartData[] = [
  { name: 'Apparel', value: 28 },
  { name: 'Bastar Art', value: 15 },
  { name: 'Bottles', value: 22 },
  { name: 'Keyrings', value: 18 },
  { name: 'Canvas', value: 10 },
  { name: 'Stationery', value: 7 }
];

export const mockCurrentUser = mockUsers[0];
