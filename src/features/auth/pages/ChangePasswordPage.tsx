import { AuthLayout } from '@/layouts/AuthLayout';
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm';
import { ru } from '@/locales/ru';

export default function ChangePasswordPage() {
  return (
    <AuthLayout title={ru.auth.changePasswordTitle} subtitle={ru.auth.changePasswordSubtitle}>
      <ChangePasswordForm />
    </AuthLayout>
  );
}
