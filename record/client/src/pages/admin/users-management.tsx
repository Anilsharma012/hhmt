import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Shield, ShieldCheck, Ban, Mail, Phone, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';

export default function UsersManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    verified: '',
    page: 1
  });

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['/api/admin/users', { role: filters.role, q: filters.search, verified: filters.verified }],
    enabled: user?.role === 'admin'
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'User updated',
        description: 'The user has been updated successfully.'
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button onClick={() => setLocation('/')} data-testid="button-go-home">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const users = (usersData as any)?.data || [];
  const pagination = { total: users.length, pages: 1 };

  const handleVerificationToggle = (userId: string, isVerified: boolean) => {
    updateUserMutation.mutate({
      id: userId,
      updates: { isVerified: !isVerified }
    });
  };

  const handleRoleUpdate = (userId: string, role: string) => {
    updateUserMutation.mutate({
      id: userId,
      updates: { role }
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2" data-testid="text-users-management-title">
                Users Management
              </h1>
              <p className="text-muted-foreground">
                Manage all users on the platform
              </p>
            </div>

            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Input
                      placeholder="Search users..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                      data-testid="input-search-users"
                    />
                  </div>
                  
                  <div>
                    <Select value={filters.role} onValueChange={(value) => setFilters(prev => ({ ...prev, role: value, page: 1 }))}>
                      <SelectTrigger data-testid="select-role-filter">
                        <SelectValue placeholder="All Roles" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Select value={filters.verified} onValueChange={(value) => setFilters(prev => ({ ...prev, verified: value, page: 1 }))}>
                      <SelectTrigger data-testid="select-verified-filter">
                        <SelectValue placeholder="All Users" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users</SelectItem>
                        <SelectItem value="true">Verified</SelectItem>
                        <SelectItem value="false">Unverified</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Button 
                      variant="outline" 
                      onClick={() => setFilters({ search: '', role: '', verified: '', page: 1 })}
                      data-testid="button-clear-filters"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Users ({pagination.total || 0})</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-12 h-12 bg-muted animate-pulse rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted animate-pulse rounded w-1/3"></div>
                          <div className="h-3 bg-muted animate-pulse rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground" data-testid="text-no-users">
                      No users found
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users.map((userData: any) => (
                      <div key={userData._id} className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={userData.avatar} />
                          <AvatarFallback data-testid={`text-user-initials-${userData._id}`}>
                            {getInitials(userData.name)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-foreground" data-testid={`text-user-name-${userData._id}`}>
                              {userData.name}
                            </h4>
                            <Badge 
                              variant={userData.role === 'admin' ? 'default' : 'secondary'}
                              data-testid={`badge-role-${userData._id}`}
                            >
                              {userData.role}
                            </Badge>
                            {userData.isVerified && (
                              <Badge className="bg-green-500" data-testid={`badge-verified-${userData._id}`}>
                                Verified
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              <span data-testid={`text-user-email-${userData._id}`}>
                                {userData.email}
                              </span>
                            </div>
                            {userData.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                <span data-testid={`text-user-phone-${userData._id}`}>
                                  {userData.phone}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 mr-1" />
                            Joined {new Date(userData.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVerificationToggle(userData._id, userData.isVerified)}
                              data-testid={`button-verify-${userData._id}`}
                            >
                              {userData.isVerified ? (
                                <ShieldCheck className="w-3 h-3 text-green-500" />
                              ) : (
                                <Shield className="w-3 h-3" />
                              )}
                            </Button>
                            
                            {userData.role !== 'admin' && userData._id !== user._id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleUpdate(userData._id, 'admin')}
                                data-testid={`button-make-admin-${userData._id}`}
                              >
                                <Shield className="w-3 h-3" />
                              </Button>
                            )}
                            
                            {userData.role === 'admin' && userData._id !== user._id && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRoleUpdate(userData._id, 'user')}
                                data-testid={`button-remove-admin-${userData._id}`}
                              >
                                <Ban className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button 
                      variant="outline" 
                      disabled={filters.page === 1}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                      data-testid="button-prev-page"
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground mx-4">
                      Page {filters.page} of {pagination.pages}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      disabled={filters.page === pagination.pages}
                      onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                      data-testid="button-next-page"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
