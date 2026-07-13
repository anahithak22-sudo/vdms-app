import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showWordmark?: boolean;
}

/** VDMS mark: a blue rounded tile with a stylized "V" plus optional wordmark. */
export function Logo({ className, showWordmark = true }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8 shrink-0"
        role="img"
        aria-label="VDMS"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="32" height="32" rx="7" className="fill-primary" />
        <path d="M9 9h4l3 9 3-9h4l-5 14h-4L9 9z" className="fill-primary-foreground" />
      </svg>
      {showWordmark && (
        <span className="text-lg font-bold tracking-tight text-foreground">VDMS</span>
      )}
    </div>
  );
}
