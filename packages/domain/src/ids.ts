export type NpcId = string & { readonly __brand: 'NpcId' };
export type LocationId = string & { readonly __brand: 'LocationId' };
export type MemoryId = string & { readonly __brand: 'MemoryId' };
export type EventId = string & { readonly __brand: 'EventId' };

export const asNpcId = (value: string): NpcId => value as NpcId;
export const asLocationId = (value: string): LocationId => value as LocationId;
export const asMemoryId = (value: string): MemoryId => value as MemoryId;
export const asEventId = (value: string): EventId => value as EventId;
