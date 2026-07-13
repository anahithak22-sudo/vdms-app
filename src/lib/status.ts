import type { Tone } from '@/components/common/DisplayPrimitives';
import type { SelectOption } from '@/components/ui/select';

/**
 * A status machine describes the ordered lifecycle, display labels/tones, and
 * the allowed forward/return transitions for an artifact. The database also
 * validates transitions; this drives the UI (status control, board columns).
 */
export interface StatusConfig<S extends string> {
  order: readonly S[];
  labels: Record<S, string>;
  tones: Record<S, Tone>;
  transitions: Record<S, readonly S[]>;
}

export function statusLabel<S extends string>(cfg: StatusConfig<S>, status: S): string {
  return cfg.labels[status] ?? status;
}

export function statusTone<S extends string>(cfg: StatusConfig<S>, status: S): Tone {
  return cfg.tones[status] ?? 'neutral';
}

/** Statuses the record may move to from its current status (excludes itself). */
export function nextStatuses<S extends string>(cfg: StatusConfig<S>, current: S): S[] {
  return [...(cfg.transitions[current] ?? [])];
}

export function statusSelectOptions<S extends string>(cfg: StatusConfig<S>): SelectOption[] {
  return cfg.order.map((s) => ({ value: s, label: cfg.labels[s] }));
}

/** Build simple linear forward transitions from an ordered list. */
export function linearTransitions<S extends string>(order: readonly S[]): Record<S, readonly S[]> {
  const map = {} as Record<S, S[]>;
  order.forEach((s, i) => {
    map[s] = i + 1 < order.length ? [order[i + 1]] : [];
  });
  return map;
}
