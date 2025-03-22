import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDown, ArrowUp, DollarSign, Package, ShoppingBag, AlertCircle, BarChart, CheckCircle, IndianRupee } from 'lucide-react';

interface StatsCardProps {
  data: {
    title: string;
    value: string | number;
    description?: string;
    trend?: string;
    trendDirection?: 'up' | 'down';
    icon?: string;
  };
  className?: string;
}

const getIcon = (icon: string | undefined) => {
  switch (icon) {
    case 'currency':
      return <IndianRupee className="h-5 w-5" />;
    case 'product':
      return <ShoppingBag className="h-5 w-5" />;
    case 'inventory':
      return <Package className="h-5 w-5" />;
    case 'profit':
      return <BarChart className="h-5 w-5" />;
    case 'alert':
      return <AlertCircle className="h-5 w-5" />;
    case 'success':
      return <CheckCircle className="h-5 w-5" />;
    default:
      return <IndianRupee className="h-5 w-5" />;
  }
};

const StatsCard: React.FC<StatsCardProps> = ({ data, className }) => {
  // Check if the value is negative (for numeric values)
  const isNegative = typeof data.value === 'string' 
    ? data.value.startsWith('-') 
    : data.value < 0;
  
  return (
    <Card className={cn("overflow-hidden transition-all duration-200 hover:shadow-md", className)}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{data.title}</p>
            <h3 className={cn("text-2xl font-bold", isNegative && "text-red-600")}>{data.value}</h3>
            {data.description && (
              <p className="text-sm text-muted-foreground">{data.description}</p>
            )}
            {data.trend && (
              <div className="flex items-center gap-1 mt-1">
                <div className={cn(
                  "flex items-center text-xs font-medium",
                  data.trendDirection === "up" ? "text-green-500" : "text-red-500"
                )}>
                  {data.trendDirection === "up" 
                    ? <ArrowUp className="h-3 w-3 mr-1" /> 
                    : <ArrowDown className="h-3 w-3 mr-1" />
                  }
                  <span>{data.trend}</span>
                </div>
              </div>
            )}
          </div>
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full",
            isNegative ? "bg-red-100 text-red-600" :
            data.trendDirection === "up" ? "bg-green-100 text-green-600" : 
            data.trendDirection === "down" ? "bg-red-100 text-red-600" : 
            "bg-blue-100 text-blue-600"
          )}>
            {getIcon(data.icon)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsCard;
