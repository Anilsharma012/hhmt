import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Plus, Edit, Trash2, Eye, EyeOff, Save, X } from 'lucide-react';
import { useLocation } from 'wouter';

interface PaymentGateway {
  _id?: string;
  name: string;
  type: 'razorpay' | 'phonepe' | 'stripe' | 'manual';
  isActive: boolean;
  config: {
    publicKey?: string;
    secretKey?: string;
    webhookSecret?: string;
    merchantId?: string;
  };
}

export default function PaymentGatewayManagement() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [newGateway, setNewGateway] = useState<PaymentGateway>({
    name: '',
    type: 'razorpay',
    isActive: false,
    config: {}
  });
  
  const queryClient = useQueryClient();

  const isAdmin = !!user && user.role === 'admin';

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['/api/admin/payment-gateways'],
    enabled: isAdmin
  });

  const createGatewayMutation = useMutation({
    mutationFn: async (gateway: PaymentGateway) => {
      const response = await fetch('/api/admin/payment-gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateway)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-gateways'] });
      setNewGateway({
        name: '',
        type: 'razorpay',
        isActive: false,
        config: {}
      });
    }
  });

  const updateGatewayMutation = useMutation({
    mutationFn: async ({ id, gateway }: { id: string; gateway: PaymentGateway }) => {
      const response = await fetch(`/api/admin/payment-gateways/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gateway)
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-gateways'] });
      setIsEditing(null);
    }
  });

  const deleteGatewayMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/payment-gateways/${id}`, {
        method: 'DELETE'
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payment-gateways'] });
    }
  });

  const toggleSecret = (id: string) => {
    setShowSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getGatewayIcon = (type: string) => {
    switch (type) {
      case 'razorpay': return '💳';
      case 'phonepe': return '📱';
      case 'stripe': return '💰';
      default: return '🏦';
    }
  };

  const getConfigFields = (type: string) => {
    switch (type) {
      case 'razorpay':
        return ['publicKey', 'secretKey', 'webhookSecret'];
      case 'phonepe':
        return ['merchantId', 'secretKey', 'webhookSecret'];
      case 'stripe':
        return ['publicKey', 'secretKey', 'webhookSecret'];
      default:
        return ['accountName', 'accountNumber', 'ifscCode'];
    }
  };

  return (!isAdmin ? (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card>
        <CardContent className="p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <Button onClick={() => setLocation('/')}>Go Home</Button>
        </CardContent>
      </Card>
    </div>
  ) : (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <AdminSidebar />
        
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                Payment Gateway Management
              </h1>
              <p className="text-gray-600">
                Manage payment gateways and configure API keys for Razorpay, PhonePe, and Stripe
              </p>
            </div>

            <Tabs defaultValue="gateways" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="gateways">Payment Gateways</TabsTrigger>
                <TabsTrigger value="add-new">Add New Gateway</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              {/* Existing Gateways */}
              <TabsContent value="gateways">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <Card key={i} className="border-0 shadow-sm">
                        <CardContent className="p-6">
                          <div className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded"></div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    gateways.map((gateway: PaymentGateway) => (
                      <Card key={gateway._id} className="border-0 shadow-sm">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{getGatewayIcon(gateway.type)}</span>
                              <span className="text-lg font-semibold">{gateway.name}</span>
                            </div>
                            <Badge variant={gateway.isActive ? 'default' : 'secondary'}>
                              {gateway.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs font-medium text-gray-500 uppercase">Type</Label>
                              <p className="text-sm font-medium capitalize">{gateway.type}</p>
                            </div>
                            
                            {getConfigFields(gateway.type).map((field) => (
                              <div key={field}>
                                <Label className="text-xs font-medium text-gray-500 uppercase">
                                  {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                                </Label>
                                <div className="flex items-center space-x-2">
                                  <p className="text-sm font-mono">
                                    {showSecrets[gateway._id!] 
                                      ? gateway.config[field as keyof typeof gateway.config] || 'Not set'
                                      : '••••••••••••••••'
                                    }
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => toggleSecret(gateway._id!)}
                                    className="p-1 h-6 w-6"
                                  >
                                    {showSecrets[gateway._id!] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            <div className="flex items-center justify-between pt-4">
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setIsEditing(gateway._id!)}
                                >
                                  <Edit className="w-3 h-3 mr-1" />
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteGatewayMutation.mutate(gateway._id!)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-3 h-3 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Add New Gateway */}
              <TabsContent value="add-new">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Add New Payment Gateway</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="gateway-name">Gateway Name</Label>
                        <Input
                          id="gateway-name"
                          placeholder="e.g., Razorpay Production"
                          value={newGateway.name}
                          onChange={(e) => setNewGateway(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="gateway-type">Gateway Type</Label>
                        <Select 
                          value={newGateway.type} 
                          onValueChange={(value) => setNewGateway(prev => ({ 
                            ...prev, 
                            type: value as PaymentGateway['type'],
                            config: {} 
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select gateway type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="razorpay">Razorpay</SelectItem>
                            <SelectItem value="phonepe">PhonePe</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="manual">Manual/Bank Transfer</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Dynamic Configuration Fields */}
                    <div className="space-y-4">
                      <h3 className="font-semibold">Configuration</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {getConfigFields(newGateway.type).map((field) => (
                          <div key={field}>
                            <Label htmlFor={field}>
                              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Label>
                            <Input
                              id={field}
                              type={field.includes('secret') || field.includes('key') ? 'password' : 'text'}
                              placeholder={`Enter ${field}`}
                              value={newGateway.config[field as keyof typeof newGateway.config] || ''}
                              onChange={(e) => setNewGateway(prev => ({
                                ...prev,
                                config: { ...prev.config, [field]: e.target.value }
                              }))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="gateway-active"
                          checked={newGateway.isActive}
                          onCheckedChange={(checked) => setNewGateway(prev => ({ ...prev, isActive: checked }))}
                        />
                        <Label htmlFor="gateway-active">Activate gateway immediately</Label>
                      </div>
                      
                      <Button 
                        onClick={() => createGatewayMutation.mutate(newGateway)}
                        disabled={!newGateway.name || createGatewayMutation.isPending}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {createGatewayMutation.isPending ? 'Adding...' : 'Add Gateway'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Settings */}
              <TabsContent value="settings">
                <Card className="border-0 shadow-sm">
                  <CardHeader>
                    <CardTitle>Payment Gateway Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold mb-3">Global Settings</h3>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Test Mode</h4>
                            <p className="text-sm text-gray-600">Enable test mode for all payment gateways</p>
                          </div>
                          <Switch />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Auto-capture Payments</h4>
                            <p className="text-sm text-gray-600">Automatically capture payments after authorization</p>
                          </div>
                          <Switch />
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h4 className="font-medium">Webhook Notifications</h4>
                            <p className="text-sm text-gray-600">Enable webhook notifications for payment events</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-semibold mb-3">Currency Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Default Currency</Label>
                          <Select defaultValue="inr">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="inr">Indian Rupee (₹)</SelectItem>
                              <SelectItem value="usd">US Dollar ($)</SelectItem>
                              <SelectItem value="eur">Euro (€)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Currency Display</Label>
                          <Select defaultValue="symbol">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="symbol">Symbol (₹)</SelectItem>
                              <SelectItem value="code">Code (INR)</SelectItem>
                              <SelectItem value="both">Both (₹ INR)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button>
                        <Save className="w-4 h-4 mr-2" />
                        Save Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  ));
}
