import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ru } from '@/locales/ru';

interface PagePlaceholderProps {
  title: string;
  icon: LucideIcon;
}

/**
 * Temporary landing for modules delivered in later phases. Keeps navigation,
 * layout, and permissions verifiable now without shipping fake business data.
 */
export function PagePlaceholder({ title, icon: Icon }: PagePlaceholderProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <Badge variant="secondary">{ru.states.comingSoon}</Badge>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent">
            <Icon className="h-6 w-6 text-primary" aria-hidden />
          </div>
          <p className="max-w-sm text-sm text-muted-foreground">{ru.states.comingSoon}</p>
        </CardContent>
      </Card>
    </div>
  );
}
