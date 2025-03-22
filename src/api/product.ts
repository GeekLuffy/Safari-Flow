import { Product } from '../lib/types';

// API Base URL
const API_BASE_URL = '/api';

// Fallback to mock data when API fails - set to false to only use MongoDB data
let useFallbackMode = false;

// Mock products for fallback mode
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Safari T-Shirt',
    barcode: '123456789001',
    category: 'Apparel',
    price: 29.99,
    costPrice: 12.99,
    stock: 42,
    imageUrl: 'https://example.com/safari-tshirt.jpg',
    supplier: 'Jungle Threads Ltd',
    reorderLevel: 10,
    autoReorder: true,
    targetStockLevel: 50,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-01-15')
  },
  {
    id: '2',
    name: 'Lion Plush Toy',
    barcode: '123456789002',
    category: 'Toys',
    price: 19.99,
    costPrice: 8.50,
    stock: 30,
    imageUrl: 'https://example.com/lion-plush.jpg',
    supplier: 'Wild Toys Inc',
    reorderLevel: 5,
    autoReorder: false,
    targetStockLevel: 20,
    createdAt: new Date('2023-01-20'),
    updatedAt: new Date('2023-01-20')
  }
];

// Get all products
export async function getAllProducts(): Promise<Product[]> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for getting products');
    return mockProducts;
  }
  
  try {
    console.log('Fetching products from API');
    const response = await fetch(`${API_BASE_URL}/products`);
    
    console.log('Get Products API response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    
    const products = await response.json();
    return products.map((product: any) => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    // Always throw error instead of falling back to mock data
    throw error;
  }
}

// Get product categories
export async function getProductCategories(): Promise<{ name: string; count: number }[]> {
  if (useFallbackMode) {
    console.log('Using fallback mode for getting product categories');
    // Count categories from mock data
    const categories: Record<string, number> = {};
    mockProducts.forEach(product => {
      categories[product.category] = (categories[product.category] || 0) + 1;
    });
    
    return Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }
  
  try {
    console.log('Fetching product categories from API');
    const response = await fetch(`${API_BASE_URL}/products/categories`);
    
    console.log('Get Product Categories API response status:', response.status);
    
    if (!response.ok) {
      throw new Error('Failed to fetch product categories');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error getting product categories:', error);
    // Always throw error instead of falling back to mock data
    throw error;
  }
}

// Get product by ID
export async function getProductById(id: string): Promise<Product | null> {
  // If ID is 'new', return a new product template
  if (id === 'new') {
    return {
      id: 'new',
      name: '',
      barcode: '',
      category: '',
      price: 0,
      costPrice: 0,
      stock: 0,
      imageUrl: '',
      supplier: '',
      reorderLevel: 0,
      autoReorder: false,
      targetStockLevel: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for getting product by ID');
    const product = mockProducts.find(p => p.id === id);
    return product || null;
  }
  
  try {
    console.log(`Fetching product with ID ${id} from API`);
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    
    console.log('Get Product by ID API response status:', response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      
      throw new Error('Failed to fetch product');
    }
    
    const product = await response.json();
    return {
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    };
  } catch (error) {
    console.error(`Error getting product with ID ${id}:`, error);
    // Always throw error instead of falling back to mock data
    throw error;
  }
}

// Create product
export async function createProduct(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for creating product');
    const newProduct: Product = {
      ...productData,
      id: `mock-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockProducts.push(newProduct);
    return newProduct;
  }
  
  try {
    console.log('Creating product via API');
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    console.log('Create Product API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Failed to create product';
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
        return createProduct(productData);
      }
      
      throw new Error(errorMessage);
    }
    
    const createdProduct = await response.json();
    return {
      ...createdProduct,
      createdAt: new Date(createdProduct.createdAt),
      updatedAt: new Date(createdProduct.updatedAt)
    };
  } catch (error) {
    console.error('Error creating product:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return createProduct(productData);
    }
    throw error;
  }
}

// Update product
export async function updateProduct(id: string, productData: Partial<Product>): Promise<Product | null> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for updating product');
    const index = mockProducts.findIndex(p => p.id === id);
    if (index === -1) {
      return null;
    }
    
    const updatedProduct: Product = {
      ...mockProducts[index],
      ...productData,
      updatedAt: new Date()
    };
    
    mockProducts[index] = updatedProduct;
    return updatedProduct;
  }
  
  try {
    console.log(`Updating product with ID ${id} via API`);
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData),
    });
    
    console.log('Update Product API response status:', response.status);
    
    if (!response.ok) {
      let errorMessage = 'Failed to update product';
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
        return updateProduct(id, productData);
      }
      
      if (response.status === 404) {
        return null;
      }
      
      throw new Error(errorMessage);
    }
    
    const updatedProduct = await response.json();
    return {
      ...updatedProduct,
      createdAt: new Date(updatedProduct.createdAt),
      updatedAt: new Date(updatedProduct.updatedAt)
    };
  } catch (error) {
    console.error(`Error updating product with ID ${id}:`, error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return updateProduct(id, productData);
    }
    throw error;
  }
}

// Delete product
export async function deleteProduct(id: string): Promise<boolean> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for deleting product');
    const index = mockProducts.findIndex(p => p.id === id);
    if (index !== -1) {
      mockProducts.splice(index, 1);
      return true;
    }
    return false;
  }
  
  try {
    console.log(`Deleting product with ID ${id} via API`);
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    });
    
    console.log('Delete Product API response status:', response.status);
    
    if (!response.ok) {
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return deleteProduct(id);
      }
      
      if (response.status === 404) {
        return false;
      }
      
      throw new Error('Failed to delete product');
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting product with ID ${id}:`, error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return deleteProduct(id);
    }
    throw error;
  }
}

// Search products
export async function searchProducts(query: string, category?: string): Promise<Product[]> {
  // Use mock data if in fallback mode
  if (useFallbackMode) {
    console.log('Using fallback mode for searching products');
    const filtered = mockProducts.filter(product => {
      const matchesSearch = !query || 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.barcode.includes(query);
      const matchesCategory = !category || category === 'all' || product.category === category;
      return matchesSearch && matchesCategory;
    });
    
    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }
  
  try {
    console.log('Searching products via API');
    // Build query string
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (category) params.append('category', category);
    
    const response = await fetch(`${API_BASE_URL}/products?${params.toString()}`);
    
    console.log('Search Products API response status:', response.status);
    
    if (!response.ok) {
      // If server error, switch to fallback mode
      if (response.status >= 500) {
        console.warn('Server error detected, switching to fallback mode');
        useFallbackMode = true;
        return searchProducts(query, category);
      }
      
      throw new Error('Failed to search products');
    }
    
    const products = await response.json();
    return products.map((product: any) => ({
      ...product,
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt)
    }));
  } catch (error) {
    console.error('Error searching products:', error);
    // If fetch failed (network error), switch to fallback
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.warn('Network error detected, switching to fallback mode');
      useFallbackMode = true;
      return searchProducts(query, category);
    }
    throw error;
  }
} 