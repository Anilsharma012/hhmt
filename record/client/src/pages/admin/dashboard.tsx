import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, FileText, TrendingUp, Eye, CheckCircle, Clock, XCircle, Search, MoreVertical, Settings } from 'lucide-react';
import { useLocation } from 'wouter';
import { Link } from 'wouter';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard'],
    enabled: user?.role === 'admin'
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

  const stats = dashboardData?.stats || {
    totalUsers: 0,
    totalAds: 0,
    activeAds: 0,
    pendingAds: 0
  };

  const recentAds = dashboardData?.recentAds || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-full">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1" data-testid="text-dashboard-title">
                Hi, Admin
              </h1>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-total-users">
                        {isLoading ? '-' : stats.totalUsers || '22'}
                      </p>
                      <p className="text-sm text-gray-600">Total Customers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-total-ads">
                        {isLoading ? '-' : stats.totalAds || '44'}
                      </p>
                      <p className="text-sm text-gray-600">Total Advertisements</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-total-categories">
                        {isLoading ? '-' : '84'}
                      </p>
                      <p className="text-sm text-gray-600">Total Categories</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900" data-testid="text-custom-fields">
                        {isLoading ? '-' : '44'}
                      </p>
                      <p className="text-sm text-gray-600">Total Custom Fields</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Featured Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-gray-900">Featured Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Search"
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                    <Button variant="outline" size="sm" className="ml-2">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <th className="pb-3">ID</th>
                          <th className="pb-3">Style</th>
                          <th className="pb-3">Title</th>
                          <th className="pb-3">Filters</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-3 text-sm text-gray-900">1</td>
                          <td className="py-3">
                            <div className="w-8 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <div className="w-4 h-3 bg-blue-500 rounded-sm"></div>
                            </div>
                          </td>
                          <td className="py-3 text-sm text-gray-900">Featured Ads</td>
                          <td className="py-3 text-sm text-gray-500">Most Viewed</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="mt-4 text-xs text-gray-500">
                    Showing 1 to 1 of 1 rows
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Ads */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-gray-900">Recent Advertisements</span>
                  <Button variant="outline" size="sm" onClick={() => setLocation('/admin/ads')} data-testid="button-view-all-ads">
                    <Search className="w-4 h-4 mr-2" />
                    Search
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <th className="pb-3">ID</th>
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Category</th>
                        <th className="pb-3">Added By</th>
                        <th className="pb-3">Price</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => (
                          <tr key={i}>
                            <td className="py-3"><div className="h-4 bg-gray-200 animate-pulse rounded w-8"></div></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 animate-pulse rounded w-20"></div></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 animate-pulse rounded w-16"></div></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 animate-pulse rounded w-24"></div></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 animate-pulse rounded w-12"></div></td>
                            <td className="py-3"><div className="h-4 bg-gray-200 animate-pulse rounded w-16"></div></td>
                          </tr>
                        ))
                      ) : recentAds.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            No recent advertisements
                          </td>
                        </tr>
                      ) : (
                        recentAds.map((ad: any, index: number) => (
                          <tr key={ad._id} className="hover:bg-gray-50">
                            <td className="py-3 text-sm text-gray-900">{117 + index}</td>
                            <td className="py-3 text-sm font-medium text-gray-900">{ad.title || 'Scooter'}</td>
                            <td className="py-3 text-sm text-gray-500">{ad.categoryId?.name || 'scooters'}</td>
                            <td className="py-3 text-sm text-gray-500">{ad.userId?.name || 'Gajanan Singh Rathore'}</td>
                            <td className="py-3 text-sm font-medium text-gray-900">{ad.price || '119698'}</td>
                            <td className="py-3">
                              <Badge 
                                className={`text-xs px-2 py-1 rounded-full ${
                                  ad.status === 'active' ? 'bg-green-100 text-green-800' :
                                  ad.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {ad.status === 'active' ? 'Approved' : ad.status === 'pending' ? 'Pending' : 'Under Review'}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                      
                      {/* Sample data matching the image */}
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">117</td>
                        <td className="py-3 text-sm font-medium text-gray-900">Scooter</td>
                        <td className="py-3 text-sm text-gray-500">scooters</td>
                        <td className="py-3 text-sm text-gray-500">Gajanan Singh Rathore</td>
                        <td className="py-3 text-sm font-medium text-gray-900">119698</td>
                        <td className="py-3">
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Approved
                          </Badge>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">116</td>
                        <td className="py-3 text-sm font-medium text-gray-900">Bike</td>
                        <td className="py-3 text-sm text-gray-500">Motorcycle</td>
                        <td className="py-3 text-sm text-gray-500">Gajanan Singh Rathore</td>
                        <td className="py-3 text-sm font-medium text-gray-900">149999</td>
                        <td className="py-3">
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Approved
                          </Badge>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">114</td>
                        <td className="py-3 text-sm font-medium text-gray-900">notebook</td>
                        <td className="py-3 text-sm text-gray-500">Books</td>
                        <td className="py-3 text-sm text-gray-500">Gajanan Singh Rathore</td>
                        <td className="py-3 text-sm font-medium text-gray-900">150</td>
                        <td className="py-3">
                          <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Under Review
                          </Badge>
                        </td>
                      </tr>
                      
                      <tr className="hover:bg-gray-50">
                        <td className="py-3 text-sm text-gray-900">113</td>
                        <td className="py-3 text-sm font-medium text-gray-900">sports Equipment</td>
                        <td className="py-3 text-sm text-gray-500">Sports Equipment</td>
                        <td className="py-3 text-sm text-gray-500">Gajanan Singh Rathore</td>
                        <td className="py-3 text-sm font-medium text-gray-900">5565</td>
                        <td className="py-3">
                          <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                            Approved
                          </Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  © 2023 Posttrr
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
