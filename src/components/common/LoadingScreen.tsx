import { Loader2 } from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ru } from '@/locales/ru';

/** Full-screen loading state shown while the session is being restored. */
export function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background">
      <Logo />
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {ru.common.loading}
      </div>
    </div>
  );
}
