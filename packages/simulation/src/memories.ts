import {
  MEMORY_LIMIT,
  asMemoryId,
  type Memory,
  type MemoryType,
  type Npc,
  type NpcId,
} from '@hundred/domain';

export const addMemory = (npc: Npc, memory: Omit<Memory, 'id'> & { id?: Memory['id'] }): void => {
  const next: Memory = {
    ...memory,
    id: memory.id ?? asMemoryId(`${npc.id}_${memory.tick}_${memory.type}`),
  };
  npc.social.memories.push(next);
  npc.social.memories.sort((a, b) => b.importance - a.importance || b.tick - a.tick);
  if (npc.social.memories.length > MEMORY_LIMIT) {
    npc.social.memories.length = MEMORY_LIMIT;
  }
};

export const relevantMemories = (npc: Npc, limit = 4): Memory[] =>
  npc.social.memories.slice(0, limit);

export const memoryTemplate = (memory: Memory, nameOf: (id: NpcId) => string): string => {
  const subject = memory.subjectId ? nameOf(memory.subjectId) : 'Someone';
  const target = memory.targetId ? nameOf(memory.targetId) : 'someone';
  const templates: Record<MemoryType, string> = {
    helped: `I helped ${target}.`,
    received_help: `${subject} helped me.`,
    gift: `${subject} gave me food.`,
    conversation: `I talked with ${target}.`,
    witnessed_theft: `I saw ${subject} stealing.`,
    stole: `I stole food.`,
    attacked: `I attacked ${target}.`,
    was_attacked: `${subject} attacked me.`,
    refused_help: `${subject} refused to help me.`,
    worked: 'I worked.',
    bought_food: 'I bought food.',
    ate: 'I ate.',
    rumor: `I heard a rumor about ${subject}.`,
    witnessed_fight: `I saw ${subject} fighting.`,
  };
  return templates[memory.type];
};

export const formatMemoryAge = (tick: number, now: number): string => {
  const minutes = Math.max(0, now - tick);
  if (minutes < 1) {
    return 'now';
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  return `${Math.round(minutes / 60)}h`;
};
