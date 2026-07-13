import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '@/features/auth/services/auth.service';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import { ru } from '@/locales/ru';
import type { ChangePasswordInput } from '@/features/auth/validators/auth.schema';

/** Orchestrates the mandatory first-login password change. */
export function useChangePassword() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(input: ChangePasswordInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await authService.changePassword(input.currentPassword, input.newPassword);
      if (!result.success || !result.data) {
        setFormError(result.message ?? null);
        return;
      }
      setUser(result.data);
      toast.success(ru.auth.passwordChanged);
      navigate(ROUTES.DASHBOARD, { replace: true });
    } finally {
      setSubmitting(false);
    }
  }

  return { submit, submitting, formError };
}
