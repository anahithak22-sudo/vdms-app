import * as React from 'react';
import type { FieldValues, FieldPath } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

/**
 * Lightweight form field primitives tuned for react-hook-form.
 * These favor explicit wiring over context magic to keep the flow readable.
 */

interface FormFieldContextValue {
  id: string;
  name: string;
  error?: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

function useFormField(): FormFieldContextValue {
  const ctx = React.useContext(FormFieldContext);
  if (!ctx) throw new Error('useFormField must be used within <FormField>');
  return ctx;
}

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
  error?: string;
  children: React.ReactNode;
  className?: string;
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ name, error, children, className }: FormFieldProps<TFieldValues, TName>) {
  const id = React.useId();
  return (
    <FormFieldContext.Provider value={{ id, name, error }}>
      <div className={cn('space-y-2', className)}>{children}</div>
    </FormFieldContext.Provider>
  );
}

function FormLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  const { id, error } = useFormField();
  return (
    <Label htmlFor={id} className={cn(error && 'text-destructive', className)}>
      {children}
    </Label>
  );
}

function FormControl({ children }: { children: React.ReactElement }) {
  const { id, error } = useFormField();
  return React.cloneElement(children, {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  } as Partial<React.HTMLAttributes<HTMLElement>>);
}

function FormMessage() {
  const { id, error } = useFormField();
  if (!error) return null;
  return (
    <p id={`${id}-error`} className="text-sm font-medium text-destructive" role="alert">
      {error}
    </p>
  );
}

export { FormField, FormLabel, FormControl, FormMessage, useFormField };
