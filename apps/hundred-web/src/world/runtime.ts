import type { NpcPublic, WorldSnapshot } from '@hundred/protocol';
import { Application, Container } from 'pixi.js';

import { shouldCaptionNpc } from '../features/hud/activity';
import { pickInteresting } from '../features/hud/interesting';
import { actionLabel } from '../i18n';
import { useUiStore } from '../stores/ui-store';
import { loadSprites, type SpriteSet } from './assets';
import { AtmosphereLayer, tintAt } from './atmosphere';
import { facingOf } from './camera';
import { NpcView } from './npc-view';
import { villagerSpriteName } from './sprite-identity';
import { createTown, relabelTown, type TownLayer } from './town';

export class WorldRuntime {
  readonly app = new Application();
  private readonly world = new Container();
  private readonly atmosphere = new AtmosphereLayer();
  private readonly npcs = new Map<string, NpcView>();
  private records = new Map<string, NpcPublic>();
  private sprites: SpriteSet | undefined;
  private town: TownLayer | undefined;
  private lastLocale: string | undefined;
  private lastOccupancy = '';
  private nightAlpha = 0;
  private dragging = false;
  private readonly inputController = new AbortController();
  private lastCameraMode = 'town';
  private lastX = 0;
  private lastY = 0;
  private scale = 0.32;
  private targetScale = 0.32;
  private zoomPivot: { x: number; y: number } | null = null;
  private focusTarget: { x: number; y: number } | null = null;
  private initialized = false;
  private fitted = false;
  private resizeObserver: ResizeObserver | undefined;
  private snapshot: WorldSnapshot | undefined;
  private nextSummaryAt = 0;
  private named = new Set<string>();

  async mount(host: HTMLElement): Promise<void> {
    const [sprites] = await Promise.all([
      loadSprites(),
      this.app.init({
        background: '#9dbd7e',
        resizeTo: host,
        antialias: true,
        autoDensity: true,
        roundPixels: true,
        resolution: Math.min(2, window.devicePixelRatio || 1),
      }),
    ]);
    this.sprites = sprites;
    host.appendChild(this.app.canvas);
    this.app.canvas.setAttribute('aria-label', 'Hundred world');
    this.world.sortableChildren = true;
    this.app.stage.addChild(this.world);
    this.app.stage.addChild(this.atmosphere.root);
    this.atmosphere.resize(host.clientWidth, host.clientHeight);
    this.world.scale.set(this.scale);
    this.world.position.set(24, 12);
    this.bindCamera();
    this.app.ticker.maxFPS = 30;
    this.app.ticker.add(() => this.tick());
    this.initialized = true;
    this.resizeObserver = new ResizeObserver(() => {
      this.app.resize();
      this.atmosphere.resize(host.clientWidth, host.clientHeight);
      if (this.snapshot && useUiStore.getState().cameraMode === 'town') {
        this.fitted = false;
        this.fitTown(this.snapshot);
      }
    });
    this.resizeObserver.observe(host);
  }

  applySnapshot(snapshot: WorldSnapshot): void {
    if (!this.initialized || !this.sprites) {
      return;
    }
    this.snapshot = snapshot;
    if (this.world.children.length === 0) {
      this.town = createTown(snapshot, useUiStore.getState().locale, this.sprites);
      this.lastLocale = useUiStore.getState().locale;
      this.world.addChild(this.town.root);
      this.fitTown(snapshot);
    }
    this.applyPatch(snapshot.npcs, snapshot.tick);
  }

  applyPatch(npcs: NpcPublic[], _tick: number): void {
    if (!this.town || !this.sprites) {
      return;
    }
    for (const npc of npcs) {
      this.records.set(npc.id, npc);
      let view = this.npcs.get(npc.id);
      if (!view) {
        view = new NpcView(npc.id, this.sprites[villagerSpriteName(npc.avatarSeed)]);
        view.root.on('pointertap', () => {
          useUiStore.getState().selectNpc(npc.id);
        });
        view.root.on('pointerover', () => useUiStore.getState().hoverNpc(npc.id));
        view.root.on('pointerout', () => useUiStore.getState().hoverNpc(null));
        this.npcs.set(npc.id, view);
        this.town.stage.addChild(view.root);
      }
    }
  }

  destroy(): void {
    if (!this.initialized) {
      return;
    }
    this.inputController.abort();
    this.resizeObserver?.disconnect();
    this.app.destroy(true, { children: true });
  }

  private tick(): void {
    const state = useUiStore.getState();
    const now = performance.now();
    if (state.cameraMode !== this.lastCameraMode) {
      if (state.cameraMode === 'town' && this.snapshot) {
        this.fitted = false;
        this.focusTarget = null;
        this.zoomPivot = null;
        this.fitTown(this.snapshot);
      }
      this.lastCameraMode = state.cameraMode;
    }
    if (state.cameraCommand && this.snapshot) {
      if (state.cameraCommand === 'reset') {
        this.fitted = false;
        this.fitTown(this.snapshot);
      } else {
        this.zoomPivot = { x: this.app.screen.width / 2, y: this.app.screen.height / 2 };
        this.targetScale = Math.min(
          2.4,
          Math.max(0.08, this.targetScale * (state.cameraCommand === 'in' ? 1.3 : 1 / 1.3)),
        );
      }
      state.setCameraCommand(null);
    }
    const minuteOfDay = state.snapshot?.minuteOfDay ?? 8 * 60;
    const hour = Math.floor(minuteOfDay / 60);
    const raining = state.snapshot?.weather === 'rain';
    const night = hour < 6 || hour >= 20;
    const festival = Boolean(state.snapshot?.festival);
    // Labels and attention ranking do not need to run at animation frequency.
    if (now >= this.nextSummaryAt) {
      this.nextSummaryAt = now + 250;
      const occupancy: Record<string, number> = {};
      for (const npc of this.records.values()) {
        occupancy[npc.locationId] = (occupancy[npc.locationId] ?? 0) + 1;
      }
      const occupancyKey = JSON.stringify(occupancy);
      if (this.town && (state.locale !== this.lastLocale || occupancyKey !== this.lastOccupancy)) {
        relabelTown(this.town, state.locale, occupancy);
        this.lastLocale = state.locale;
        this.lastOccupancy = occupancyKey;
      }
      this.named = new Set(
        pickInteresting([...this.records.values()], state.favorites).map((item) => item.id),
      );
      this.atmosphere.update(minuteOfDay, state.snapshot?.weather ?? 'clear', festival);
      state.setCameraView({
        x: this.world.x,
        y: this.world.y,
        scale: this.world.scale.x,
        width: this.app.screen.width,
        height: this.app.screen.height,
      });
    }
    if (state.cameraFocus) {
      this.focusTarget = state.cameraFocus;
      state.clearCameraFocus();
    }
    this.atmosphere.tick();
    this.easeTownCamera(state.cameraMode === 'town');
    if (this.town) {
      for (const label of this.town.labels) {
        label.text.scale.set(Math.min(4, Math.max(1, 0.8 / this.scale)));
      }
      this.nightAlpha += ((night ? 1 : 0) - this.nightAlpha) * 0.04;
      this.town.night.alpha = this.nightAlpha;
      this.town.festival.visible = festival;
    }
    const { strength } = tintAt(minuteOfDay);
    const dayColor = { r: 0x9d, g: 0xbd, b: 0x7e };
    const nightColor = { r: 0x2c, g: 0x38, b: 0x50 };
    const mix = Math.min(1, strength * 2 + (raining ? 0.25 : 0));
    const r = Math.round(dayColor.r + (nightColor.r - dayColor.r) * mix);
    const g = Math.round(dayColor.g + (nightColor.g - dayColor.g) * mix);
    const b = Math.round(dayColor.b + (nightColor.b - dayColor.b) * mix);
    this.app.renderer.background.color = (r << 16) | (g << 8) | b;
    const follow =
      state.cameraMode !== 'town' && state.followNpcId
        ? this.records.get(state.followNpcId)
        : undefined;
    const firstPerson = state.cameraMode === 'first' && Boolean(follow);
    for (const [id, view] of this.npcs) {
      const npc = this.records.get(id);
      if (!npc) {
        continue;
      }
      const position = npc.position;
      view.root.position.set(position.x, position.y);
      const near =
        firstPerson && follow
          ? Math.hypot(npc.position.x - follow.position.x, npc.position.y - follow.position.y) < 140
          : false;
      const selected = state.selectedNpcId === id;
      const hovered = state.hoveredNpcId === id;
      const followed = state.followNpcId === id;
      const named =
        this.named.has(id) || npc.action === 'steal' || npc.action === 'fight' || npc.hunger >= 85;
      const caption = shouldCaptionNpc(npc, named, selected, hovered, followed)
        ? actionLabel(state.locale, npc.action)
        : '';
      view.sync(
        npc,
        selected,
        hovered,
        followed,
        named,
        now,
        firstPerson && id === follow?.id,
        near && id !== follow?.id,
        caption,
        this.scale,
      );
    }
    this.steerCamera(follow, firstPerson);
  }

  private easeTownCamera(townMode: boolean): void {
    if (!townMode) {
      return;
    }
    if (Math.abs(this.targetScale - this.scale) > 0.0005) {
      const pivot = this.zoomPivot;
      const next = this.scale + (this.targetScale - this.scale) * 0.18;
      if (pivot) {
        const worldX = (pivot.x - this.world.x) / this.scale;
        const worldY = (pivot.y - this.world.y) / this.scale;
        this.world.x = pivot.x - worldX * next;
        this.world.y = pivot.y - worldY * next;
      }
      this.scale = next;
      this.world.scale.set(next);
    }
    if (this.focusTarget) {
      const viewW = this.app.screen.width;
      const viewH = this.app.screen.height;
      const targetX = viewW / 2 - this.focusTarget.x * this.scale;
      const targetY = viewH / 2 - this.focusTarget.y * this.scale;
      const dx = targetX - this.world.x;
      const dy = targetY - this.world.y;
      this.world.x += dx * 0.12;
      this.world.y += dy * 0.12;
      if (Math.hypot(dx, dy) < 2) {
        this.focusTarget = null;
      }
    }
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
    this.targetScale = this.scale;
    this.world.scale.set(this.scale);
    const look = first ? facingOf(follow) : { x: 0, y: 0 };
    const lookAhead = first ? 70 : 0;
    const focusX = view.root.x + look.x * lookAhead;
    const focusY = view.root.y + look.y * lookAhead;
    const anchorY = first ? this.app.screen.height * 0.72 : this.app.screen.height / 2;
    const targetX = this.app.screen.width / 2 - focusX * this.world.scale.x;
    const targetY = anchorY - focusY * this.world.scale.y;
    this.world.x += (targetX - this.world.x) * 0.1;
    this.world.y += (targetY - this.world.y) * 0.1;
  }

  private bindCamera(): void {
    const canvas = this.app.canvas;
    const signal = this.inputController.signal;
    canvas.addEventListener(
      'pointerdown',
      (event) => {
        if (event.button !== 0 || this.dragging) return;
        canvas.setPointerCapture(event.pointerId);
        this.dragging = true;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
      },
      { signal },
    );
    canvas.addEventListener(
      'lostpointercapture',
      () => {
        this.dragging = false;
      },
      { signal },
    );
    canvas.addEventListener(
      'pointermove',
      (event) => {
        if (!this.dragging || useUiStore.getState().cameraMode !== 'town') {
          return;
        }
        this.world.x += event.clientX - this.lastX;
        this.world.y += event.clientY - this.lastY;
        this.lastX = event.clientX;
        this.lastY = event.clientY;
      },
      { signal },
    );
    canvas.addEventListener(
      'wheel',
      (event) => {
        event.preventDefault();
        if (useUiStore.getState().cameraMode !== 'town') {
          return;
        }
        const rect = canvas.getBoundingClientRect();
        this.zoomPivot = { x: event.clientX - rect.left, y: event.clientY - rect.top };
        this.targetScale = Math.min(
          2.4,
          Math.max(0.18, this.targetScale * (event.deltaY > 0 ? 0.9 : 1.11)),
        );
      },
      { passive: false, signal },
    );
    canvas.addEventListener(
      'dblclick',
      () => {
        const hovered = useUiStore.getState().hoveredNpcId;
        if (hovered) {
          useUiStore.getState().followNpc(hovered);
          useUiStore.getState().setCameraMode('follow');
        }
      },
      { signal },
    );
  }

  private fitTown(snapshot: WorldSnapshot): void {
    if (this.fitted) {
      return;
    }
    const viewW = this.app.screen.width;
    const viewH = this.app.screen.height;
    const fit = Math.min(viewW / snapshot.bounds.width, viewH / snapshot.bounds.height) * 0.92;
    this.scale = Math.min(0.55, Math.max(0.05, fit));
    this.targetScale = this.scale;
    this.world.scale.set(this.scale);
    this.world.position.set(
      (viewW - snapshot.bounds.width * this.scale) / 2,
      (viewH - snapshot.bounds.height * this.scale) / 2,
    );
    this.fitted = true;
  }
}
