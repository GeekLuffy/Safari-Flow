import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '@/lib/providers/LanguageProvider';
import { useTheme } from '@/lib/providers/ThemeProvider';
import { useSettingsStore, Language, Theme } from '@/lib/stores/settingsStore';
import { useToast } from '@/components/ui/use-toast';
import { motion } from 'framer-motion';
import { Laptop, Moon, Sun, Languages, Info, Users, ShieldCheck, Edit2, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserRole, User } from '@/lib/stores/authStore';
import { useAuth } from '@/lib/providers/AuthProvider';
import { cn } from '@/lib/utils';

const Settings: React.FC = () => {
  const { t, language, setLanguage } = useTranslation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { toast } = useToast();
  const { user, userList, hasPermission, updateUserRole } = useAuth();
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<UserRole | null>(null);

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    toast({
      title: t('settingsUpdated'),
      duration: 2000,
    });
  };

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    toast({
      title: t('settingsUpdated'),
      duration: 2000,
    });
  };
  
  const startEditing = (userId: string, role: UserRole) => {
    setEditingUser(userId);
    setEditRole(role);
  };
  
  const saveUserRole = (userId: string) => {
    if (!editRole) return;
    
    // Update the user role
    if (updateUserRole(userId, editRole)) {
      toast({
        title: "Role Updated",
        description: "User role has been updated successfully.",
        duration: 3000,
      });
    }
    
    setEditingUser(null);
    setEditRole(null);
  };
  
  const cancelEditing = () => {
    setEditingUser(null);
    setEditRole(null);
  };

  return (
    <div className="container py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">{t('settings')}</h1>
            <p className="text-muted-foreground mt-1">
              {t('language') === 'Language' ? 
                'Manage your application preferences' : 
                'अपनी एप्लिकेशन प्राथमिकताएँ प्रबंधित करें'}
            </p>
          </div>
          
          <Card className="w-full md:w-auto">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="h-4 w-4" />
                {t('language') === 'Language' ? 'Active Settings' : 'सक्रिय सेटिंग्स'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Languages className="h-3 w-3" />
                  {t(language)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {theme === 'light' ? <Sun className="h-3 w-3" /> : theme === 'dark' ? <Moon className="h-3 w-3" /> : <Laptop className="h-3 w-3" />}
                  {t(theme)}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="language" className="w-full">
          <TabsList className={cn(
            "grid mb-8",
            hasPermission('settings') && user?.role === 'admin' 
              ? "grid-cols-3" 
              : "grid-cols-2"
          )}>
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              {t('language')}
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : theme === 'light' ? <Sun className="h-4 w-4" /> : <Laptop className="h-4 w-4" />}
              {t('theme')}
            </TabsTrigger>
            {hasPermission('settings') && user?.role === 'admin' && (
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                User Management
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="language">
            <Card>
              <CardHeader>
                <CardTitle>{t('languageSettings')}</CardTitle>
                <CardDescription>{t('selectLanguage')}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={language}
                  onValueChange={(value) => handleLanguageChange(value as Language)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="english" id="english" />
                    <Label htmlFor="english" className="flex-1 cursor-pointer font-medium">
                      {t('english')}
                      <p className="text-xs text-muted-foreground mt-1">English</p>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="hindi" id="hindi" />
                    <Label htmlFor="hindi" className="flex-1 cursor-pointer font-medium">
                      {t('hindi')}
                      <p className="text-xs text-muted-foreground mt-1">हिंदी</p>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                {t('language') === 'Language' ? 
                  'Language settings affect menus, labels and system messages.' : 
                  'भाषा सेटिंग्स मेनू, लेबल और सिस्टम संदेशों को प्रभावित करती हैं।'}
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="theme">
            <Card>
              <CardHeader>
                <CardTitle>{t('themeSettings')}</CardTitle>
                <CardDescription>{t('selectTheme')}</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={theme}
                  onValueChange={(value) => handleThemeChange(value as Theme)}
                  className="grid grid-cols-1 md:grid-cols-3 gap-4"
                >
                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="light" id="light" />
                    <Label htmlFor="light" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Sun className="h-4 w-4" />
                      {t('light')}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="dark" id="dark" />
                    <Label htmlFor="dark" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Moon className="h-4 w-4" />
                      {t('dark')}
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="system" id="system" />
                    <Label htmlFor="system" className="flex-1 cursor-pointer flex items-center gap-2">
                      <Laptop className="h-4 w-4" />
                      {t('system')}
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground border-t pt-4">
                {t('language') === 'Language' ? 
                  'Theme settings control the appearance of the application interface.' : 
                  'थीम सेटिंग्स एप्लिकेशन इंटरफेस की उपस्थिति को नियंत्रित करती हैं।'}
              </CardFooter>
            </Card>
          </TabsContent>
          
          {hasPermission('settings') && user?.role === 'admin' && (
            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>
                    Manage user accounts and roles
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userList.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback>
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{user.name}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {editingUser === user.id ? (
                              <Select 
                                value={editRole || user.role} 
                                onValueChange={(value) => setEditRole(value as UserRole)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="staff">Staff</SelectItem>
                                </SelectContent>
                              </Select>
                            ) : (
                              <Badge variant={user.role === 'admin' ? 'default' : 'outline'} className="capitalize">
                                {user.role}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {editingUser === user.id ? (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={cancelEditing}
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  onClick={() => saveUserRole(user.id)}
                                  className="gap-1"
                                >
                                  <Save className="h-3.5 w-3.5" />
                                  Save
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => startEditing(user.id, user.role)}
                                className="gap-1"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                                Edit Role
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="flex flex-col text-xs text-muted-foreground border-t pt-4">
                  <p>
                    <strong>Admin:</strong> Full access to all inventory, billing, and analytics features.
                  </p>
                  <p>
                    <strong>Staff:</strong> Access to dashboard, transactions, analytics, and settings.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Settings; 