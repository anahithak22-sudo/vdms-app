import { useMemo } from 'react';
import { Activity, AlertTriangle, ShieldAlert, Timer, TriangleAlert, CheckCircle2 } from 'lucide-react';
import { PageHeader, StatusBadge, type Tone } from '@/components/common/DisplayPrimitives';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSystemLogs, useAuditLog } from '@/hooks/useAuditLog';
import { LOG_CATEGORY_LABELS, LOG_SEVERITY_LABELS } from '@/constants/enums';
import { formatDateTime } from '@/lib/format';
import type { Tables, LogSeverity, LogCategory } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

type SysLog = Tables<'system_logs'>;

const ERROR_TIER: LogSeverity[] = ['error', 'critical', 'fatal'];
const SEVERITY_TONE: Record<LogSeverity, Tone> = {
  information: 'info', warning: 'warning', error: 'danger', critical: 'danger', fatal: 'danger',
};

function KpiCard({
  icon: Icon, label, value, tone = 'neutral',
}: {
  icon: typeof Activity;
  label: string;
  value: string | number;
  tone?: Tone;
}) {
  const toneClass: Record<Tone, string> = {
    neutral: 'text-muted-foreground',
    info: 'text-primary',
    success: 'text-emerald-600',
    warning: 'text-amber-600',
    danger: 'text-destructive',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent">
          <Icon className={`h-5 w-5 ${toneClass[tone]}`} aria-hidden />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MonitoringPage() {
  // A recent window of operational logs is enough for a health snapshot.
  const { data: logsPage, isLoading } = useSystemLogs({ page: 1, pageSize: 200 });
  const { data: auditPage } = useAuditLog({
    page: 1,
    pageSize: 200,
    filters: [{ field: 'category', operator: 'eq', value: 'security' }],
  });

  const logs = useMemo(() => logsPage?.items ?? [], [logsPage]);

  const stats = useMemo(() => {
    const bySeverity = new Map<LogSeverity, number>();
    const byCategory = new Map<LogCategory, number>();
    let perfSum = 0;
    let perfCount = 0;
    for (const l of logs) {
      bySeverity.set(l.severity, (bySeverity.get(l.severity) ?? 0) + 1);
      byCategory.set(l.category, (byCategory.get(l.category) ?? 0) + 1);
      if (l.category === 'performance' && typeof l.duration_ms === 'number') {
        perfSum += l.duration_ms;
        perfCount += 1;
      }
    }
    const errors = ERROR_TIER.reduce((sum, s) => sum + (bySeverity.get(s) ?? 0), 0);
    const critical = (bySeverity.get('critical') ?? 0) + (bySeverity.get('fatal') ?? 0);
    const warnings = bySeverity.get('warning') ?? 0;
    return {
      total: logs.length,
      errors,
      critical,
      warnings,
      avgDuration: perfCount ? Math.round(perfSum / perfCount) : 0,
      byCategory: Array.from(byCategory.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [logs]);

  const recentErrors = useMemo(
    () => logs.filter((l) => ERROR_TIER.includes(l.severity)).slice(0, 12),
    [logs],
  );

  const securityCount = auditPage?.totalItems ?? 0;
  const healthy = !isLoading && stats.errors === 0;

  return (
    <div className="space-y-6">
      <PageHeader title={ru.monitoring.title} description={ru.monitoring.subtitle} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={Activity} label={ru.monitoring.totalEvents} value={stats.total} tone="info" />
        <KpiCard icon={AlertTriangle} label={ru.monitoring.errors} value={stats.errors} tone={stats.errors ? 'danger' : 'success'} />
        <KpiCard icon={TriangleAlert} label={ru.monitoring.critical} value={stats.critical} tone={stats.critical ? 'danger' : 'neutral'} />
        <KpiCard icon={ShieldAlert} label={ru.monitoring.security} value={securityCount} tone={securityCount ? 'warning' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard icon={TriangleAlert} label={ru.monitoring.warnings} value={stats.warnings} tone={stats.warnings ? 'warning' : 'neutral'} />
        <KpiCard icon={Timer} label={ru.monitoring.avgDuration} value={stats.avgDuration} tone="info" />
        <KpiCard
          icon={CheckCircle2}
          label={ru.monitoring.performance}
          value={stats.byCategory.find(([c]) => c === 'performance')?.[1] ?? 0}
          tone="neutral"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{ru.monitoring.recentErrors}</CardTitle>
          </CardHeader>
          <CardContent>
            {healthy ? (
              <div className="flex items-center gap-2 py-6 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {ru.monitoring.healthy}
              </div>
            ) : recentErrors.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">{ru.monitoring.empty}</p>
            ) : (
              <ul className="divide-y divide-border">
                {recentErrors.map((l: SysLog) => (
                  <li key={l.id} className="flex items-start justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">{l.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.module ?? '—'} · {formatDateTime(l.created_at)}
                      </p>
                    </div>
                    <StatusBadge label={LOG_SEVERITY_LABELS[l.severity]} tone={SEVERITY_TONE[l.severity]} />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{ru.monitoring.byCategory}</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byCategory.length === 0 ? (
              <p className="py-6 text-sm text-muted-foreground">{ru.monitoring.empty}</p>
            ) : (
              <ul className="space-y-2">
                {stats.byCategory.map(([cat, count]) => (
                  <li key={cat} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{LOG_CATEGORY_LABELS[cat]}</span>
                    <span className="font-medium text-foreground">{count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
