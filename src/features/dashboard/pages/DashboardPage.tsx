import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Map as MapIcon, Bug, AlertTriangle, CheckCircle2, ArrowRight, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader, StatusBadge } from '@/components/common/DisplayPrimitives';
import { rdevService } from '@/features/rdev/service';
import { totalPercent, statusPercent, isOverdue } from '@/features/rdev/progress';
import { bugStatsService } from '@/features/bugstats/service';
import { useAssignableUsers, userNameOf } from '@/hooks/useDirectory';
import { formatDate } from '@/lib/format';
import { ROUTES } from '@/constants/routes';
import { ru } from '@/locales/ru';

function KpiCard({ label, value, to, icon: Icon, accent }: {
  label: string; value: number | string; to: string; icon: typeof MapIcon; accent?: string;
}) {
  return (
    <Link to={to} className="group">
      <Card className="transition-colors group-hover:border-primary/40">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold" style={accent ? { color: accent } : undefined}>{value}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { data: tasks } = useQuery({ queryKey: ['rdev', 'tasks', 'dash'], queryFn: async () => (await rdevService.listTasks()).data ?? [], staleTime: 60_000 });
  const { data: statuses } = useQuery({ queryKey: ['rdev', 'statuses', 'dash'], queryFn: async () => (await rdevService.listStatuses()).data ?? [], staleTime: 60_000 });
  const { data: bugs } = useQuery({ queryKey: ['bugstats', 'dash'], queryFn: async () => (await bugStatsService.list()).data ?? [], staleTime: 60_000 });
  const { data: users } = useAssignableUsers();

  const taskList = useMemo(() => tasks ?? [], [tasks]);
  const statusList = useMemo(() => statuses ?? [], [statuses]);

  const statusById = useMemo(() => new Map(statusList.map((s) => [s.id, s])), [statusList]);
  const overdue = useMemo(
    () => taskList.filter((t) => isOverdue(t, statusById.get(t.status_id))),
    [taskList, statusById],
  );
  const readiness = useMemo(() => totalPercent(taskList, statusList), [taskList, statusList]);

  const perColumn = useMemo(() => statusList.map((s) => ({
    status: s,
    count: taskList.filter((t) => t.status_id === s.id).length,
    pct: statusPercent(s, statusList),
  })), [statusList, taskList]);

  const bugTrend = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    return (bugs ?? [])
      .filter((b) => new Date(b.stat_date) >= cutoff)
      .map((b) => ({ date: formatDate(b.stat_date), [ru.bugstats.opened]: b.opened, [ru.bugstats.closed]: b.closed }));
  }, [bugs]);

  const openBugs = useMemo(() => {
    const o = (bugs ?? []).reduce((a, b) => a + b.opened, 0);
    const c = (bugs ?? []).reduce((a, b) => a + b.closed, 0);
    return Math.max(0, o - c);
  }, [bugs]);

  return (
    <div className="space-y-5">
      <PageHeader title={ru.nav.dashboard} description={ru.dashboard.subtitle} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <KpiCard label={ru.dashboard.overdueTasks} value={overdue.length} to={ROUTES.ROADMAP} icon={AlertTriangle} accent={overdue.length ? 'hsl(var(--destructive))' : undefined} />
        <KpiCard label={ru.dashboard.readiness} value={`${readiness}%`} to={ROUTES.ROADMAP} icon={CheckCircle2} accent="hsl(var(--success))" />
        <KpiCard label={ru.dashboard.openBugs} value={openBugs} to={ROUTES.BUG_STATISTICS} icon={Bug} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Feature readiness */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{ru.dashboard.readiness}</CardTitle></CardHeader>
          <CardContent>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{ru.rdev.totalProgress}</span>
              <span className="text-sm font-semibold text-foreground">{readiness}%</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${readiness}%` }} />
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {perColumn.map(({ status, count }) => (
                <span key={status.id} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: status.color }} />
                  {status.name}: <span className="font-medium text-foreground">{count}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bug dynamics (30 days) */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">{ru.dashboard.bugDynamics}</CardTitle></CardHeader>
          <CardContent>
            {bugTrend.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">{ru.bugstats.empty}</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={bugTrend} margin={{ left: -12, right: 8, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey={ru.bugstats.opened} stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey={ru.bugstats.closed} stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue task list */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">{ru.dashboard.overdueTasks}</CardTitle>
          <Link to={ROUTES.ROADMAP} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
            {ru.rdev.title} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent>
          {overdue.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{ru.dashboard.noOverdue}</p>
          ) : (
            <ul className="divide-y divide-border">
              {overdue.slice(0, 8).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{t.title}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{userNameOf(users, t.assignee_id)}</span>
                      {t.end_date && <span>· {formatDate(t.end_date)}</span>}
                    </p>
                  </div>
                  <StatusBadge label={statusById.get(t.status_id)?.name ?? ''} tone="danger" />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
