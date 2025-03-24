import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';

import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import PageTransition from './components/layout/PageTransition';

import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Billing from './pages/Billing';
import Analytics from './pages/Analytics';
import Transactions from './pages/Transactions';
import PurchaseOrders from './pages/PurchaseOrders';
import Auth from './pages/Auth';
import Checkout from './pages/Checkout';
import PaymentConfirmation from './pages/PaymentConfirmation';
import Settings from './pages/Settings';
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import SupplierForm from './components/suppliers/SupplierForm';

import { useIsMobile } from './hooks/use-mobile';
import { useLocation } from 'react-router-dom';
import { ThemeProvider } from './lib/providers/ThemeProvider';
import { LanguageProvider } from './lib/providers/LanguageProvider';
import { NotificationProvider } from './lib/providers/NotificationProvider';
import { AuthProvider } from './lib/providers/AuthProvider';
import { AutoReorderProvider } from './lib/providers/AutoReorderProvider';

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const location = useLocation();
  
  // Don't show layout on auth page or payment pages
  if (location.pathname === '/auth' || 
      location.pathname === '/checkout' || 
      location.pathname === '/payment-confirmation') {
    return <>{children}</>;
  }
  
  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <Navbar toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 pb-10 overflow-y-auto">
          <div className="h-full">
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <AutoReorderProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <AuthProvider>
                  <AnimatePresence mode="wait">
                    <Routes>
                      <Route
                        path="/*"
                        element={
                          <AppLayout>
                            <Routes>
                              <Route path="/" element={<Dashboard />} />
                              <Route path="/inventory" element={<Inventory />} />
                              <Route path="/suppliers/new" element={<SupplierForm />} />
                              <Route path="/suppliers/:id" element={<SupplierForm />} />
                              <Route path="/billing" element={<Billing />} />
                              <Route path="/transactions" element={<Transactions />} />
                              <Route path="/analytics" element={<Analytics />} />
                              <Route path="/purchase-orders" element={<PurchaseOrders />} />
                              <Route path="/settings" element={<Settings />} />
                              <Route path="/checkout" element={<Checkout />} />
                              <Route path="/payment-confirmation" element={<PaymentConfirmation />} />
                              <Route path="/unauthorized" element={<Unauthorized />} />
                              <Route path="*" element={<NotFound />} />
                            </Routes>
                          </AppLayout>
                        }
                      />
                      <Route path="/auth" element={<Auth />} />
                    </Routes>
                  </AnimatePresence>
                </AuthProvider>
              </BrowserRouter>
            </AutoReorderProvider>
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
