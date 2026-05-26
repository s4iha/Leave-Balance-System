'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast, showErrorToast } from '@/lib/sonner-toast';
import Image from 'next/image';
import { ArrowLeft, Loader2, ShieldCheck, Mail, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordValidator } from '@/components/auth/password-validator';

type Step = 'request' | 'verify' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const getApiErrorMessage = (data: any, fallback: string) => {
    if (typeof data?.error === 'string') return data.error;
    if (typeof data?.message === 'string') return data.message;
    if (data?.error?.message) return data.error.message;
    return fallback;
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(getApiErrorMessage(data, 'Failed to request OTP'));
      }

      toast({ title: 'OTP sent to your email' });
      setStep('verify');
    } catch (err: any) {
      showErrorToast(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getApiErrorMessage(data, 'Verification failed'));

      toast({ title: 'OTP verified' });
      setStep('reset');
    } catch (err: any) {
      showErrorToast(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) {
      showErrorToast('Password does not meet the requirements.', 'Validation Error');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/forgot-password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(getApiErrorMessage(data, 'Reset failed'));

      toast({ title: 'Password reset successfully' });
      setStep('success');
    } catch (err: any) {
      showErrorToast(err);
    } finally {
      setIsLoading(false);
    }
  };

  const isPasswordValid =
    newPassword.length >= 8 &&
    /[a-z]/.test(newPassword) &&
    /[A-Z]/.test(newPassword) &&
    /[0-9]/.test(newPassword) &&
    /[^A-Za-z0-9]/.test(newPassword) &&
    newPassword === confirmPassword;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
          <Link href="/login" className="self-start flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>

          <div className="bg-primary/10 p-3 rounded-2xl mb-2">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight">
            {step === 'request' && 'Forgot Password?'}
            {step === 'verify' && 'Check your email'}
            {step === 'reset' && 'Set new password'}
            {step === 'success' && 'All set!'}
          </h1>
          <p className="text-muted-foreground">
            {step === 'request' && "No worries, we'll send you reset instructions."}
            {step === 'verify' && `We've sent a 6-digit code to ${email}`}
            {step === 'reset' && 'Your new password must meet all requirements.'}
            {step === 'success' && 'Your password has been reset successfully.'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          {step === 'request' && (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Send OTP
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-center block">Enter 6-digit code</label>
                <Input
                  type="text"
                  placeholder="000000"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[1em] font-bold"
                  required
                />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Code expires in 5 minutes.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Verify Code
              </Button>
              <button
                type="button"
                onClick={handleRequestOTP}
                disabled={isLoading}
                className="w-full text-sm text-primary hover:underline"
              >
                Resend code
              </button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">New Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <PasswordInput
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10"
                    showPassword={showPassword}
                    onShowPasswordChange={setShowPassword}
                    required
                  />
                </div>
                <PasswordValidator password={newPassword} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Confirm Password</label>
                <PasswordInput
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  showPassword={showPassword}
                  onShowPasswordChange={setShowPassword}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading || !isPasswordValid}>
                {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reset Password
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-6 py-4">
              <div className="flex justify-center">
                <div className="bg-green-500/10 p-4 rounded-full">
                  <ShieldCheck className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <Button onClick={() => router.push('/login')} className="w-full">
                Return to login
              </Button>
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Remembered your password?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
