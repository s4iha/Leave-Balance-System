'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showErrorToast } from '@/lib/sonner-toast';
import Image from 'next/image';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      showErrorToast(err, 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex items-center justify-center p-4 lg:p-0 min-h-screen">
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
              <p className="text-base text-muted-foreground">Sign in to your faculty leave management account</p>
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
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <a href="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
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
        <Image
          src="/img-half.png"
          alt="UPHSM building"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          quality={70}
          className="object-cover"
        />
      </div>
    </div>
  );
}
