import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { env } from '@/lib/env';
import { ru } from '@/locales/ru';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorId: string | null;
}

function makeErrorId(): string {
  return `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

/**
 * Catches render-time exceptions and shows a friendly message instead of a
 * blank screen. Technical details go to diagnostics only (never to the user).
 * In later phases this reports to the Error Log subsystem via the logging service.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, errorId: null };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true, errorId: makeErrorId() };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (env.isDevelopment) {
      // eslint-disable-next-line no-console
      console.error('[VDMS] Unhandled error', this.state.errorId, error, info.componentStack);
    }
    // Phase 6: forward to the centralized Error Log with the correlation id.
  }

  private readonly handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="h-7 w-7 text-destructive" aria-hidden />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{ru.states.errorTitle}</h1>
        <p className="max-w-md text-sm text-muted-foreground">{ru.states.errorBody}</p>
        {this.state.errorId && (
          <p className="text-xs text-muted-foreground">
            {ru.states.errorId}: <span className="font-mono">{this.state.errorId}</span>
          </p>
        )}
        <Button onClick={this.handleReload} variant="outline">
          {ru.states.reload}
        </Button>
      </div>
    );
  }
}
