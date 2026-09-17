import type { ActionType } from './actions';
import type { EventId, LocationId, NpcId } from './ids';

interface EventBase {
  id: EventId;
  tick: number;
  important?: boolean;
}

export type WorldEvent =
  | (EventBase & {
      type: 'action_started';
      npcId: NpcId;
      action: ActionType;
    })
  | (EventBase & {
      type: 'action_completed';
      npcId: NpcId;
      action: ActionType;
    })
  | (EventBase & {
      type: 'theft';
      npcId: NpcId;
      locationId: LocationId;
      witnessedBy: NpcId[];
      important: true;
    })
  | (EventBase & {
      type: 'fight';
      npcId: NpcId;
      targetId: NpcId;
      important: true;
    })
  | (EventBase & {
      type: 'help';
      npcId: NpcId;
      targetId: NpcId;
      important: true;
    })
  | (EventBase & {
      type: 'conversation';
      npcId: NpcId;
      targetId: NpcId;
    })
  | (EventBase & {
      type: 'transaction';
      npcId: NpcId;
      locationId: LocationId;
      item: 'food';
      cost: number;
    })
  | (EventBase & {
      type: 'relationship_changed';
      npcId: NpcId;
      targetId: NpcId;
      trust: number;
    })
  | (EventBase & {
      type: 'memory_created';
      npcId: NpcId;
      memoryType: string;
    })
  | (EventBase & {
      type: 'witness';
      npcId: NpcId;
      targetId: NpcId;
      of: 'theft' | 'fight' | 'help';
      important: true;
    })
  | (EventBase & {
      type: 'world_shift';
      shift: 'food_added' | 'food_taken' | 'rain' | 'festival' | 'market_closed' | 'gift' | 'aid';
      npcId?: NpcId;
      important: true;
    });
