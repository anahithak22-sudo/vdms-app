import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/constants/routes';
import type { LoginInput } from '@/features/auth/validators/auth.schema';

/** Orchestrates the login form: submit, error surface, and post-login routing. */
export function useLogin() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(input: LoginInput) {
    setSubmitting(true);
    setFormError(null);
    try {
      const result = await login(input);
      if (!result.success || !result.data) {
        setFormError(result.message ?? null);
        return;
      }
      navigate(result.data.requiresPasswordChange ? ROUTES.CHANGE_PASSWORD : ROUTES.DASHBOARD, {
        replace: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return { submit, submitting, formError, clearError: () => setFormError(null) };
}
