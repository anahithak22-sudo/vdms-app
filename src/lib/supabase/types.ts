/**
 * Hand-authored Database types kept in sync with supabase/migrations.
 * Regenerated with `supabase gen types typescript` in later phases.
 */

export type UserRole = 'super_admin' | 'admin' | 'manager' | 'developer';
export type AuditCategory = 'business' | 'security';
export type AuditAction =
  | 'create' | 'update' | 'delete' | 'archive' | 'restore'
  | 'status_change' | 'priority_change' | 'assignment' | 'comment' | 'attachment'
  | 'import' | 'export' | 'role_change' | 'permission_update'
  | 'login' | 'logout' | 'failed_login' | 'password_change' | 'password_reset'
  | 'permission_denied' | 'account_locked' | 'account_unlocked' | 'session_expired';
export type LogCategory =
  | 'error' | 'debug' | 'import' | 'export' | 'notification' | 'scheduler' | 'performance';
export type LogSeverity = 'information' | 'warning' | 'error' | 'critical' | 'fatal';
export type NotificationCategory = 'business' | 'reminder' | 'system' | 'security' | 'monitoring';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';
export type NotificationStatus = 'unread' | 'read' | 'archived';
export type PriorityLevel = 'low' | 'medium' | 'high' | 'critical';
export type QueuePage = 'v_rabote' | 'priemka' | 'i_support';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type PlanningStatus =
  | 'draft' | 'proposed' | 'approved' | 'planned' | 'in_progress' | 'on_hold' | 'completed' | 'archived';
export type RoadmapStatus =
  | 'backlog' | 'ready' | 'in_development' | 'code_review' | 'ready_for_testing'
  | 'testing' | 'fixed_on_test' | 'fixed_on_preprod' | 'fixed_on_production' | 'closed';
export type BugSeverity = 'critical' | 'major' | 'minor' | 'trivial';
export type BugStatus =
  | 'open' | 'assigned' | 'in_progress' | 'ready_for_testing' | 'testing'
  | 'fixed_on_test' | 'fixed_on_preprod' | 'fixed_on_production' | 'closed' | 'archived';
export type BugRootCause =
  | 'requirements' | 'backend' | 'frontend' | 'database' | 'integration'
  | 'infrastructure' | 'performance' | 'security' | 'configuration' | 'unknown';
export type BugResolution =
  | 'fixed' | 'cannot_reproduce' | 'duplicate' | 'wont_fix'
  | 'by_design' | 'configuration_issue' | 'third_party' | 'deferred';
export type WeekStatus = 'open' | 'closed' | 'archived';
export type WeeklyTaskStatus =
  | 'planned' | 'in_progress' | 'blocked' | 'ready_for_testing' | 'testing'
  | 'fixed_on_test' | 'fixed_on_preprod' | 'fixed_on_production' | 'done';
export type ImplementationReadiness =
  | 'not_ready' | 'analysis' | 'ready' | 'approved' | 'selected' | 'scheduled' | 'completed';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface AuditableColumns {
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  version: number;
  is_archived: boolean;
  archived_at: string | null;
  archived_by: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
  deleted_by: string | null;
}

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: AuditableColumns & {
          id: string;
          business_id: string;
          auth_user_id: string;
          username: string;
          display_name: string;
          role: UserRole;
          department: string | null;
          avatar_url: string | null;
          is_first_login: boolean;
          is_active: boolean;
          is_locked: boolean;
          locked_until: string | null;
          failed_login_attempts: number;
          last_login_at: string | null;
        };
        Insert: {
          id?: string;
          business_id?: string;
          auth_user_id: string;
          username: string;
          display_name: string;
          role: UserRole;
          department?: string | null;
          avatar_url?: string | null;
          is_first_login?: boolean;
          is_active?: boolean;
        };
        Update: {
          display_name?: string;
          department?: string | null;
          avatar_url?: string | null;
          is_first_login?: boolean;
          is_active?: boolean;
        };
        Relationships: [];
      };
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          scope: string;
          preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: { id?: string; user_id: string; scope: string; preferences?: Json };
        Update: { preferences?: Json };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          category: AuditCategory;
          action: AuditAction;
          entity_table: string | null;
          entity_id: string | null;
          entity_business_id: string | null;
          actor_id: string | null;
          actor_username: string | null;
          actor_role: UserRole | null;
          old_value: Json;
          new_value: Json;
          message: string | null;
          ip_address: string | null;
          user_agent: string | null;
          session_id: string | null;
          correlation_id: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      system_logs: {
        Row: {
          id: string;
          category: LogCategory;
          severity: LogSeverity;
          module: string | null;
          operation: string | null;
          message: string;
          context: Json;
          actor_id: string | null;
          correlation_id: string | null;
          duration_ms: number | null;
          error_code: string | null;
          stack_trace: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          category: NotificationCategory;
          event_type: string;
          priority: NotificationPriority;
          status: NotificationStatus;
          title: string;
          message: string | null;
          related_table: string | null;
          related_id: string | null;
          action_url: string | null;
          correlation_id: string | null;
          is_immutable: boolean;
          created_by: string | null;
          created_at: string;
          read_at: string | null;
          archived_at: string | null;
          is_deleted: boolean;
          deleted_at: string | null;
        };
        Insert: never;
        Update: {
          status?: NotificationStatus;
          read_at?: string | null;
          archived_at?: string | null;
          is_deleted?: boolean;
          deleted_at?: string | null;
        };
        Relationships: [];
      };
      notification_counters: {
        Row: { user_id: string; unread_count: number; updated_at: string };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      business_areas: {
        Row: {
          id: string; key: string; name: string; description: string | null;
          sort_order: number; is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: { key: string; name: string; description?: string | null; sort_order?: number; is_active?: boolean };
        Update: { name?: string; description?: string | null; sort_order?: number; is_active?: boolean };
        Relationships: [];
      };
      departments: {
        Row: {
          id: string; key: string; name: string; description: string | null;
          sort_order: number; is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: { key: string; name: string; description?: string | null; sort_order?: number; is_active?: boolean };
        Update: { name?: string; description?: string | null; sort_order?: number; is_active?: boolean };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string; key: string; name: string; description: string | null;
          sort_order: number; is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: { key: string; name: string; description?: string | null; sort_order?: number; is_active?: boolean };
        Update: { name?: string; description?: string | null; sort_order?: number; is_active?: boolean };
        Relationships: [];
      };
      priority_definitions: {
        Row: {
          id: string; key: PriorityLevel; name: string; color: string;
          sort_order: number; is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: { key: PriorityLevel; name: string; color: string; sort_order?: number; is_active?: boolean };
        Update: { name?: string; color?: string; sort_order?: number; is_active?: boolean };
        Relationships: [];
      };
      releases: {
        Row: AuditableColumns & {
          id: string; business_id: string; name: string; release_version: string | null;
          status: string; owner_id: string | null; start_date: string | null;
          target_date: string | null; completion_percentage: number; release_notes: string | null;
        };
        Insert: {
          id?: string; business_id?: string; name: string; release_version?: string | null;
          status?: string; owner_id?: string | null; start_date?: string | null;
          target_date?: string | null; completion_percentage?: number; release_notes?: string | null;
        };
        Update: {
          name?: string; release_version?: string | null; status?: string; owner_id?: string | null;
          start_date?: string | null; target_date?: string | null;
          completion_percentage?: number; release_notes?: string | null;
        };
        Relationships: [];
      };
      sprints: {
        Row: AuditableColumns & {
          id: string; business_id: string; name: string; release_id: string | null;
          start_date: string | null; end_date: string | null; capacity: number | null;
          velocity: number | null; completion_rate: number;
        };
        Insert: {
          id?: string; business_id?: string; name: string; release_id?: string | null;
          start_date?: string | null; end_date?: string | null; capacity?: number | null;
          velocity?: number | null; completion_rate?: number;
        };
        Update: {
          name?: string; release_id?: string | null; start_date?: string | null;
          end_date?: string | null; capacity?: number | null; velocity?: number | null;
          completion_rate?: number;
        };
        Relationships: [];
      };
      planning_initiatives: {
        Row: AuditableColumns & {
          id: string; business_id: string; title: string; short_description: string | null;
          description: string | null; business_area: string | null; department: string | null;
          owner_id: string | null; priority: PriorityLevel; status: PlanningStatus;
          risk_level: RiskLevel; start_date: string | null; target_finish_date: string | null;
          actual_finish_date: string | null; estimated_duration_days: number | null;
          progress: number; budget: number | null;
        };
        Insert: {
          id?: string; business_id?: string; title: string; short_description?: string | null;
          description?: string | null; business_area?: string | null; department?: string | null;
          owner_id?: string | null; priority?: PriorityLevel; status?: PlanningStatus;
          risk_level?: RiskLevel; start_date?: string | null; target_finish_date?: string | null;
          actual_finish_date?: string | null; estimated_duration_days?: number | null;
          progress?: number; budget?: number | null;
        };
        Update: Partial<Database['public']['Tables']['planning_initiatives']['Insert']>;
        Relationships: [];
      };
      roadmap_items: {
        Row: AuditableColumns & {
          id: string; business_id: string; title: string; description: string | null;
          epic: string | null; feature: string | null; release_id: string | null;
          sprint_id: string | null; owner_id: string | null; assigned_developer_id: string | null;
          priority: PriorityLevel; status: RoadmapStatus; story_points: number | null;
          estimated_hours: number | null; remaining_hours: number | null; progress: number;
          start_date: string | null; due_date: string | null; actual_finish_date: string | null;
          risk: RiskLevel; tags: string[];
        };
        Insert: {
          id?: string; business_id?: string; title: string; description?: string | null;
          epic?: string | null; feature?: string | null; release_id?: string | null;
          sprint_id?: string | null; owner_id?: string | null; assigned_developer_id?: string | null;
          priority?: PriorityLevel; status?: RoadmapStatus; story_points?: number | null;
          estimated_hours?: number | null; remaining_hours?: number | null; progress?: number;
          start_date?: string | null; due_date?: string | null; actual_finish_date?: string | null;
          risk?: RiskLevel; tags?: string[];
        };
        Update: Partial<Database['public']['Tables']['roadmap_items']['Insert']>;
        Relationships: [];
      };
      bugs: {
        Row: AuditableColumns & {
          id: string; business_id: string; title: string; description: string | null;
          steps_to_reproduce: string | null; expected_result: string | null; actual_result: string | null;
          severity: BugSeverity; priority: PriorityLevel; status: BugStatus;
          environment: string | null; app_version: string | null; affected_module: string | null;
          reporter_id: string | null; assigned_developer_id: string | null; manager_id: string | null;
          release_id: string | null; sprint_id: string | null; root_cause: BugRootCause | null;
          resolution: BugResolution | null; roadmap_item_id: string | null; reopen_count: number;
          closed_at: string | null; resolution_time_hours: number | null;
        };
        Insert: {
          id?: string; business_id?: string; title: string; description?: string | null;
          steps_to_reproduce?: string | null; expected_result?: string | null; actual_result?: string | null;
          severity?: BugSeverity; priority?: PriorityLevel; status?: BugStatus;
          environment?: string | null; app_version?: string | null; affected_module?: string | null;
          reporter_id?: string | null; assigned_developer_id?: string | null; manager_id?: string | null;
          release_id?: string | null; sprint_id?: string | null; root_cause?: BugRootCause | null;
          resolution?: BugResolution | null; roadmap_item_id?: string | null; reopen_count?: number;
          closed_at?: string | null; resolution_time_hours?: number | null;
        };
        Update: Partial<Database['public']['Tables']['bugs']['Insert']>;
        Relationships: [];
      };
      planning_weeks: {
        Row: AuditableColumns & {
          id: string; week_number: number; year: number; start_date: string; end_date: string;
          status: WeekStatus; completion_percentage: number;
        };
        Insert: {
          id?: string; week_number: number; year: number; start_date: string; end_date: string;
          status?: WeekStatus; completion_percentage?: number;
        };
        Update: Partial<Database['public']['Tables']['planning_weeks']['Insert']>;
        Relationships: [];
      };
      weekly_tasks: {
        Row: AuditableColumns & {
          id: string; business_id: string; title: string; description: string | null;
          week_id: string; roadmap_item_id: string | null; assigned_user_id: string | null;
          manager_id: string | null; status: WeeklyTaskStatus; priority: PriorityLevel;
          estimated_hours: number | null; actual_hours: number | null; remaining_hours: number | null;
          sprint_id: string | null; release_id: string | null; tags: string[]; due_date: string | null;
          previous_task_id: string | null; rollover_count: number; completed_at: string | null;
          priority_queue_id: string | null;
        };
        Insert: {
          id?: string; business_id?: string; title: string; description?: string | null;
          week_id: string; roadmap_item_id?: string | null; assigned_user_id?: string | null;
          manager_id?: string | null; status?: WeeklyTaskStatus; priority?: PriorityLevel;
          estimated_hours?: number | null; actual_hours?: number | null; remaining_hours?: number | null;
          sprint_id?: string | null; release_id?: string | null; tags?: string[]; due_date?: string | null;
          previous_task_id?: string | null; rollover_count?: number; completed_at?: string | null;
          priority_queue_id?: string | null;
        };
        Update: Partial<Database['public']['Tables']['weekly_tasks']['Insert']>;
        Relationships: [];
      };
      priority_queue: {
        Row: AuditableColumns & {
          id: string; business_id: string; external_task_id: string | null; source_system: string;
          title: string; description: string | null; priority: PriorityLevel;
          business_area: string | null; project: string | null; owner_id: string | null;
          requester: string | null; estimated_hours: number | null; story_points: number | null;
          external_status: string | null; implementation_readiness: ImplementationReadiness;
          tags: string[]; imported_at: string | null; imported_by: string | null;
        };
        Insert: {
          id?: string; business_id?: string; external_task_id?: string | null; source_system?: string;
          title: string; description?: string | null; priority?: PriorityLevel;
          business_area?: string | null; project?: string | null; owner_id?: string | null;
          requester?: string | null; estimated_hours?: number | null; story_points?: number | null;
          external_status?: string | null; implementation_readiness?: ImplementationReadiness;
          tags?: string[]; imported_at?: string | null; imported_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['priority_queue']['Insert']>;
        Relationships: [];
      };
      plan_statuses: {
        Row: {
          id: string; name: string; color: string; sort_order: number; is_terminal: boolean;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
        };
        Insert: {
          id?: string; name: string; color?: string; sort_order?: number; is_terminal?: boolean;
        };
        Update: { name?: string; color?: string; sort_order?: number; is_terminal?: boolean };
        Relationships: [];
      };
      plan_tags: {
        Row: {
          id: string; label: string; color: string;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
        };
        Insert: { id?: string; label: string; color?: string };
        Update: { label?: string; color?: string };
        Relationships: [];
      };
      plan_tasks: {
        Row: AuditableColumns & {
          id: string; business_id: string; title: string; description: string | null;
          status_id: string; priority: PriorityLevel; start_date: string | null;
          end_date: string | null; sort_order: number;
        };
        Insert: {
          id?: string; business_id?: string; title: string; description?: string | null;
          status_id: string; priority?: PriorityLevel; start_date?: string | null;
          end_date?: string | null; sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['plan_tasks']['Insert']>;
        Relationships: [];
      };
      plan_task_tags: {
        Row: { task_id: string; tag_id: string };
        Insert: { task_id: string; tag_id: string };
        Update: { task_id?: string; tag_id?: string };
        Relationships: [];
      };
      plan_task_comments: {
        Row: {
          id: string; task_id: string; body: string;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
          is_deleted: boolean; deleted_at: string | null; deleted_by: string | null;
        };
        Insert: { id?: string; task_id: string; body: string };
        Update: { body?: string; is_deleted?: boolean; deleted_at?: string | null; deleted_by?: string | null };
        Relationships: [];
      };
      rdev_statuses: {
        Row: {
          id: string; name: string; color: string; sort_order: number; is_terminal: boolean;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
        };
        Insert: { id?: string; name: string; color?: string; sort_order?: number; is_terminal?: boolean };
        Update: { name?: string; color?: string; sort_order?: number; is_terminal?: boolean };
        Relationships: [];
      };
      rdev_tags: {
        Row: {
          id: string; label: string; color: string;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
        };
        Insert: { id?: string; label: string; color?: string };
        Update: { label?: string; color?: string };
        Relationships: [];
      };
      rdev_tasks: {
        Row: AuditableColumns & {
          id: string; business_id: string; title: string; description: string | null;
          status_id: string; priority: PriorityLevel; assignee_id: string | null;
          start_date: string | null; end_date: string | null; planned_end: string | null;
          sort_order: number;
        };
        Insert: {
          id?: string; business_id?: string; title: string; description?: string | null;
          status_id: string; priority?: PriorityLevel; assignee_id?: string | null;
          start_date?: string | null; end_date?: string | null; planned_end?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['rdev_tasks']['Insert']>;
        Relationships: [];
      };
      rdev_task_tags: {
        Row: { task_id: string; tag_id: string };
        Insert: { task_id: string; tag_id: string };
        Update: { task_id?: string; tag_id?: string };
        Relationships: [];
      };
      rdev_task_comments: {
        Row: {
          id: string; task_id: string; body: string;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
          is_deleted: boolean; deleted_at: string | null; deleted_by: string | null;
        };
        Insert: { id?: string; task_id: string; body: string };
        Update: { body?: string; is_deleted?: boolean; deleted_at?: string | null; deleted_by?: string | null };
        Relationships: [];
      };
      queue_items: {
        Row: AuditableColumns & {
          id: string; business_id: string; page: QueuePage; external_task_id: string | null;
          status: string | null; description: string; priority: string | null;
          task_link: string | null; fixed_status: string | null; environment: string | null;
          comment: string | null; week_tag: string | null; week_year: number | null;
          week_number: number | null; sort_order: number;
          attachment_path: string | null; attachment_name: string | null;
        };
        Insert: {
          id?: string; business_id?: string; page: QueuePage; external_task_id?: string | null;
          status?: string | null; description: string; priority?: string | null;
          task_link?: string | null; fixed_status?: string | null; environment?: string | null;
          comment?: string | null; week_tag?: string | null; week_year?: number | null;
          week_number?: number | null; sort_order?: number;
          attachment_path?: string | null; attachment_name?: string | null;
        };
        Update: Partial<Database['public']['Tables']['queue_items']['Insert']> & {
          is_archived?: boolean; archived_at?: string | null;
        };
        Relationships: [];
      };
      bug_stats: {
        Row: {
          id: string; business_id: string; stat_date: string;
          opened: number; in_progress_rstyle: number; in_progress_vtba: number; closed: number;
          comment: string | null;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
          is_deleted: boolean; deleted_at: string | null; deleted_by: string | null;
        };
        Insert: {
          id?: string; business_id?: string; stat_date: string;
          opened?: number; in_progress_rstyle?: number; in_progress_vtba?: number; closed?: number;
          comment?: string | null;
        };
        Update: {
          stat_date?: string; opened?: number; in_progress_rstyle?: number;
          in_progress_vtba?: number; closed?: number; comment?: string | null;
          is_deleted?: boolean; deleted_at?: string | null;
        };
        Relationships: [];
      };
      wp_tasks: {
        Row: {
          id: string; business_id: string; week_tag: string; week_year: number; week_number: number;
          assignee_id: string | null; title: string; due_date: string | null;
          is_done: boolean; done_at: string | null; sort_order: number;
          created_at: string; updated_at: string; created_by: string | null;
          updated_by: string | null; version: number;
          is_deleted: boolean; deleted_at: string | null; deleted_by: string | null;
        };
        Insert: {
          id?: string; business_id?: string; week_tag: string; week_year: number; week_number: number;
          assignee_id?: string | null; title: string; due_date?: string | null;
          is_done?: boolean; sort_order?: number;
        };
        Update: {
          week_tag?: string; week_year?: number; week_number?: number; assignee_id?: string | null;
          title?: string; due_date?: string | null; is_done?: boolean; done_at?: string | null;
          sort_order?: number; is_deleted?: boolean; deleted_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      resolve_username_to_email: { Args: { p_username: string }; Returns: string };
      current_app_user: { Args: Record<string, never>; Returns: Database['public']['Tables']['app_users']['Row'][] };
      record_login_result: {
        Args: { p_username: string; p_success: boolean };
        Returns: { locked: boolean; locked_until: string | null; attempts_remaining: number }[];
      };
      unlock_account: { Args: { p_user_id: string }; Returns: undefined };
      log_event: {
        Args: {
          p_category: LogCategory;
          p_message: string;
          p_severity?: LogSeverity;
          p_module?: string | null;
          p_operation?: string | null;
          p_context?: Json;
          p_correlation_id?: string | null;
          p_duration_ms?: number | null;
          p_error_code?: string | null;
          p_stack_trace?: string | null;
        };
        Returns: string;
      };
      mark_notification_read: { Args: { p_id: string }; Returns: undefined };
      mark_all_notifications_read: { Args: Record<string, never>; Returns: number };
      unread_notification_count: { Args: Record<string, never>; Returns: number };
      archive_record: { Args: { p_table: string; p_id: string }; Returns: undefined };
      restore_record: { Args: { p_table: string; p_id: string }; Returns: undefined };
      soft_delete_record: { Args: { p_table: string; p_id: string }; Returns: undefined };
      admin_list_users: {
        Args: { p_search?: string; p_include_archived?: boolean };
        Returns: Database['public']['Tables']['app_users']['Row'][];
      };
      admin_set_user_role: { Args: { p_user_id: string; p_role: UserRole }; Returns: undefined };
      admin_set_user_active: { Args: { p_user_id: string; p_active: boolean }; Returns: undefined };
      admin_archive_user: { Args: { p_user_id: string }; Returns: undefined };
      admin_restore_user: { Args: { p_user_id: string }; Returns: undefined };
      set_weekly_task_status: {
        Args: { p_task_id: string; p_status: WeeklyTaskStatus };
        Returns: undefined;
      };
      rollover_weekly_tasks: { Args: { p_source_week: string; p_target_week: string }; Returns: number };
      select_queue_item_for_week: {
        Args: { p_queue_id: string; p_week_id: string; p_assignee?: string | null };
        Returns: string;
      };
      current_app_user_id: { Args: Record<string, never>; Returns: string };
      list_assignable_users: {
        Args: Record<string, never>;
        Returns: { id: string; display_name: string; role: UserRole }[];
      };
      set_plan_task_tags: { Args: { p_task_id: string; p_tag_ids: string[] }; Returns: undefined };
      set_rdev_task_tags: { Args: { p_task_id: string; p_tag_ids: string[] }; Returns: undefined };
      wp_toggle_done: { Args: { p_id: string; p_done: boolean }; Returns: undefined };
    };
    Enums: {
      user_role: UserRole;
      audit_category: AuditCategory;
      audit_action: AuditAction;
      log_category: LogCategory;
      log_severity: LogSeverity;
      notification_category: NotificationCategory;
      notification_priority: NotificationPriority;
      notification_status: NotificationStatus;
      priority_level: PriorityLevel;
      risk_level: RiskLevel;
      planning_status: PlanningStatus;
      roadmap_status: RoadmapStatus;
      bug_severity: BugSeverity;
      bug_status: BugStatus;
      bug_root_cause: BugRootCause;
      bug_resolution: BugResolution;
      week_status: WeekStatus;
      weekly_task_status: WeeklyTaskStatus;
      implementation_readiness: ImplementationReadiness;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
