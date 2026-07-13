import { Settings } from 'lucide-react';
import { PageHeader, StatusBadge } from '@/components/common/DisplayPrimitives';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DataTable, type Column } from '@/components/data/DataTable';
import {
  useReleases, useSprints, useBusinessAreas, useDepartments, useProjects, usePriorities,
} from '@/hooks/useReferenceData';
import { formatDate } from '@/lib/format';
import type { Tables } from '@/lib/supabase/types';
import { ru } from '@/locales/ru';

function activeBadge(isActive: boolean) {
  return (
    <StatusBadge
      label={isActive ? ru.settings.active : ru.settings.inactive}
      tone={isActive ? 'success' : 'neutral'}
    />
  );
}

type Lookup = Tables<'business_areas'>;

function LookupTable({
  rows, loading,
}: {
  rows: Lookup[];
  loading: boolean;
}) {
  const columns: Column<Lookup>[] = [
    { key: 'key', header: ru.settings.code, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.key}</span> },
    { key: 'name', header: ru.settings.name, cell: (r) => <span className="text-sm">{r.name}</span> },
    { key: 'status', header: ru.settings.status, cell: (r) => activeBadge(r.is_active) },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={loading}
      emptyIcon={Settings} emptyTitle={ru.settings.empty} />
  );
}

function ReleasesTab() {
  const { data, isLoading } = useReleases();
  const rows = data ?? [];
  const columns: Column<Tables<'releases'>>[] = [
    { key: 'business_id', header: ru.settings.code, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.business_id}</span> },
    { key: 'name', header: ru.settings.name, cell: (r) => <span className="text-sm">{r.name}</span> },
    { key: 'version', header: ru.settings.version, cell: (r) => <span className="text-sm">{r.release_version ?? '—'}</span> },
    { key: 'target', header: ru.settings.targetDate, cell: (r) => <span className="text-sm text-muted-foreground">{r.target_date ? formatDate(r.target_date) : '—'}</span> },
    { key: 'status', header: ru.settings.status, cell: (r) => <span className="text-sm">{r.status}</span> },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={isLoading}
      emptyIcon={Settings} emptyTitle={ru.settings.empty} />
  );
}

function SprintsTab() {
  const { data, isLoading } = useSprints();
  const rows = data ?? [];
  const columns: Column<Tables<'sprints'>>[] = [
    { key: 'business_id', header: ru.settings.code, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.business_id}</span> },
    { key: 'name', header: ru.settings.name, cell: (r) => <span className="text-sm">{r.name}</span> },
    { key: 'start', header: ru.common.startDate, cell: (r) => <span className="text-sm text-muted-foreground">{r.start_date ? formatDate(r.start_date) : '—'}</span> },
    { key: 'end', header: ru.common.dueDate, cell: (r) => <span className="text-sm text-muted-foreground">{r.end_date ? formatDate(r.end_date) : '—'}</span> },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={isLoading}
      emptyIcon={Settings} emptyTitle={ru.settings.empty} />
  );
}

function BusinessAreasTab() {
  const { data, isLoading } = useBusinessAreas();
  return <LookupTable rows={data ?? []} loading={isLoading} />;
}
function DepartmentsTab() {
  const { data, isLoading } = useDepartments();
  return <LookupTable rows={(data ?? []) as Lookup[]} loading={isLoading} />;
}
function ProjectsTab() {
  const { data, isLoading } = useProjects();
  return <LookupTable rows={(data ?? []) as Lookup[]} loading={isLoading} />;
}

function PrioritiesTab() {
  const { data, isLoading } = usePriorities();
  const rows = data ?? [];
  const columns: Column<Tables<'priority_definitions'>>[] = [
    { key: 'key', header: ru.settings.code, cell: (r) => <span className="font-mono text-xs text-muted-foreground">{r.key}</span> },
    { key: 'name', header: ru.settings.name, cell: (r) => <span className="text-sm">{r.name}</span> },
    {
      key: 'color', header: 'Цвет',
      cell: (r) => (
        <span className="inline-flex items-center gap-2 text-sm">
          <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: r.color }} />
          {r.color}
        </span>
      ),
    },
    { key: 'status', header: ru.settings.status, cell: (r) => activeBadge(r.is_active) },
  ];
  return (
    <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} loading={isLoading}
      emptyIcon={Settings} emptyTitle={ru.settings.empty} />
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title={ru.settings.title} description={ru.settings.subtitle} />
      <p className="text-sm text-muted-foreground">{ru.settings.referenceNote}</p>
      <Tabs defaultValue="releases">
        <TabsList>
          <TabsTrigger value="releases">{ru.settings.releases}</TabsTrigger>
          <TabsTrigger value="sprints">{ru.settings.sprints}</TabsTrigger>
          <TabsTrigger value="areas">{ru.settings.businessAreas}</TabsTrigger>
          <TabsTrigger value="departments">{ru.settings.departments}</TabsTrigger>
          <TabsTrigger value="projects">{ru.settings.projects}</TabsTrigger>
          <TabsTrigger value="priorities">{ru.settings.priorities}</TabsTrigger>
        </TabsList>
        <TabsContent value="releases"><ReleasesTab /></TabsContent>
        <TabsContent value="sprints"><SprintsTab /></TabsContent>
        <TabsContent value="areas"><BusinessAreasTab /></TabsContent>
        <TabsContent value="departments"><DepartmentsTab /></TabsContent>
        <TabsContent value="projects"><ProjectsTab /></TabsContent>
        <TabsContent value="priorities"><PrioritiesTab /></TabsContent>
      </Tabs>
    </div>
  );
}
