import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Dependency-free select built on the native element, styled to match the
 * design system. Keyboard, screen-reader, and mobile behavior come for free.
 */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, value, onValueChange, options, placeholder, ...props }, ref) => (
    <div className="relative">
      <select
        ref={ref}
        value={value ?? ''}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(
          'flex h-10 w-full appearance-none rounded-lg border border-input bg-card px-3 pr-9 text-sm shadow-soft transition-all hover:border-border',
          'focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
          'disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive',
          !value && 'text-muted-foreground',
          className,
        )}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="text-foreground">
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  ),
);
Select.displayName = 'Select';

export { Select };
