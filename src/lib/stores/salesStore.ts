import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mockSales } from '@/lib/mockData';
import { Sale, Product, ChartData } from '@/lib/types';
import { getAllSales, createSale, deleteSale as apiDeleteSale, getSalesAnalytics } from '@/api/sales';
import { getProductCategories } from '@/api/product';
import { useEffect } from 'react';

interface SalesState {
  sales: Sale[];
  isLoading: boolean;
  error: string | null;
  fetchSales: () => Promise<void>;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<Sale>;
  updateSale: (id: string, updatedSale: Partial<Sale>) => void;
  deleteSale: (id: string) => Promise<boolean>;
  
  // Analytics data getters
  getTotalRevenue: () => number;
  getTotalCost: () => number;
  getTotalProfit: () => number;
  getProfitMargin: () => number;
  getTotalItemsSold: () => number;
  getAverageOrderValue: () => number;
  getSalesByChannel: () => { name: string; value: number }[];
  getSalesByCategory: () => { name: string; value: number }[];
  getSalesByPaymentMethod: () => { name: string; value: number }[];
  getMonthlySalesData: () => ChartData[];
  getHourlySalesData: () => ChartData[];
  getProductPerformance: () => { name: string; sold: number; revenue: number }[];
  getLowStockProducts: () => Product[];
  // Add missing functions for Analytics page
  getCategorySalesData: () => Promise<{ name: string; value: number }[]>;
  getSalesChannelData: () => ChartData[];
  getSeasonalityData: () => { name: string; value: number; tourists: number }[];
}

// Helper function to ensure timestamp is a Date object
const ensureDateObject = (date: Date | string): Date => {
  if (date instanceof Date) return date;
  return new Date(date);
};

// Create a React hook to fetch sales data on component mount
export const useFetchSales = () => {
  const { fetchSales, isLoading, error } = useSalesStore();
  
  useEffect(() => {
    fetchSales();
  }, [fetchSales]);
  
  return { isLoading, error };
};

export const useSalesStore = create<SalesState>()(
  persist(
    (set, get) => ({
      // Initialize with empty sales array
      sales: [],
      isLoading: false,
      error: null,
      
      // Fetch sales from the API
      fetchSales: async () => {
        set({ isLoading: true, error: null });
        try {
          const salesData = await getAllSales();
          set({ 
            sales: salesData.map(sale => ({
              ...sale,
              timestamp: ensureDateObject(sale.timestamp)
            })),
            isLoading: false 
          });
        } catch (error) {
          console.error('Error fetching sales:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to fetch sales',
            isLoading: false 
          });
        }
      },
      
      // Add a new sale
      addSale: async (saleData: Omit<Sale, 'id'>) => {
        set({ isLoading: true, error: null });
        try {
          const newSale = await createSale(saleData);
          
          set((state) => ({ 
            sales: [...state.sales, {
              ...newSale,
              timestamp: ensureDateObject(newSale.timestamp)
            }],
            isLoading: false
          }));
          
          return newSale;
        } catch (error) {
          console.error('Error adding sale:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add sale',
            isLoading: false 
          });
          throw error;
        }
      },
      
      // Update a sale (local only for now, no API endpoint yet)
      updateSale: (id: string, updatedSale: Partial<Sale>) => 
        set((state) => ({
          sales: state.sales.map(sale => 
            sale.id === id ? { 
              ...sale, 
              ...updatedSale,
              timestamp: updatedSale.timestamp ? ensureDateObject(updatedSale.timestamp) : sale.timestamp
            } : sale
          )
        })),
      
      // Delete a sale
      deleteSale: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          const success = await apiDeleteSale(id);
          
          if (success) {
            set((state) => ({
              sales: state.sales.filter(sale => sale.id !== id),
              isLoading: false
            }));
          }
          
          return success;
        } catch (error) {
          console.error('Error deleting sale:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to delete sale',
            isLoading: false 
          });
          return false;
        }
      },
        
      // Analytics functions - these still use the local state but will reflect data from MongoDB
      getTotalRevenue: () => {
        const { sales } = get();
        return sales.reduce((total, sale) => total + sale.totalAmount, 0);
      },
      
      getTotalCost: () => {
        const { sales } = get();
        return sales.reduce((total, sale) => 
          total + sale.products.reduce((subtotal, item) => 
            subtotal + (item.product.costPrice * item.quantity), 0), 0);
      },
      
      getTotalProfit: () => {
        const { getTotalRevenue, getTotalCost } = get();
        return getTotalRevenue() - getTotalCost();
      },
      
      getProfitMargin: () => {
        const { getTotalRevenue, getTotalProfit } = get();
        const revenue = getTotalRevenue();
        return revenue > 0 ? (getTotalProfit() / revenue) * 100 : 0;
      },
      
      getTotalItemsSold: () => {
        const { sales } = get();
        return sales.reduce((total, sale) => 
          total + sale.products.reduce((subtotal, item) => subtotal + item.quantity, 0), 0);
      },
      
      getAverageOrderValue: () => {
        const { sales, getTotalRevenue } = get();
        return sales.length > 0 ? getTotalRevenue() / sales.length : 0;
      },
      
      getSalesByChannel: () => {
        const { sales } = get();
        const channels: Record<string, number> = {};
        
        sales.forEach(sale => {
          const channel = sale.channel;
          channels[channel] = (channels[channel] || 0) + sale.totalAmount;
        });
        
        return Object.entries(channels).map(([name, value]) => ({ name, value }));
      },
      
      getSalesByCategory: () => {
        const { sales } = get();
        const categories: Record<string, number> = {};
        
        sales.forEach(sale => {
          sale.products.forEach(item => {
            const category = item.product.category;
            const value = item.quantity * item.priceAtSale;
            categories[category] = (categories[category] || 0) + value;
          });
        });
        
        return Object.entries(categories).map(([name, value]) => ({ name, value }));
      },
      
      getSalesByPaymentMethod: () => {
        const { sales } = get();
        const methods: Record<string, number> = {};
        
        sales.forEach(sale => {
          const method = sale.paymentMethod;
          methods[method] = (methods[method] || 0) + sale.totalAmount;
        });
        
        return Object.entries(methods).map(([name, value]) => ({ name, value }));
      },
      
      getMonthlySalesData: () => {
        const { sales } = get();
        const monthlyData: Record<string, number> = {};
        
        // Sort sales by date
        const sortedSales = [...sales].sort((a, b) => 
          ensureDateObject(a.timestamp).getTime() - ensureDateObject(b.timestamp).getTime()
        );
        
        sortedSales.forEach(sale => {
          const date = ensureDateObject(sale.timestamp);
          const monthKey = date.toISOString().slice(0, 10); // YYYY-MM-DD format
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + sale.totalAmount;
        });
        
        return Object.entries(monthlyData).map(([name, value]) => ({
          name,
          value
        }));
      },
      
      getHourlySalesData: () => {
        const { sales } = get();
        const hourlyData: Record<string, number> = {};
        
        // Initialize all 24 hours with 0
        for (let i = 0; i < 24; i++) {
          hourlyData[i.toString().padStart(2, '0')] = 0;
        }
        
        // Get sales for the last 24 hours
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        sales
          .filter(sale => ensureDateObject(sale.timestamp) >= last24Hours)
          .forEach(sale => {
            const date = ensureDateObject(sale.timestamp);
            const hour = date.getHours().toString().padStart(2, '0');
            hourlyData[hour] = (hourlyData[hour] || 0) + sale.totalAmount;
          });
        
        return Object.entries(hourlyData)
          .sort((a, b) => a[0].localeCompare(b[0])) // Sort by hour
          .map(([name, value]) => ({
            name,
            value
          }));
      },
      
      getProductPerformance: () => {
        const { sales } = get();
        const products: Record<string, { name: string; sold: number; revenue: number }> = {};
        
        sales.forEach(sale => {
          sale.products.forEach(item => {
            const { name, id } = item.product;
            if (!products[id]) {
              products[id] = { name, sold: 0, revenue: 0 };
            }
            products[id].sold += item.quantity;
            products[id].revenue += item.quantity * item.priceAtSale;
          });
        });
        
        return Object.values(products);
      },
      
      getLowStockProducts: () => {
        const { sales } = get();
        const products: Record<string, Product> = {};
        
        // Extract all products from sales
        sales.forEach(sale => {
          sale.products.forEach(item => {
            const product = item.product;
            if (!products[product.id]) {
              products[product.id] = { ...product };
            }
          });
        });
        
        // Filter for low stock (less than 10 items)
        return Object.values(products).filter(product => product.stock < 10);
      },

      // Analytics page specific functions
      getCategorySalesData: async () => {
        const { sales } = get();
        const categorySales: Record<string, number> = {};
        
        try {
          // First, try to get categories from products collection in MongoDB
          const categories = await getProductCategories();
          
          // Initialize all categories with 0
          categories.forEach(category => {
            categorySales[category.name] = 0;
          });
          
          // Sum revenue by category from sales
          sales.forEach(sale => {
            sale.products.forEach(item => {
              const category = item.product.category;
              if (category) {
                const revenue = item.quantity * item.priceAtSale;
                categorySales[category] = (categorySales[category] || 0) + revenue;
              }
            });
          });
          
          // Return category data for charts
          return Object.entries(categorySales)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        } catch (error) {
          console.error('Error getting category sales data:', error);
          
          // Fallback: Extract unique categories from sales data
          const uniqueCategories = new Set<string>();
          
          sales.forEach(sale => {
            sale.products.forEach(item => {
              if (item.product.category) {
                uniqueCategories.add(item.product.category);
              }
            });
          });
          
          // Initialize categories with 0
          uniqueCategories.forEach(category => {
            categorySales[category] = 0;
          });
          
          // Sum revenue by category
          sales.forEach(sale => {
            sale.products.forEach(item => {
              const category = item.product.category;
              if (category) {
                const revenue = item.quantity * item.priceAtSale;
                categorySales[category] += revenue;
              }
            });
          });
          
          // If we have no categories, provide default fallback data
          if (Object.keys(categorySales).length === 0) {
            return [
              { name: "Bastar Art", value: 2500 },
              { name: "Toys", value: 1500 },
              { name: "Apparel", value: 1800 }
            ];
          }
          
          return Object.entries(categorySales)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
        }
      },
      
      getSalesChannelData: () => {
        const { sales } = get();
        const channelMap: Record<string, number> = {
          'in-store': 0,
          'online': 0
        };
        
        // Count sales by channel
        sales.forEach(sale => {
          const channel = sale.channel === 'online' ? 'online' : 'in-store';
          channelMap[channel] += sale.totalAmount;
        });
        
        // Calculate percentages
        const total = Object.values(channelMap).reduce((sum, value) => sum + value, 0);
        
        // Convert to array format and format names for display
        return Object.entries(channelMap).map(([key, value]) => {
          const name = key === 'in-store' ? 'In-Store Sales' : 'Online Sales';
          const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
          return { name, value: percentage };
        });
      },
      
      getSeasonalityData: () => {
        const { sales } = get();
        const monthlyData: Record<string, { value: number, tourists: number }> = {};
        
        // Initialize all months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(month => {
          monthlyData[month] = { value: 0, tourists: 0 };
        });
        
        // Set tourist estimates (this would come from a real API in production)
        const touristEstimates = {
          'Jan': 12000, 'Feb': 13500, 'Mar': 18000, 'Apr': 22000, 
          'May': 28000, 'Jun': 32000, 'Jul': 35000, 'Aug': 38000, 
          'Sep': 30000, 'Oct': 25000, 'Nov': 19000, 'Dec': 21000
        };
        
        // Sum sales by month
        sales.forEach(sale => {
          const date = ensureDateObject(sale.timestamp);
          const month = months[date.getMonth()];
          monthlyData[month].value += sale.totalAmount;
        });
        
        // Add tourist data
        Object.entries(touristEstimates).forEach(([month, tourists]) => {
          if (monthlyData[month]) {
            monthlyData[month].tourists = tourists;
          }
        });
        
        // Convert to array format for charts
        return Object.entries(monthlyData).map(([name, data]) => ({
          name,
          value: data.value,
          tourists: data.tourists
        }));
      },
    }),
    {
      name: 'jungle-safari-sales-storage', // Name in localStorage
      partialize: (state) => ({
        // Don't persist loading and error states
        sales: state.sales
      }),
      onRehydrateStorage: () => (state) => {
        // Ensure all timestamps are Date objects when rehydrating from storage
        if (state) {
          state.sales = state.sales.map(sale => ({
            ...sale,
            timestamp: ensureDateObject(sale.timestamp)
          }));
        }
      }
    }
  )
);
