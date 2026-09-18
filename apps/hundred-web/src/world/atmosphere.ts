import { Container, Graphics } from 'pixi.js';

interface TintKeyframe {
  hour: number;
  color: number;
  strength: number;
}

// Soft multiply tint over the world so time of day reads as continuous light.
const TINT_KEYS: TintKeyframe[] = [
  { hour: 0, color: 0x2e3c66, strength: 0.5 },
  { hour: 4.5, color: 0x2e3c66, strength: 0.5 },
  { hour: 6, color: 0xd8a06a, strength: 0.22 },
  { hour: 8, color: 0xffffff, strength: 0 },
  { hour: 16.5, color: 0xffffff, strength: 0 },
  { hour: 18.5, color: 0xf0a05e, strength: 0.24 },
  { hour: 20, color: 0x54628e, strength: 0.38 },
  { hour: 21.5, color: 0x2e3c66, strength: 0.5 },
  { hour: 24, color: 0x2e3c66, strength: 0.5 },
];

const lerpColor = (from: number, to: number, t: number): number => {
  const fr = (from >> 16) & 0xff;
  const fg = (from >> 8) & 0xff;
  const fb = from & 0xff;
  const tr = (to >> 16) & 0xff;
  const tg = (to >> 8) & 0xff;
  const tb = to & 0xff;
  const r = Math.round(fr + (tr - fr) * t);
  const g = Math.round(fg + (tg - fg) * t);
  const b = Math.round(fb + (tb - fb) * t);
  return (r << 16) | (g << 8) | b;
};

export const tintAt = (minuteOfDay: number): { color: number; strength: number } => {
  const hour = minuteOfDay / 60;
  for (let index = 0; index < TINT_KEYS.length - 1; index += 1) {
    const current = TINT_KEYS[index]!;
    const next = TINT_KEYS[index + 1]!;
    if (hour >= current.hour && hour <= next.hour) {
      const span = next.hour - current.hour;
      const t = span <= 0 ? 0 : (hour - current.hour) / span;
      return {
        color: lerpColor(current.color, next.color, t),
        strength: current.strength + (next.strength - current.strength) * t,
      };
    }
  }
  return { color: 0x2e3c66, strength: 0.5 };
};

const RAIN_DROPS = 130;

interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

export class AtmosphereLayer {
  readonly root = new Container();
  private readonly tint = new Graphics();
  private readonly rain = new Graphics();
  private readonly glow = new Graphics();
  private readonly drops: RainDrop[] = [];
  private width = 1;
  private height = 1;
  private raining = false;
  private seed = 20260917;

  constructor() {
    this.root.eventMode = 'none';
    this.tint.eventMode = 'none';
    this.rain.eventMode = 'none';
    this.glow.eventMode = 'none';
    this.tint.blendMode = 'multiply';
    this.glow.blendMode = 'add';
    this.root.addChild(this.tint, this.glow, this.rain);
    for (let index = 0; index < RAIN_DROPS; index += 1) {
      this.drops.push({
        x: this.next() * 2000,
        y: this.next() * 1200,
        speed: 9 + this.next() * 7,
        length: 10 + this.next() * 10,
      });
    }
  }

  private next(): number {
    this.seed = Math.imul(this.seed ^ (this.seed >>> 15), 2246822519) >>> 0;
    return (this.seed >>> 0) / 4294967296;
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);
  }

  update(minuteOfDay: number, weather: string, festival: boolean): void {
    const { color, strength } = tintAt(minuteOfDay);
    const rainStrength = weather === 'rain' ? 0.18 : 0;
    this.tint.clear();
    if (strength > 0.01 || rainStrength > 0) {
      const combined = Math.min(0.72, strength + rainStrength);
      const tintColor = weather === 'rain' ? lerpColor(color, 0x5d6d7a, 0.45) : color;
      this.tint.rect(0, 0, this.width, this.height).fill({ color: tintColor, alpha: combined });
    }
    this.glow.clear();
    if (festival) {
      this.glow
        .ellipse(this.width / 2, this.height / 2, this.width * 0.6, this.height * 0.55)
        .fill({ color: 0xffb85e, alpha: 0.07 });
    }
    this.raining = weather === 'rain';
    if (!this.raining) {
      this.rain.clear();
    }
  }

  tick(): void {
    if (!this.raining) {
      return;
    }
    this.rain.clear();
    for (const drop of this.drops) {
      drop.y += drop.speed;
      drop.x -= drop.speed * 0.18;
      if (drop.y > this.height + 20) {
        drop.y = -20;
        drop.x = this.next() * (this.width + 200);
      }
      if (drop.x < -20) {
        drop.x = this.width + 10;
      }
      this.rain
        .moveTo(drop.x, drop.y)
        .lineTo(drop.x - drop.length * 0.18, drop.y + drop.length)
        .stroke({ width: 1.4, color: 0xdfeaf2, alpha: 0.4 });
    }
  }
}
