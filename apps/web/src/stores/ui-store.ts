import type {
  EventCreated,
  NpcInspected,
  NpcPublic,
  ServerMessage,
  WorldSnapshot,
} from '@hundred/protocol';
import { create } from 'zustand';

import type { Locale } from '../i18n';
import type { CameraMode } from '../world/camera';

interface CameraView {
  x: number;
  y: number;
  scale: number;
  width: number;
  height: number;
}

type DecisionRecord = Extract<ServerMessage, { type: 'decision.resolved' }>;

interface UiState {
  decisions: DecisionRecord[];
  addDecision: (decision: DecisionRecord) => void;
  locale: Locale;
  selectedNpcId: string | null;
  hoveredNpcId: string | null;
  followNpcId: string | null;
  cameraMode: CameraMode;
  favorites: Set<string>;
  query: string;
  snapshot: WorldSnapshot | null;
  people: Record<string, NpcPublic>;
  inspected: NpcInspected['npc'] | null;
  events: EventCreated[];
  debug: boolean;
  cameraView: CameraView | null;
  cameraFocus: { x: number; y: number } | null;
  cameraCommand: 'in' | 'out' | 'reset' | null;
  setCameraCommand: (command: 'in' | 'out' | 'reset' | null) => void;
  setLocale: (locale: Locale) => void;
  setQuery: (query: string) => void;
  toggleFavorite: (id: string) => void;
  selectNpc: (id: string | null) => void;
  hoverNpc: (id: string | null) => void;
  followNpc: (id: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setSnapshot: (snapshot: WorldSnapshot) => void;
  setPeople: (people: Record<string, NpcPublic>) => void;
  setInspected: (npc: NpcInspected['npc'] | null) => void;
  addEvent: (event: EventCreated) => void;
  setCameraView: (view: CameraView) => void;
  requestCameraFocus: (point: { x: number; y: number }) => void;
  clearCameraFocus: () => void;
}

const readLocale = (): Locale => {
  try {
    const stored = window.localStorage.getItem('hundred.locale');
    if (stored === 'ja' || stored === 'en') {
      return stored;
    }
  } catch {
    // ignore storage access issues
  }
  return navigator.language.toLowerCase().startsWith('ja') ? 'ja' : 'en';
};

const readFavorites = (): Set<string> => {
  try {
    const stored = window.localStorage.getItem('hundred.favorites');
    if (!stored) {
      return new Set();
    }
    const parsed = JSON.parse(stored) as unknown;
    if (Array.isArray(parsed)) {
      return new Set(parsed.filter((item): item is string => typeof item === 'string'));
    }
  } catch {
    // ignore storage access issues
  }
  return new Set();
};

const persistFavorites = (favorites: Set<string>): void => {
  try {
    window.localStorage.setItem('hundred.favorites', JSON.stringify([...favorites]));
  } catch {
    // ignore storage access issues
  }
};

export const useUiStore = create<UiState>((set) => ({
  decisions: [],
  addDecision: (decision) =>
    set((state) => ({ decisions: [decision, ...state.decisions].slice(0, 100) })),
  locale: readLocale(),
  selectedNpcId: null,
  hoveredNpcId: null,
  followNpcId: null,
  cameraMode: 'town',
  favorites: readFavorites(),
  query: '',
  snapshot: null,
  people: {},
  inspected: null,
  events: [],
  debug: new URLSearchParams(window.location.search).has('debug'),
  cameraView: null,
  cameraFocus: null,
  cameraCommand: null,
  setCameraCommand: (cameraCommand) =>
    set(
      cameraCommand ? { cameraCommand, cameraMode: 'town', followNpcId: null } : { cameraCommand },
    ),
  setLocale: (locale) => {
    try {
      window.localStorage.setItem('hundred.locale', locale);
    } catch {
      // ignore storage access issues
    }
    set({ locale });
  },
  setQuery: (query) => set({ query }),
  toggleFavorite: (id) =>
    set((state) => {
      const favorites = new Set(state.favorites);
      if (favorites.has(id)) {
        favorites.delete(id);
      } else {
        favorites.add(id);
      }
      persistFavorites(favorites);
      return { favorites };
    }),
  selectNpc: (id) =>
    set((state) => ({
      selectedNpcId: id,
      inspected: state.inspected?.id === id ? state.inspected : null,
      followNpcId: state.cameraMode === 'town' ? null : id,
    })),
  hoverNpc: (id) => set({ hoveredNpcId: id }),
  followNpc: (id) =>
    set((state) => ({
      followNpcId: id,
      selectedNpcId: id ?? state.selectedNpcId,
      cameraMode: id ? (state.cameraMode === 'town' ? 'follow' : state.cameraMode) : 'town',
    })),
  setCameraMode: (mode) =>
    set((state) => {
      if (mode === 'town') {
        return { cameraMode: 'town', followNpcId: null, cameraCommand: 'reset' };
      }
      const id = state.followNpcId ?? state.selectedNpcId ?? state.snapshot?.npcs[0]?.id ?? null;
      return {
        cameraMode: mode,
        followNpcId: id,
        selectedNpcId: id ?? state.selectedNpcId,
      };
    }),
  setSnapshot: (snapshot) =>
    set((state) => ({
      snapshot,
      ...(state.snapshot?.seed !== snapshot.seed ? { decisions: [] } : {}),
    })),
  setPeople: (people) => set({ people }),
  setInspected: (npc) => set({ inspected: npc }),
  addEvent: (event) =>
    set((state) => {
      if (state.events.some((existing) => existing.id === event.id)) {
        return state;
      }
      return {
        events: [event, ...state.events].slice(0, 40),
      };
    }),
  setCameraView: (view) => set({ cameraView: view }),
  requestCameraFocus: (point) => set({ cameraFocus: point }),
  clearCameraFocus: () => set({ cameraFocus: null }),
}));
