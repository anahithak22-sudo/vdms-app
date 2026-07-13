import { useEffect } from 'react';
import { toast } from 'sonner';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuth } from '@/hooks/useAuth';
import { ru } from '@/locales/ru';

export default function LoginPage() {
  const { expiredNotice, clearExpiredNotice } = useAuth();

  useEffect(() => {
    if (expiredNotice) {
      toast.info(ru.auth.sessionExpired);
      clearExpiredNotice();
    }
  }, [expiredNotice, clearExpiredNotice]);

  return (
    <AuthLayout title={ru.auth.loginTitle} subtitle={ru.auth.loginSubtitle}>
      <LoginForm />
    </AuthLayout>
  );
}
