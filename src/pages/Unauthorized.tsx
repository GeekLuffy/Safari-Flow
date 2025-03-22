import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/providers/AuthProvider';
import { motion } from 'framer-motion';

const Unauthorized: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[80vh] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
            </div>
            <CardTitle className="text-2xl">Access Denied</CardTitle>
            <CardDescription>
              You don't have permission to view this feature
            </CardDescription>
          </CardHeader>
          
          <CardContent className="text-center pb-2">
            <p className="text-muted-foreground mb-6">
              Your current role <strong>({user?.role})</strong> doesn't have access to this section.
              Please contact an administrator for assistance.
            </p>
            
            <div className="bg-muted p-4 rounded-lg text-sm mb-4">
              <h4 className="font-medium mb-2">Available features for {user?.role} users:</h4>
              {user?.role === 'staff' && (
                <ul className="list-disc pl-5 space-y-1">
                  <li>Dashboard: View summary of store performance</li>
                  <li>Transactions: Record and view sales</li>
                  <li>Analytics: View sales reports and statistics</li>
                  <li>Settings: Access user preferences and system settings</li>
                </ul>
              )}
              {user?.role === 'admin' && (
                <p>As an administrator, you have access to all features.</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <Button asChild>
              <Link to="/">
                <Home className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
};

export default Unauthorized; 