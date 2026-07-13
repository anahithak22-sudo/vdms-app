import { Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { APP } from '@/constants/app';
import { ru } from '@/locales/ru';

interface SessionTimeoutDialogProps {
  open: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onSignOut: () => void;
}

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Warns the user before automatic logout and offers to extend the session (D-06). */
export function SessionTimeoutDialog({
  open,
  secondsRemaining,
  onExtend,
  onSignOut,
}: SessionTimeoutDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent hideClose className="max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-warning/10">
            <Clock className="h-5 w-5 text-warning" aria-hidden />
          </div>
          <DialogTitle>{ru.session.warningTitle}</DialogTitle>
          <DialogDescription>
            {ru.session.warningBody(APP.sessionWarningMinutes)}
          </DialogDescription>
        </DialogHeader>

        <div
          className="rounded-md bg-muted py-4 text-center"
          role="timer"
          aria-live="polite"
          aria-label={ru.session.warningTitle}
        >
          <span className="font-mono text-3xl font-semibold tabular-nums text-foreground">
            {formatClock(secondsRemaining)}
          </span>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onSignOut}>
            {ru.session.signOutNow}
          </Button>
          <Button onClick={onExtend}>{ru.session.staySignedIn}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
