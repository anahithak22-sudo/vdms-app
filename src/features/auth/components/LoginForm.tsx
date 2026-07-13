import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { loginSchema, type LoginInput } from '@/features/auth/validators/auth.schema';
import { useLogin } from '@/features/auth/hooks/useLogin';
import { ru } from '@/locales/ru';

export function LoginForm() {
  const { submit, submitting, formError, clearError } = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
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

      <FormField name="username" error={errors.username?.message}>
        <FormLabel>{ru.auth.username}</FormLabel>
        <FormControl>
          <Input
            autoFocus
            autoComplete="username"
            placeholder={ru.auth.usernamePlaceholder}
            {...register('username', { onChange: clearError })}
          />
        </FormControl>
        <FormMessage />
      </FormField>

      <FormField name="password" error={errors.password?.message}>
        <FormLabel>{ru.auth.password}</FormLabel>
        <FormControl>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder={ru.auth.passwordPlaceholder}
              className="pr-10"
              {...register('password', { onChange: clearError })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
              aria-label={showPassword ? ru.auth.hidePassword : ru.auth.showPassword}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </FormControl>
        <FormMessage />
      </FormField>

      <Button type="submit" className="w-full" size="lg" loading={submitting}>
        {submitting ? ru.auth.signingIn : ru.auth.signIn}
      </Button>
    </form>
  );
}
