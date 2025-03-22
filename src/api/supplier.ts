import { Supplier } from '../lib/types';

// API Base URL
const API_BASE_URL = '/api';

// Fallback to mock data when API fails - set to true to only use MongoDB data
let useFallbackMode = true;

// Mock suppliers for fallback mode
export const mockSuppliers: Supplier[] = [
  {
    id: '1',
    name: 'Jungle Threads Ltd',
    contactPerson: 'John Smith',
    email: 'john@junglethreads.com',
    phone: '555-123-4567',
    address: '123 Safari Way, Wilderness',
    products: ['1', '2'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Wild Toys Inc',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@wildtoys.com',
    phone: '555-987-6543',
    address: '456 Jungle Ave, Forestville',
    products: ['3'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Safari Gifts Co',
    contactPerson: 'David Williams',
    email: 'david@safarigifts.com',
    phone: '555-246-8135',
    address: '789 Animal Trail, Wildpark',
    products: ['4', '5'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

// Helper function to ensure timestamp is a Date object
const ensureDateObject = (date: Date | string): Date => {
  if (date instanceof Date) return date;
  return new Date(date);
};

// Helper to ensure all suppliers have consistent structure
function normalizeSupplier(supplier: any): Supplier {
  return {
    id: supplier.id || supplier._id || '',
    name: supplier.name || '',
    contactPerson: supplier.contactPerson || '',
    email: supplier.email || '',
    phone: supplier.phone || '',
    address: supplier.address || '',
    products: supplier.products || [],
    createdAt: ensureDateObject(supplier.createdAt) || new Date(),
    updatedAt: ensureDateObject(supplier.updatedAt) || new Date()
  };
}

// Get all suppliers
export async function getAllSuppliers(): Promise<Supplier[]> {
  try {
    console.log('Fetching suppliers from API');
    const response = await fetch(`${API_BASE_URL}/suppliers`);
    
    if (!response.ok) {
      console.log('API response not OK, falling back to mock data');
      return mockSuppliers;
    }
    
    const suppliers = await response.json();
    return suppliers.map((supplier: any) => normalizeSupplier(supplier));
  } catch (error) {
    console.error('Error getting suppliers:', error);
    console.log('Falling back to mock data due to error');
    return mockSuppliers;
  }
}

// Get supplier by ID
export async function getSupplierById(id: string): Promise<Supplier> {
  if (useFallbackMode) {
    console.log('Using fallback mode for getting supplier by ID');
    const supplier = mockSuppliers.find(s => s.id === id);
    if (supplier) {
      return supplier;
    }
    throw new Error('Supplier not found');
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch supplier');
    }
    
    const supplier = await response.json();
    return normalizeSupplier(supplier);
  } catch (error) {
    console.error('Error getting supplier:', error);
    throw error;
  }
}

// Create a new supplier
export async function createSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
  if (useFallbackMode) {
    console.log('Using fallback mode for creating supplier');
    const newSupplier: Supplier = {
      id: (mockSuppliers.length + 1).toString(),
      ...supplierData,
      products: supplierData.products || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    mockSuppliers.push(newSupplier);
    return newSupplier;
  }
  
  try {
    console.log('Creating supplier via API');
    const response = await fetch(`${API_BASE_URL}/suppliers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(supplierData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create supplier');
    }
    
    const createdSupplier = await response.json();
    return {
      ...createdSupplier,
      createdAt: ensureDateObject(createdSupplier.createdAt),
      updatedAt: ensureDateObject(createdSupplier.updatedAt)
    };
  } catch (error) {
    console.error('Error creating supplier:', error);
    throw error;
  }
}

// Update a supplier
export async function updateSupplier(id: string, supplierData: Partial<Supplier>): Promise<Supplier | null> {
  if (useFallbackMode) {
    console.log('Using fallback mode for updating supplier');
    const index = mockSuppliers.findIndex(s => s.id === id);
    
    if (index === -1) {
      return null;
    }
    
    const updatedSupplier: Supplier = {
      ...mockSuppliers[index],
      ...supplierData,
      updatedAt: new Date()
    };
    
    mockSuppliers[index] = updatedSupplier;
    return updatedSupplier;
  }
  
  try {
    console.log(`Updating supplier with ID ${id} via API`);
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(supplierData)
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      
      throw new Error('Failed to update supplier');
    }
    
    const updatedSupplier = await response.json();
    return {
      ...updatedSupplier,
      createdAt: ensureDateObject(updatedSupplier.createdAt),
      updatedAt: ensureDateObject(updatedSupplier.updatedAt)
    };
  } catch (error) {
    console.error(`Error updating supplier with ID ${id}:`, error);
    throw error;
  }
}

// Delete a supplier
export async function deleteSupplier(id: string): Promise<boolean> {
  if (useFallbackMode) {
    console.log('Using fallback mode for deleting supplier');
    const index = mockSuppliers.findIndex(s => s.id === id);
    
    if (index === -1) {
      return false;
    }
    
    mockSuppliers.splice(index, 1);
    return true;
  }
  
  try {
    console.log(`Deleting supplier with ID ${id} via API`);
    const response = await fetch(`${API_BASE_URL}/suppliers/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return false;
      }
      
      throw new Error('Failed to delete supplier');
    }
    
    return true;
  } catch (error) {
    console.error(`Error deleting supplier with ID ${id}:`, error);
    throw error;
  }
} 