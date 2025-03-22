import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { useAuth } from '@/lib/providers/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldCheck } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, hasPermission } = useAuth();
  
  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SafariFlow Dashboard</h1>
          <p className="text-muted-foreground">
            Track inventory, sales, and performance metrics for your safari souvenir shop.
          </p>
        </div>
        
        <div className="flex items-start gap-2">
          {hasPermission('transactions') && (
            <Link to="/transactions">
              <Button>
                Add New Transaction
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <Alert className="mb-6">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle className="flex items-center gap-2">
          Welcome, {user?.name}!
          <Badge variant={user?.role === 'admin' ? 'default' : 'outline'} className="capitalize">
            {user?.role}
          </Badge>
        </AlertTitle>
        <AlertDescription>
          {user?.role === 'admin' 
            ? "You have full access to all features of the system."
            : "You have access to Dashboard, Transactions, Analytics, and Settings. Other features are restricted."}
        </AlertDescription>
      </Alert>
      
      <DashboardOverview />
    </div>
  );
};

export default Dashboard;
