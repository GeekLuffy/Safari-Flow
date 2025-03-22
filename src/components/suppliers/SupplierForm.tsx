import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { getSupplierById, createSupplier, updateSupplier } from '@/api/supplier';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';

// Validation schema
const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  contactPerson: z.string().min(2, { message: 'Contact person name is required' }),
  email: z.string().email({ message: 'Please enter a valid email address' }),
  phone: z.string().min(6, { message: 'Please enter a valid phone number' }),
  address: z.string().min(5, { message: 'Address is required' }),
});

interface SupplierFormData {
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
}

const SupplierForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditMode = id !== 'new';
  
  // Form setup
  const form = useForm<SupplierFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
    },
  });
  
  // Fetch supplier data if editing
  const { 
    data: supplier, 
    isLoading: isLoadingSupplier,
    error: supplierError
  } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => getSupplierById(id!),
    enabled: isEditMode,
  });
  
  // Mutation for saving supplier
  const { 
    mutate: saveSupplier, 
    isPending: isSaving,
    error: saveError 
  } = useMutation({
    mutationFn: async (data: SupplierFormData) => {
      if (id && id !== 'new') {
        return updateSupplier(id, data);
      } else {
        return createSupplier(data);
      }
    },
    onSuccess: () => {
      toast({
        title: `Supplier ${id === 'new' ? 'created' : 'updated'} successfully`,
        variant: 'success'
      });
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      navigate('/inventory?tab=suppliers');
    },
    onError: (error) => {
      console.error('Error saving supplier:', error);
      
      // Show error toast
      toast({
        title: `Failed to ${id === 'new' ? 'create' : 'update'} supplier`,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    },
  });
  
  // Update form when supplier data is loaded
  useEffect(() => {
    if (supplier) {
      form.reset({
        name: supplier.name,
        contactPerson: supplier.contactPerson,
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
      });
    }
  }, [supplier, form]);
  
  // Handle form submission
  const onSubmit = (data: SupplierFormData) => {
    saveSupplier(data);
  };
  
  // Handle cancel
  const handleCancel = () => {
    navigate('/inventory?tab=suppliers');
  };
  
  return (
    <div className="container py-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Supplier' : 'Add New Supplier'}</CardTitle>
          <CardDescription>
            {isEditMode 
              ? 'Update the supplier\'s details below' 
              : 'Enter the supplier\'s details below to add them to your system'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Loading state */}
          {isLoadingSupplier && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          
          {/* Error state */}
          {(supplierError || saveError) && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {supplierError instanceof Error
                  ? supplierError.message
                  : saveError instanceof Error
                  ? saveError.message
                  : 'An error occurred'}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Form */}
          {!isLoadingSupplier && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Jungle Threads Ltd" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person*</FormLabel>
                      <FormControl>
                        <Input placeholder="John Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input placeholder="john@junglethreads.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone*</FormLabel>
                        <FormControl>
                          <Input placeholder="555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Safari Way, Wilderness" 
                          className="min-h-20" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={isSaving || isLoadingSupplier}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSaving ? 'Saving...' : 'Save Supplier'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SupplierForm; 