'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { showErrorToast } from '@/lib/sonner-toast';
import { AlertCircle } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: { action: string; resource: string }[];
}

export function ProtectedRoute({ children, requiredPermissions }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const isSuperuser = user?.role === 'System Admin';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const hasAccess = isSuperuser || !requiredPermissions || requiredPermissions.length === 0 ||
      requiredPermissions.every(rp =>
        user?.permissions?.some(up => up.action === rp.action && up.resource === rp.resource)
      );

    if (!hasAccess) {
      showErrorToast('You do not have permission to access this page.', 'Access Denied');
      router.push('/unauthorized');
    }
  }, [isAuthenticated, isLoading, isSuperuser, user, requiredPermissions, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const hasPermissions = isSuperuser || !requiredPermissions ? true : requiredPermissions.every(rp =>
    user?.permissions?.some(up => up.action === rp.action && up.resource === rp.resource)
  );

  if (!hasPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-destructive/20">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-foreground mb-2">Access Denied</h2>
                <p className="text-sm text-muted-foreground">
                  You do not have permission to access this page.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
