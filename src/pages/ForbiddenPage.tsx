import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { ru } from '@/locales/ru';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
        <ShieldAlert className="h-7 w-7 text-destructive" aria-hidden />
      </div>
      <p className="text-sm font-medium text-muted-foreground">403</p>
      <h1 className="text-2xl font-semibold text-foreground">{ru.states.forbiddenTitle}</h1>
      <p className="max-w-md text-sm text-muted-foreground">{ru.states.forbiddenBody}</p>
      <Button asChild variant="outline">
        <Link to={ROUTES.DASHBOARD}>{ru.states.goToDashboard}</Link>
      </Button>
    </div>
  );
}
