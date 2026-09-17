import type { EventCreated, NpcInspected } from '@hundred/protocol';

import { dictionaries, type Locale } from './messages';

type Vars = Record<string, string | number>;

const lookup = (locale: Locale, path: string): string | undefined => {
  const parts = path.split('.');
  let current: unknown = dictionaries[locale];
  for (const part of parts) {
    if (typeof current !== 'object' || current === null || !(part in current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
};

const interpolate = (template: string, vars: Vars = {}): string =>
  template.replaceAll(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ''));

export const t = (locale: Locale, path: string, vars?: Vars): string => {
  const value = lookup(locale, path) ?? lookup('en', path) ?? path;
  return vars ? interpolate(value, vars) : value;
};

const periodFromMinute = (minuteOfDay: number): string => {
  const hour = Math.floor(minuteOfDay / 60);
  if (hour >= 5 && hour < 11) {
    return 'morning';
  }
  if (hour >= 11 && hour < 14) {
    return 'midday';
  }
  if (hour >= 14 && hour < 17) {
    return 'afternoon';
  }
  if (hour >= 17 && hour < 21) {
    return 'evening';
  }
  return 'night';
};

export const locationLabel = (
  locale: Locale,
  location: { id?: string; kind?: string; name?: string },
): string => {
  if (location.id && lookup(locale, `location.${location.id}`)) {
    return t(locale, `location.${location.id}`);
  }
  if (location.kind && lookup(locale, `location.${location.kind}`)) {
    return t(locale, `location.${location.kind}`);
  }
  return location.name ?? t(locale, 'location.town');
};

export const jobLabel = (locale: Locale, job: string): string =>
  lookup(locale, `job.${job}`) ? t(locale, `job.${job}`) : job;

export const actionLabel = (locale: Locale, action: string): string =>
  lookup(locale, `action.${action}`) ? t(locale, `action.${action}`) : action.replaceAll('_', ' ');

export const formatClockLabel = (locale: Locale, day: number, minuteOfDay: number): string => {
  const hour = Math.floor(minuteOfDay / 60)
    .toString()
    .padStart(2, '0');
  const minute = (minuteOfDay % 60).toString().padStart(2, '0');
  const period = t(locale, `clock.period.${periodFromMinute(minuteOfDay)}`);
  return `${t(locale, 'clock.day', { day: String(day).padStart(2, '0') })} · ${hour}:${minute} · ${period}`;
};

export const formatActionPhrase = (
  locale: Locale,
  npc: Pick<NpcInspected['npc'], 'actionType' | 'actionPhase' | 'actionLabel' | 'decision'>,
): string => {
  if (npc.decision.status === 'deciding') {
    return t(locale, 'actionPhrase.deciding');
  }
  const action = npc.actionType ? actionLabel(locale, npc.actionType) : npc.actionLabel;
  if (npc.actionPhase === 'moving' && npc.actionType) {
    return t(locale, 'actionPhrase.moving', { action });
  }
  if (npc.actionType === 'idle') {
    return t(locale, 'actionPhrase.idle');
  }
  return action;
};

export const formatMemoryAge = (
  locale: Locale,
  minutes: number | undefined,
  fallback: string,
): string => {
  if (minutes === undefined) {
    return fallback;
  }
  if (minutes < 1) {
    return t(locale, 'memoryAge.now');
  }
  if (minutes < 60) {
    return t(locale, 'memoryAge.minutes', { n: minutes });
  }
  return t(locale, 'memoryAge.hours', { n: Math.round(minutes / 60) });
};

export const formatMemory = (
  locale: Locale,
  memory: NpcInspected['npc']['memories'][number],
): string => {
  if (!memory.memoryType) {
    return memory.text;
  }
  const path = `memory.${memory.memoryType}`;
  if (!lookup(locale, path)) {
    return memory.text;
  }
  return t(locale, path, {
    subject: memory.subjectName ?? (locale === 'ja' ? '誰か' : 'Someone'),
    target: memory.targetName ?? (locale === 'ja' ? '誰か' : 'someone'),
  });
};

export const formatEventTime = (locale: Locale, event: EventCreated): string => {
  if (event.day === undefined || event.minuteOfDay === undefined) {
    return '';
  }
  const hour = Math.floor(event.minuteOfDay / 60)
    .toString()
    .padStart(2, '0');
  const minute = (event.minuteOfDay % 60).toString().padStart(2, '0');
  return `${t(locale, 'clock.day', { day: event.day })} ${hour}:${minute}`;
};

export const formatEvent = (locale: Locale, event: EventCreated): string => {
  const actor = event.actorName ?? (locale === 'ja' ? '誰か' : 'Someone');
  const target = event.targetName ?? (locale === 'ja' ? '誰か' : 'someone');
  const action = event.action ? actionLabel(locale, event.action) : '';
  if (event.kind === 'world_shift') {
    const key = event.shift ? `event.shift_${event.shift}` : '';
    if (key && lookup(locale, key)) {
      return t(locale, key, { actor, target, action });
    }
  }
  if (event.kind === 'witness') {
    const key =
      event.of === 'fight'
        ? 'event.witness_fight'
        : event.of === 'help'
          ? 'event.witness_help'
          : 'event.witness_theft';
    return t(locale, key, { actor, target });
  }
  const path = `event.${event.kind}`;
  if (event.kind && lookup(locale, path)) {
    return t(locale, path, { actor, target, action, trust: '' });
  }
  return event.text;
};
