'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Login successful! Redirecting...');
      router.push('/dashboard');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-4 lg:p-0 lg:min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 lg:mb-12">
            <div className="flex items-center gap-3 mb-8">
              <Image
                src="/logo.png"
                alt="UPHSM Logo"
                width={48}
                height={48}
                className="w-12 h-12"
              />
              <span className="text-xl font-bold text-foreground">UPHSM</span>
            </div>
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">Welcome Back</h1>
              <p className="text-base text-muted-foreground">Sign in to your leave management account</p>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-muted-foreground text-center">
            Don&apos;t have an account?{' '}
            <a href="#" className="text-primary hover:underline font-medium">
              Contact your administrator
            </a>
          </p>
        </div>
      </div>

      {/* Right Side - Gradient Background (Desktop Only) */}
      <div className="hidden lg:flex items-center justify-center min-h-screen bg-gradient-to-br from-primary via-primary/80 to-secondary/20 relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute inset-12 bg-white/5 rounded-full blur-2xl" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center text-white px-8">
          <div className="inline-block mb-6 p-4 bg-white/10 backdrop-blur-xl rounded-xl">
            <Image
              src="/logo.png"
              alt="UPHSM Logo"
              width={64}
              height={64}
              className="w-16 h-16 opacity-90"
            />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold mb-4">Leave Management System</h2>
          <p className="text-white/80 text-base lg:text-lg max-w-sm mx-auto">
            Streamline your leave requests and approvals with our modern management platform
          </p>
        </div>
      </div>
    </div>
  );
}
