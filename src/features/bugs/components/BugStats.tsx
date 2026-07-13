import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { bugStatus } from '@/features/bugs/status';
import { SEVERITY_LABELS } from '@/constants/options';
import type { Tables, BugSeverity } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

type Bug = Tables<'bugs'>;

const SEVERITY_COLORS: Record<BugSeverity, string> = {
  critical: '#DC2626',
  major: '#D97706',
  minor: '#2563EB',
  trivial: '#6B7280',
};

function StatCard({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold" style={accent ? { color: accent } : undefined}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

/** Aggregated defect analytics for Artifact 03. */
export function BugStats({ bugs }: { bugs: Bug[] }) {
  const stats = useMemo(() => {
    const total = bugs.length;
    const closed = bugs.filter((b) => b.status === 'closed' || b.status === 'archived').length;
    const critical = bugs.filter((b) => b.severity === 'critical').length;
    const open = total - closed;

    const bySeverity = (['critical', 'major', 'minor', 'trivial'] as BugSeverity[]).map((s) => ({
      name: SEVERITY_LABELS[s],
      value: bugs.filter((b) => b.severity === s).length,
      color: SEVERITY_COLORS[s],
    }));

    const byStatus = bugStatus.order.map((s) => ({
      name: bugStatus.labels[s],
      value: bugs.filter((b) => b.status === s).length,
      color: '#2563EB',
    }));

    return { total, closed, open, critical, bySeverity, byStatus };
  }, [bugs]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={ru.bugs.totalBugs} value={stats.total} />
        <StatCard label={ru.bugs.openBugs} value={stats.open} accent="#D97706" />
        <StatCard label={ru.bugs.closedBugs} value={stats.closed} accent="#16A34A" />
        <StatCard label={ru.bugs.criticalBugs} value={stats.critical} accent="#DC2626" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{ru.bugs.bySeverity}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.bySeverity}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} width={28} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {stats.bySeverity.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{ru.bugs.byStatus}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={stats.byStatus} layout="vertical" margin={{ left: 24 }}>
                <XAxis type="number" allowDecimals={false} fontSize={12} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" fontSize={11} tickLine={false} axisLine={false} width={140} />
                <Tooltip cursor={{ fill: 'hsl(var(--muted))' }} />
                <Bar dataKey="value" fill="#2563EB" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
