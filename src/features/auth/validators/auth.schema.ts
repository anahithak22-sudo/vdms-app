import { z } from 'zod';
import { APP } from '@/constants/app';
import { ru } from '@/locales/ru';

const v = ru.validation;

/** Password complexity per frozen Security Principles (≥12, upper/lower/number/special). */
export const passwordSchema = z
  .string()
  .min(APP.minPasswordLength, v.passwordMin(APP.minPasswordLength))
  .regex(/[A-ZА-ЯЁ]/, v.passwordUppercase)
  .regex(/[a-zа-яё]/, v.passwordLowercase)
  .regex(/\d/, v.passwordNumber)
  .regex(/[^A-Za-zА-Яа-яЁё0-9]/, v.passwordSpecial);

export const loginSchema = z.object({
  username: z.string().trim().min(1, v.usernameRequired),
  password: z.string().min(1, v.passwordRequired),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, v.passwordRequired),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, v.passwordRequired),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ['confirmPassword'],
    message: v.passwordsMismatch,
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ['newPassword'],
    message: v.passwordSameAsOld,
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
