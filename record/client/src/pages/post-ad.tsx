import { useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertListingSchema } from '@shared/schema';
import { z } from 'zod';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { uploadImage } from '@/lib/api';
import { Upload, X, ImageIcon } from 'lucide-react';

const postAdSchema = insertListingSchema.extend({
  categoryId: z.string().min(1, 'Category is required'),
  location: z.object({
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    area: z.string().optional(),
    pincode: z.string().optional()
  })
});

type PostAdForm = z.infer<typeof postAdSchema>;

export default function PostAd() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PostAdForm>({
    resolver: zodResolver(postAdSchema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      categoryId: '',
      subcategoryId: '',
      location: {
        city: '',
        state: '',
        area: '',
        pincode: ''
      },
      images: [],
      status: 'draft'
    }
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories']
  });

  const { data: subcategories } = useQuery({
    queryKey: [form.watch('categoryId') ? `/api/categories/${form.watch('categoryId')}/subcategories` : '/api/categories/none/subcategories'],
    enabled: !!form.watch('categoryId')
  });

  const createListingMutation = useMutation({
    mutationFn: async (data: PostAdForm) => {
      const response = await apiRequest('POST', '/api/listings', {
        ...data,
        images: uploadedImages
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Listing created successfully!',
        description: 'Your ad has been submitted for review.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      setLocation(`/listing/${data.listing._id}`);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating listing',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const handleImageUpload = async (files: FileList) => {
    if (uploadedImages.length + files.length > 8) {
      toast({
        title: 'Too many images',
        description: 'You can upload a maximum of 8 images',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      setUploadedImages(prev => [...prev, ...urls]);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PostAdForm) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please login to post an ad',
        variant: 'destructive'
      });
      setLocation('/login');
      return;
    }

    createListingMutation.mutate(data);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-foreground mb-4">Login Required</h1>
              <p className="text-muted-foreground mb-6">
                You need to be logged in to post an ad.
              </p>
              <Button onClick={() => setLocation('/login')} data-testid="button-login-required">
                Login to Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-foreground" data-testid="text-post-ad-title">
              Post Your Ad
            </CardTitle>
            <p className="text-muted-foreground">
              Create a listing to sell your item
            </p>
          </CardHeader>
          
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="form-post-ad">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Basic Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter a catchy title for your ad"
                            {...field}
                            data-testid="input-title"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your item in detail..."
                            rows={5}
                            {...field}
                            data-testid="textarea-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (₹) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="Enter price in rupees"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            data-testid="input-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Category</h3>
                  
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-category">
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category: any) => (
                              category._id && <SelectItem key={category._id} value={category._id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {(subcategories as any)?.length > 0 && (
                    <FormField
                      control={form.control}
                      name="subcategoryId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subcategory</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-subcategory">
                                <SelectValue placeholder="Select a subcategory" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(subcategories as any)?.map((subcategory: any) => (
                                <SelectItem key={subcategory._id} value={subcategory._id}>
                                  {subcategory.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {/* Location */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Location</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="location.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter city"
                              {...field}
                              data-testid="input-city"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter state"
                              {...field}
                              data-testid="input-state"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter area/locality"
                              {...field}
                              data-testid="input-area"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location.pincode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter pincode"
                              {...field}
                              data-testid="input-pincode"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Photos</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload up to 8 photos to showcase your item
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative aspect-square">
                        <img 
                          src={image} 
                          alt={`Upload ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg border"
                          data-testid={`img-uploaded-${index}`}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 w-6 h-6 p-0"
                          onClick={() => removeImage(index)}
                          data-testid={`button-remove-image-${index}`}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {uploadedImages.length < 8 && (
                      <Label className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors">
                        <Input
                          type="file"
                          multiple
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                          data-testid="input-image-upload"
                        />
                        {uploading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground text-center">
                              Upload Images
                            </span>
                          </>
                        )}
                      </Label>
                    )}
                  </div>
                </div>

                {/* Submit Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      form.setValue('status', 'draft');
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={createListingMutation.isPending}
                    data-testid="button-save-draft"
                  >
                    Save as Draft
                  </Button>
                  
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      form.setValue('status', 'active');
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={createListingMutation.isPending}
                    data-testid="button-publish"
                  >
                    {createListingMutation.isPending ? 'Publishing...' : 'Publish Ad'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
