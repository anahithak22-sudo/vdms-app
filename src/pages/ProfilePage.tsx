import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { getInitials } from '@/lib/utils';
import { PreferencesCard } from '@/features/settings/components/PreferencesCard';
import { ru } from '@/locales/ru';

/** Profile summary plus per-user interface preferences (D-16). */
export default function ProfilePage() {
  const { user } = useAuth();
  if (!user) return null;

  const rows: [string, string][] = [
    ['Имя пользователя', user.username],
    ['Отображаемое имя', user.displayName],
    ['Роль', ru.roles[user.role]],
    ['Подразделение', user.department ?? '—'],
    ['Идентификатор', user.businessId],
  ];

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{ru.nav.profile}</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 text-base">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
              <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{user.displayName}</CardTitle>
              <p className="mt-0.5 text-sm text-muted-foreground">{ru.roles[user.role]}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border">
            {rows.map(([label, value]) => (
              <div key={label} className="flex items-center justify-between py-3">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
          <Separator className="my-2" />
        </CardContent>
      </Card>

      <PreferencesCard />
    </div>
  );
}
