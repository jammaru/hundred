import * as z from 'zod';

const actionTypeSchema = z.enum([
  'work',
  'eat',
  'sleep',
  'talk',
  'buy_food',
  'help',
  'steal',
  'fight',
  'flee',
  'visit',
  'explore',
  'rest',
  'intervene',
  'idle',
  'ask_for_help',
]);

const expressionSchema = z.enum([
  'neutral',
  'happy',
  'sad',
  'angry',
  'afraid',
  'tired',
  'surprised',
]);

const providerSchema = z.enum(['jev', 'rules', 'replay']);

const vec2Schema = z.object({
  x: z.number(),
  y: z.number(),
});

const npcPublicSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  job: z.string(),
  avatarSeed: z.string(),
  position: vec2Schema,
  action: actionTypeSchema,
  phase: z.enum(['moving', 'acting', 'idle']),
  expression: expressionSchema,
  hunger: z.number(),
  energy: z.number(),
  money: z.number(),
  locationId: z.string(),
  movement: z
    .object({
      from: vec2Schema,
      to: vec2Schema,
      startTick: z.number(),
      durationTicks: z.number(),
    })
    .optional(),
});

const locationPublicSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string(),
  position: vec2Schema,
  size: vec2Schema,
});

const worldSnapshotSchema = z.object({
  type: z.literal('world.snapshot'),
  seed: z.number(),
  engineVersion: z.string(),
  provider: providerSchema,
  status: z.enum(['running', 'paused']),
  speed: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  tick: z.number(),
  day: z.number(),
  minuteOfDay: z.number(),
  population: z.number(),
  food: z.number(),
  averageWealth: z.number(),
  incidentsToday: z.number(),
  unemployed: z.number(),
  helpsToday: z.number(),
  fightsToday: z.number(),
  weather: z.enum(['clear', 'rain']),
  shopOpen: z.boolean(),
  festival: z.boolean(),
  locations: z.array(locationPublicSchema),
  bounds: z.object({
    width: z.number(),
    height: z.number(),
  }),
  npcs: z.array(npcPublicSchema),
  recording: z.boolean(),
});

const worldPatchSchema = z.object({
  type: z.literal('world.patch'),
  tick: z.number(),
  day: z.number(),
  minuteOfDay: z.number(),
  food: z.number(),
  averageWealth: z.number(),
  incidentsToday: z.number(),
  unemployed: z.number(),
  helpsToday: z.number(),
  fightsToday: z.number(),
  weather: z.enum(['clear', 'rain']),
  shopOpen: z.boolean(),
  festival: z.boolean(),
  npcs: z.array(npcPublicSchema),
});

const eventCreatedSchema = z.object({
  type: z.literal('event.created'),
  id: z.string(),
  tick: z.number(),
  text: z.string(),
  important: z.boolean(),
  category: z.enum(['crime', 'conflict', 'help', 'normal']),
  npcIds: z.array(z.string()),
  kind: z.string(),
  actorName: z.string().optional(),
  targetName: z.string().optional(),
  action: actionTypeSchema.optional(),
  locationId: z.string().optional(),
  locationKind: z.string().optional(),
  locationName: z.string().optional(),
  of: z.enum(['theft', 'fight', 'help']).optional(),
  shift: z.string().optional(),
  day: z.number().optional(),
  minuteOfDay: z.number().optional(),
});

const decisionStartedSchema = z.object({
  type: z.literal('decision.started'),
  npcId: z.string(),
  tick: z.number(),
});

const decisionResolvedSchema = z.object({
  type: z.literal('decision.resolved'),
  context: z
    .object({
      hunger: z.number(),
      energy: z.number(),
      money: z.number(),
      kindness: z.number(),
      greed: z.number(),
      nearby: z.number(),
      memories: z.number(),
      raining: z.boolean(),
      festival: z.boolean(),
      shopOpen: z.boolean(),
    })
    .optional(),
  npcId: z.string(),
  tick: z.number(),
  provider: providerSchema,
  fallback: z.boolean(),
  selected: actionTypeSchema,
  probabilities: z.record(z.string(), z.number()),
});

const simulationStatusSchema = z.object({
  type: z.literal('simulation.status'),
  status: z.enum(['running', 'paused']),
  speed: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  provider: providerSchema,
});

const npcInspectedSchema = z.object({
  type: z.literal('npc.inspected'),
  npc: z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
    job: z.string(),
    avatarSeed: z.string(),
    locationName: z.string(),
    locationKind: z.string().optional(),
    locationId: z.string().optional(),
    householdId: z.string().optional(),
    actionLabel: z.string(),
    actionType: actionTypeSchema.optional(),
    actionPhase: z.enum(['moving', 'acting', 'idle']).optional(),
    expression: expressionSchema,
    needs: z.object({
      hunger: z.number(),
      energy: z.number(),
      health: z.number(),
      mood: z.number(),
    }),
    personality: z.object({
      kindness: z.number(),
      greed: z.number(),
      courage: z.number(),
      sociability: z.number(),
      diligence: z.number(),
    }),
    money: z.number(),
    relationships: z.array(
      z.object({
        npcId: z.string(),
        name: z.string(),
        trust: z.number(),
      }),
    ),
    memories: z.array(
      z.object({
        age: z.string(),
        ageMinutes: z.number().optional(),
        text: z.string(),
        memoryType: z.string().optional(),
        subjectName: z.string().optional(),
        targetName: z.string().optional(),
      }),
    ),
    decision: z.object({
      status: z.enum(['idle', 'deciding', 'decided']),
      provider: providerSchema.optional(),
      selected: actionTypeSchema.optional(),
      probabilities: z.record(z.string(), z.number()).optional(),
    }),
  }),
});

export const serverMessageSchema = z.discriminatedUnion('type', [
  worldSnapshotSchema,
  worldPatchSchema,
  eventCreatedSchema,
  decisionStartedSchema,
  decisionResolvedSchema,
  simulationStatusSchema,
  npcInspectedSchema,
]);

export const clientMessageSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('simulation.pause') }),
  z.object({ type: z.literal('simulation.resume') }),
  z.object({
    type: z.literal('simulation.setSpeed'),
    speed: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  }),
  z.object({ type: z.literal('npc.inspect'), npcId: z.string() }),
  z.object({
    type: z.literal('god.act'),
    intent: z.enum(['add_food', 'starve', 'rain', 'festival', 'close_market', 'gift', 'aid']),
    npcId: z.string().optional(),
  }),
]);

export type ServerMessage = z.infer<typeof serverMessageSchema>;
export type ClientMessage = z.infer<typeof clientMessageSchema>;
export type WorldSnapshot = z.infer<typeof worldSnapshotSchema>;
export type NpcPublic = z.infer<typeof npcPublicSchema>;
export type EventCreated = z.infer<typeof eventCreatedSchema>;
export type NpcInspected = z.infer<typeof npcInspectedSchema>;
