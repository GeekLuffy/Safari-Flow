import { Sale, Product } from '../lib/types';

// API Base URL
const API_BASE_URL = '/api';

// Fallback to mock data when API fails - set to false to only use MongoDB data
let useFallbackMode = false;

// Mock sales for fallback mode (simplified version)
const mockSales: Sale[] = [
  {
    id: '1',
    products: [
      {
        product: {
          id: '1',
          name: 'Safari T-Shirt',
          barcode: '123456789001',
          category: 'Apparel',
          price: 29.99,
          costPrice: 12.99,
          stock: 42,
          createdAt: new Date('2023-01-15'),
          updatedAt: new Date('2023-01-15')
        },
        quantity: 1,
        priceAtSale: 29.99
      }
    ],
    totalAmount: 29.99,
    paymentMethod: 'cash',
    employeeId: 'EMP-001',
    channel: 'in-store',
    timestamp: new Date('2023-07-01T10:30:00')
  },
  {
    id: '2',
    products: [
      {
        product: {
          id: '2',
          name: 'Lion Plush Toy',
          barcode: '123456789002',
          category: 'Toys',
          price: 19.99,
          costPrice: 8.50,
          stock: 30,
          createdAt: new Date('2023-01-20'),
          updatedAt: new Date('2023-01-20')
        },
        quantity: 2,
        priceAtSale: 19.99
      }
    ],
    totalAmount: 39.98,
    paymentMethod: 'card',
    customerName: 'John Doe',
    employeeId: 'EMP-002',
    channel: 'in-store',
    timestamp: new Date('2023-07-02T14:45:00')
  }
];

// Helper function to ensure timestamp is a Date object
const ensureDateObject = (date: Date | string): Date => {
  if (date instanceof Date) return date;
  return new Date(date);
};

// Helper function to convert API sale to client Sale type
const mapApiSaleToClientSale = (apiSale: any): Sale => {
  return {
    ...apiSale,
    timestamp: ensureDateObject(apiSale.timestamp),
    products: apiSale.products.map((item: any) => ({
      product: {
        id: item.product?._id || item.product?.id || item.productSnapshot?._id || 'unknown-id',
        name: item.productSnapshot?.name || item.product?.name || 'Unknown Product',
        barcode: item.productSnapshot?.barcode || item.product?.barcode || '',
        category: item.productSnapshot?.category || item.product?.category || '',
        price: item.productSnapshot?.price || item.product?.price || item.priceAtSale,
        costPrice: item.product?.costPrice || (item.priceAtSale * 0.6), // fallback to 60% of price
        stock: item.product?.stock || 0,
        createdAt: ensureDateObject(item.product?.createdAt || new Date()),
        updatedAt: ensureDateObject(item.product?.updatedAt || new Date())
      },
      quantity: item.quantity,
      priceAtSale: item.priceAtSale
    }))
  };
};

// Get all sales
export async function getAllSales(filters: Record<string, any> = {}): Promise<Sale[]> {
  if (useFallbackMode) {
    console.log('Using fallback mode for getting sales');
    return mockSales;
  }
  
  try {
    console.log('Fetching sales from API');
    
    // Build query string from filters
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const queryString = queryParams.toString();
    const url = `${API_BASE_URL}/sales${queryString ? `?${queryString}` : ''}`;
    
    const response = await fetch(url);
    
    console.log('Get Sales API response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Failed to fetch sales');
    }
    
    const sales = await response.json();
    return sales.map(mapApiSaleToClientSale);
  } catch (error) {
    console.error('Error getting sales:', error);
    // Always throw error instead of falling back to mock data
    throw error;
  }
}

// Get sale by ID
export async function getSaleById(id: string): Promise<Sale | null> {
  if (useFallbackMode) {
    console.log('Using fallback mode for getting sale by ID');
    const sale = mockSales.find(s => s.id === id);
    return sale || null;
  }
  
  try {
    console.log(`Fetching sale with ID ${id} from API`);
    const response = await fetch(`${API_BASE_URL}/sales/${id}`);
    
    console.log('Get Sale by ID API response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      
      throw new Error('Failed to fetch sale');
    }
    
    const sale = await response.json();
    return mapApiSaleToClientSale(sale);
  } catch (error) {
    console.error(`Error getting sale with ID ${id}:`, error);
    // Always throw error instead of falling back to mock data
    throw error;
  }
}

// Create a new sale
export async function createSale(saleData: Omit<Sale, 'id'>): Promise<Sale> {
  if (useFallbackMode) {
    console.log('Using fallback mode for creating sale');
    const newSale: Sale = {
      ...saleData,
      id: `mock-${Date.now()}`
    };
    mockSales.push(newSale);
    return newSale;
  }
  
  try {
    console.log('Creating sale via API');
    
    // Transform the sale data for the API
    const apiSaleData = {
      ...saleData,
      products: saleData.products.map(item => ({
        product: item.product.id,
        quantity: item.quantity,
        priceAtSale: item.priceAtSale
      }))
    };
    
    const response = await fetch(`${API_BASE_URL}/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiSaleData),
    });
    
    console.log('Create Sale API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Failed to create sale';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return createSale(saleData);
      }
      
      throw new Error(errorMessage);
    }
    
    const createdSale = await response.json();
    return mapApiSaleToClientSale(createdSale);
  } catch (error) {
    console.error('Error creating sale:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return createSale(saleData);
    }
    throw error;
  }
}

// Delete a sale
export async function deleteSale(id: string): Promise<boolean> {
  if (useFallbackMode) {
    console.log('Using fallback mode for deleting sale');
    const index = mockSales.findIndex(s => s.id === id);
    if (index === -1) {
      return false;
    }
    mockSales.splice(index, 1);
    return true;
  }
  
  try {
    console.log(`Deleting sale with ID ${id} via API`);
    const response = await fetch(`${API_BASE_URL}/sales/${id}`, {
      method: 'DELETE',
    });
    
    console.log('Delete Sale API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Failed to delete sale';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        console.error('Failed to parse error response:', e);
      }
      
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return deleteSale(id);
      }
      
      if (response.status === 404) {
        return false;
      }
      
      throw new Error(errorMessage);
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting sale with ID ${id}:`, error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return deleteSale(id);
    }
    throw error;
  }
}

// Get sales analytics
export async function getSalesAnalytics(): Promise<{
  totalRevenue: number;
  salesByPaymentMethod: { name: string; value: number }[];
  salesByChannel: { name: string; value: number }[];
  totalTransactions: number;
  productsSold: number;
}> {
  if (useFallbackMode) {
    console.log('Using fallback mode for getting sales analytics');
    
    // Calculate analytics from mock data
    const totalRevenue = mockSales.reduce((sum, sale) => sum + sale.totalAmount, 0);
    
    // Group by payment method
    const paymentMethods: Record<string, number> = {};
    mockSales.forEach(sale => {
      paymentMethods[sale.paymentMethod] = (paymentMethods[sale.paymentMethod] || 0) + sale.totalAmount;
    });
    
    // Group by channel
    const channels: Record<string, number> = {};
    mockSales.forEach(sale => {
      channels[sale.channel] = (channels[sale.channel] || 0) + sale.totalAmount;
    });
    
    // Count products sold
    const productsSold = mockSales.reduce((sum, sale) => {
      return sum + sale.products.reduce((pSum, p) => pSum + p.quantity, 0);
    }, 0);
    
    return {
      totalRevenue,
      salesByPaymentMethod: Object.entries(paymentMethods).map(([name, value]) => ({ name, value })),
      salesByChannel: Object.entries(channels).map(([name, value]) => ({ name, value })),
      totalTransactions: mockSales.length,
      productsSold
    };
  }
  
  try {
    console.log('Fetching sales analytics from API');
    const response = await fetch(`${API_BASE_URL}/sales/analytics/summary`);
    
    console.log('Get Sales Analytics API response status:', response.status);
    
    if (!response.ok) {
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return getSalesAnalytics();
      }
      throw new Error('Failed to fetch sales analytics');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting sales analytics:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return getSalesAnalytics();
    }
    throw error;
  }
} 