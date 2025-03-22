import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, CheckCircle, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Notification, NotificationType, useNotificationStore } from '@/lib/stores/notificationStore';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/lib/providers/LanguageProvider';
import { formatDistanceToNow } from 'date-fns';

const getIconForType = (type: NotificationType) => {
  switch (type) {
    case 'info':
      return <Info className="h-4 w-4 text-blue-500" />;
    case 'success':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
  }
};

const NotificationItem = ({ notification, onRead }: { notification: Notification, onRead: () => void }) => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    onRead();
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  return (
    <DropdownMenuItem 
      className={`flex flex-col items-start p-3 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''}`}
      onClick={handleClick}
    >
      <div className="flex items-start w-full">
        <div className="mr-2 mt-0.5">
          {getIconForType(notification.type)}
        </div>
        <div className="flex-1">
          <div className="font-medium">{notification.title}</div>
          <div className="text-sm text-muted-foreground">{notification.message}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
          </div>
        </div>
        {!notification.read && (
          <Badge variant="outline" className="ml-2 bg-primary h-2 w-2 rounded-full p-0" />
        )}
      </div>
    </DropdownMenuItem>
  );
};

export const NotificationDropdown = () => {
  const { t } = useTranslation();
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    clearAll 
  } = useNotificationStore();
  
  const handleRead = (id: string) => {
    markAsRead(id);
  };
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]" 
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          {t('notifications')}
          <div className="flex space-x-1">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={markAllAsRead}
              >
                <CheckCheck className="mr-1 h-4 w-4" />
                {t('markAllRead')}
              </Button>
            )}
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-xs"
                onClick={clearAll}
              >
                <X className="mr-1 h-4 w-4" />
                {t('clearAll')}
              </Button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {notifications.length > 0 ? (
            <ScrollArea className="h-[300px]">
              {notifications.map((notification) => (
                <NotificationItem 
                  key={notification.id} 
                  notification={notification} 
                  onRead={() => handleRead(notification.id)} 
                />
              ))}
            </ScrollArea>
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              {t('noNotifications')}
            </div>
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 