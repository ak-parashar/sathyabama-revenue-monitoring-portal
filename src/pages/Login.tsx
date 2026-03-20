import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) {
      toast({ title: 'Validation Error', description: 'Please select a Role before logging in.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast({ title: 'Login successful', description: 'Welcome to the Revenue Monitoring Portal' });
        navigate('/home');
      } else {
        toast({ title: 'Login failed', description: 'Invalid email or password', variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Network Error', description: error?.message || 'Could not reach the server. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Full screen background */}
      <div 
        className="absolute inset-0 z-[-2] bg-cover bg-center transition-all duration-700"
        style={{ backgroundImage: "url('/sathyabama-bg.jpg')" }}
      />
      <div className="absolute inset-0 z-[-1] bg-black/20" />

      <main className="flex-1 flex items-center justify-center p-6 relative z-10">
        <Card className="w-full max-w-[500px] shadow-2xl border-white/20 bg-black/40 relative z-10">
          <CardHeader className="text-center pb-2 pt-6">
            <div className="flex items-center justify-center mx-auto mb-4 w-full px-4">
              <img src="/sathyabama-logo.png" alt="Sathyabama Logo" className="max-h-24 object-contain brightness-105" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">Revenue Monitoring Portal</h2>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role" className="font-bold text-sm text-white">Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="h-11 bg-black/20 text-white border-white/20 font-semibold focus:ring-white/50">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="superadmin">Dean</SelectItem>
                    <SelectItem value="admin">HOD</SelectItem>
                    <SelectItem value="pi">PI</SelectItem>
                    <SelectItem value="co_pi">Co-PI</SelectItem>
                    <SelectItem value="jrf">JRF</SelectItem>
                    <SelectItem value="assistant">Assistant</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold text-sm text-white">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" value={email}
                  onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-black/20 text-white border-white/20 font-semibold focus-visible:ring-white/50 placeholder:text-white/60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="font-bold text-sm text-white">Password</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)} required className="h-11 pr-10 bg-black/20 text-white border-white/20 font-semibold tracking-wide focus-visible:ring-white/50 placeholder:text-white/60" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary hover:shadow-lg transition-all active:scale-[0.98]" disabled={isLoading}>
                {isLoading ? 'Signing in...' : (<><LogIn className="mr-2 h-5 w-5" />Sign In</>)}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      <footer className="bg-transparent py-4 text-center relative z-10 w-full">
        <p className="text-sm text-white drop-shadow-md font-medium tracking-wide">
          &copy; 2026 Sathyabama Revenue Monitoring Portal
        </p>
      </footer>
    </div>
  );
};

export default Login;
