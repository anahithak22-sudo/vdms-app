import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import {
  changePasswordSchema,
  type ChangePasswordInput,
} from '@/features/auth/validators/auth.schema';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import { APP } from '@/constants/app';
import { ru } from '@/locales/ru';

const requirements = [
  `Не менее ${APP.minPasswordLength} символов`,
  'Заглавные и строчные буквы',
  'Хотя бы одна цифра',
  'Хотя бы один специальный символ',
];

export function ChangePasswordForm() {
  const { submit, submitting, formError } = useChangePassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-5" noValidate>
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{formError}</span>
        </div>
      )}

      <FormField name="currentPassword" error={errors.currentPassword?.message}>
        <FormLabel>{ru.auth.currentPassword}</FormLabel>
        <FormControl>
          <PasswordInput autoComplete="current-password" {...register('currentPassword')} />
        </FormControl>
        <FormMessage />
      </FormField>

      <FormField name="newPassword" error={errors.newPassword?.message}>
        <FormLabel>{ru.auth.newPassword}</FormLabel>
        <FormControl>
          <PasswordInput autoComplete="new-password" {...register('newPassword')} />
        </FormControl>
        <FormMessage />
      </FormField>

      <FormField name="confirmPassword" error={errors.confirmPassword?.message}>
        <FormLabel>{ru.auth.confirmPassword}</FormLabel>
        <FormControl>
          <PasswordInput autoComplete="new-password" {...register('confirmPassword')} />
        </FormControl>
        <FormMessage />
      </FormField>

      <ul className="space-y-1 rounded-md bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
        {requirements.map((req) => (
          <li key={req} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
            {req}
          </li>
        ))}
      </ul>

      <Button type="submit" className="w-full" size="lg" loading={submitting}>
        {submitting ? ru.auth.changingPassword : ru.auth.changePassword}
      </Button>
    </form>
  );
}
