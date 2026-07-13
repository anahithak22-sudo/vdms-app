import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, type Tone } from '@/components/common/DisplayPrimitives';
import { nextStatuses, statusLabel, statusTone, type StatusConfig } from '@/lib/status';
import { PRIORITY_LABELS } from '@/constants/enums';
import type { PriorityLevel } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

const PRIORITY_TONE: Record<PriorityLevel, Tone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
};

export function PriorityBadge({ priority }: { priority: PriorityLevel }) {
  return <StatusBadge label={PRIORITY_LABELS[priority]} tone={PRIORITY_TONE[priority]} />;
}

/**
 * Status pill with an optional transition menu. When `canChange` and there are
 * valid next statuses, clicking opens a menu of allowed transitions; otherwise
 * it renders a static badge. Transition rules come from the artifact's config.
 */
export function StatusControl<S extends string>({
  config,
  status,
  canChange = false,
  disabled = false,
  onChange,
}: {
  config: StatusConfig<S>;
  status: S;
  canChange?: boolean;
  disabled?: boolean;
  onChange?: (next: S) => void;
}) {
  const options = nextStatuses(config, status);

  if (!canChange || options.length === 0 || !onChange) {
    return <StatusBadge label={statusLabel(config, status)} tone={statusTone(config, status)} />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1 px-2" disabled={disabled}>
          <StatusBadge label={statusLabel(config, status)} tone={statusTone(config, status)} />
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>{ru.common.changeStatus}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((next) => (
          <DropdownMenuItem key={next} onSelect={() => onChange(next)}>
            {statusLabel(config, next)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
