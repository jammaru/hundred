import type { NpcPublic, WorldSnapshot } from '@hundred/protocol';
import { Application, Container } from 'pixi.js';

import { pickInteresting } from '../features/hud/interesting';
import { useUiStore } from '../stores/ui-store';
import { facingOf } from './camera';
import { NpcView } from './npc-view';
import { createTown, relabelTown, type TownLayer } from './town';

const TICK_MS = 100;

export class WorldRuntime {
  readonly app = new Application();
  private readonly world = new Container();
  private readonly npcs = new Map<string, NpcView>();
  private records = new Map<string, NpcPublic>();
  private town: TownLayer | undefined;
  private lastLocale: string | undefined;
  private lastOccupancy = '';
  private dragging = false;
  private lastX = 0;
  private lastY = 0;
  private scale = 0.78;
  private initialized = false;

  async mount(host: HTMLElement): Promise<void> {
    await this.app.init({
      background: '#cfe8b8',
      resizeTo: host,
      antialias: true,
      autoDensity: true,
      roundPixels: true,
      resolution: Math.min(2, window.devicePixelRatio || 1),
    });
    host.appendChild(this.app.canvas);
    this.app.canvas.setAttribute('aria-label', 'Hundred world');
    this.world.sortableChildren = true;
    this.app.stage.addChild(this.world);
    this.world.scale.set(this.scale);
    this.world.position.set(24, 12);
    this.bindCamera();
    this.app.ticker.add(() => this.tick());
    this.initialized = true;
  }

  applySnapshot(snapshot: WorldSnapshot): void {
    if (!this.initialized) {
      return;
    }
    if (this.world.children.length === 0) {
      this.town = createTown(snapshot, useUiStore.getState().locale);
      this.lastLocale = useUiStore.getState().locale;
      this.world.addChild(this.town.root);
    }
    this.applyPatch(snapshot.npcs, snapshot.tick);
  }

  applyPatch(npcs: NpcPublic[], _tick: number): void {
    for (const npc of npcs) {
      this.records.set(npc.id, npc);
      let view = this.npcs.get(npc.id);
      if (!view) {
        view = new NpcView(npc.id);
        view.root.on('pointertap', () => {
          useUiStore.getState().selectNpc(npc.id);
        });
        view.root.on('pointerover', () => useUiStore.getState().hoverNpc(npc.id));
        view.root.on('pointerout', () => useUiStore.getState().hoverNpc(null));
        this.npcs.set(npc.id, view);
        this.world.addChild(view.root);
      }
    }
  }

  destroy(): void {
    if (!this.initialized) {
      return;
    }
    this.app.destroy(true, { children: true });
  }

  private tick(): void {
    const state = useUiStore.getState();
    const occupancy: Record<string, number> = {};
    for (const npc of this.records.values()) {
      occupancy[npc.locationId] = (occupancy[npc.locationId] ?? 0) + 1;
    }
    const occupancyKey = JSON.stringify(occupancy);
    const hour = state.snapshot ? Math.floor(state.snapshot.minuteOfDay / 60) : 8;
    const raining = state.snapshot?.weather === 'rain';
    const night = hour < 6 || hour >= 20;
    const festival = Boolean(state.snapshot?.festival);
    if (this.town && (state.locale !== this.lastLocale || occupancyKey !== this.lastOccupancy)) {
      relabelTown(this.town, state.locale, occupancy, night);
      this.lastLocale = state.locale;
      this.lastOccupancy = occupancyKey;
    } else if (this.town) {
      this.town.night.alpha = night ? 0.9 : 0;
    }
    let background = 0xcfe8b8;
    if (raining) {
      background = 0x9bb8b0;
    } else if (night) {
      background = 0x6f7f8a;
    } else if (festival) {
      background = 0xf3d48a;
    }
    this.app.renderer.background.color = background;
    const named = new Set(
      pickInteresting([...this.records.values()], state.favorites).map((item) => item.id),
    );
    const now = performance.now();
    const follow = state.followNpcId ? this.records.get(state.followNpcId) : undefined;
    const firstPerson = state.cameraMode === 'first' && Boolean(follow);
    for (const [id, view] of this.npcs) {
      const npc = this.records.get(id);
      if (!npc) {
        continue;
      }
      const position = interpolate(npc, now);
      view.root.position.set(position.x, position.y);
      const near =
        firstPerson && follow
          ? Math.hypot(npc.position.x - follow.position.x, npc.position.y - follow.position.y) < 140
          : false;
      view.sync(
        npc,
        state.selectedNpcId === id,
        state.hoveredNpcId === id,
        state.followNpcId === id,
        named.has(id) || npc.action === 'steal' || npc.action === 'fight' || npc.hunger >= 85,
        now,
        firstPerson && id === follow?.id,
        near && id !== follow?.id,
      );
    }
    this.steerCamera(follow, firstPerson);
  }

  private steerCamera(follow: NpcPublic | undefined, first: boolean): void {
    if (!follow) {
      return;
    }
    const view = this.npcs.get(follow.id);
    if (!view) {
      return;
    }
    const targetScale = first ? 2.55 : 1.38;
    this.scale += (targetScale - this.scale) * 0.08;
    this.world.scale.set(this.scale);
    const look = first ? facingOf(follow) : { x: 0, y: 0 };
    const lookAhead = first ? 70 : 0;
    const focusX = view.root.x + look.x * lookAhead;
    const focusY = view.root.y + look.y * lookAhead;
    const anchorY = first ? this.app.renderer.height * 0.72 : this.app.renderer.height / 2;
    const targetX = this.app.renderer.width / 2 - focusX * this.world.scale.x;
    const targetY = anchorY - focusY * this.world.scale.y;
    this.world.x += (targetX - this.world.x) * 0.1;
    this.world.y += (targetY - this.world.y) * 0.1;
  }

  private bindCamera(): void {
    const canvas = this.app.canvas;
    canvas.addEventListener('pointerdown', (event) => {
      this.dragging = true;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    window.addEventListener('pointerup', () => {
      this.dragging = false;
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.dragging || useUiStore.getState().cameraMode !== 'town') {
        return;
      }
      this.world.x += event.clientX - this.lastX;
      this.world.y += event.clientY - this.lastY;
      this.lastX = event.clientX;
      this.lastY = event.clientY;
    });
    canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        if (useUiStore.getState().cameraMode !== 'town') {
          return;
        }
        const next = Math.min(1.9, Math.max(0.48, this.scale * (event.deltaY > 0 ? 0.92 : 1.08)));
        this.scale = next;
        this.world.scale.set(next);
      },
      { passive: false },
    );
    canvas.addEventListener('dblclick', () => {
      const hovered = useUiStore.getState().hoveredNpcId;
      if (hovered) {
        useUiStore.getState().followNpc(hovered);
        useUiStore.getState().setCameraMode('follow');
      }
    });
  }
}

const interpolate = (npc: NpcPublic, now: number): { x: number; y: number } => {
  const movement = npc.movement;
  if (!movement) {
    return npc.position;
  }
  const started = movement.startTick * TICK_MS;
  const duration = movement.durationTicks * TICK_MS;
  const t = Math.min(1, Math.max(0, (now % 1_000_000_000) / duration));
  void started;
  void t;
  return npc.position;
};
