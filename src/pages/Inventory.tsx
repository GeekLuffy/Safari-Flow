import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import InventoryList from '@/components/inventory/InventoryList';
import LowStockList from '@/components/inventory/LowStockList';
import SupplierList from '@/components/suppliers/SupplierList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Inventory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'products';
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SafariFlow Inventory</h1>
          <p className="text-muted-foreground">
            Manage your safari souvenir products, track stock levels, and suppliers.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange} className="mb-6">
        <TabsList>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="barcode">Barcode Scanner</TabsTrigger>
        </TabsList>
        <TabsContent value="products">
          <InventoryList />
        </TabsContent>
        <TabsContent value="low-stock">
          <LowStockList />
        </TabsContent>
        <TabsContent value="suppliers">
          <SupplierList />
        </TabsContent>
        <TabsContent value="barcode">
          <div className="text-center p-10 text-muted-foreground">
            <p>Scan product barcodes for quick inventory checks and updates</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Inventory;
