import { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { login, logout } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const u = await login(formData.email, formData.password);
      if (u.role === 'admin') {
        toast({ title: 'Welcome, Admin', description: 'Signed in successfully.' });
        setLocation('/admin/dashboard');
      } else {
        await logout();
        toast({ title: 'Access denied', description: 'Admin access required.', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Login failed', description: error.message || 'Invalid credentials', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <i className="fas fa-bolt text-white text-lg"></i>
            </div>
            <span className="text-primary text-xl font-bold" data-testid="text-admin-login-logo">Posttrr</span>
          </div>
          <CardTitle className="text-2xl" data-testid="text-admin-login-title">Admin Sign In</CardTitle>
          <CardDescription data-testid="text-admin-login-description">Restricted access for administrators only</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="form-admin-login">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="admin@email.com" value={formData.email} onChange={handleInputChange} required data-testid="input-admin-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder="Enter your password" value={formData.password} onChange={handleInputChange} required data-testid="input-admin-password" />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-admin-login">
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              <Link href="/login" data-testid="link-user-login">Go to user login</Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
