import type { NpcPublic } from '@hundred/protocol';
import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';

import { facingOf } from './camera';

const SPRITE_HEIGHT = 72;

const bubbleFor = (npc: NpcPublic): string => {
  if (npc.action === 'steal' || npc.action === 'fight') {
    return '!';
  }
  if (npc.action === 'help' || npc.action === 'ask_for_help') {
    return '+';
  }
  if (npc.action === 'talk' || npc.action === 'visit') {
    return '…';
  }
  if (npc.action === 'sleep') {
    return 'z';
  }
  if (npc.hunger >= 85) {
    return '!';
  }
  return '';
};

export class NpcView {
  readonly id: string;
  readonly root = new Container();
  private readonly sprite: Sprite;
  private readonly shadow = new Graphics();
  private readonly ring = new Graphics();
  private readonly balloon = new Graphics();
  private readonly label = new Text({
    text: '',
    style: {
      fontFamily: '"M PLUS Rounded 1c", "Zen Maru Gothic", ui-rounded, sans-serif',
      fontSize: 11,
      fill: 0x2f3627,
      fontWeight: '700',
      stroke: { color: 0xeef0dc, width: 3, join: 'round' },
    },
  });
  private readonly bubble = new Text({
    text: '',
    style: {
      fontFamily: '"M PLUS Rounded 1c", ui-rounded, sans-serif',
      fontSize: 13,
      fill: 0x7a2018,
      fontWeight: '800',
    },
  });
  private walk = 0;
  private facing = 1;

  constructor(id: string, texture: Texture) {
    this.id = id;
    this.sprite = new Sprite(texture);
    this.sprite.anchor.set(0.5, 1);
    const scale = SPRITE_HEIGHT / texture.height;
    this.sprite.scale.set(scale);
    this.sprite.position.set(0, 30);
    this.shadow.ellipse(2, 28, 13, 4.5).fill({ color: 0x1c2a14, alpha: 0.25 });
    this.root.eventMode = 'static';
    this.root.cursor = 'pointer';
    this.label.anchor.set(0.5, 1);
    this.bubble.anchor.set(0.5, 0.5);
    this.root.addChild(this.shadow, this.ring, this.sprite, this.balloon, this.label, this.bubble);
  }

  sync(
    npc: NpcPublic,
    selected: boolean,
    hovered: boolean,
    followed: boolean,
    named: boolean,
    time: number,
    hidden: boolean,
    firstPersonNear: boolean,
  ): void {
    this.root.visible = !hidden;
    this.root.scale.set(firstPersonNear ? 1.55 : 1.25);
    const moving = Boolean(npc.movement) || npc.phase === 'moving';
    if (moving) {
      this.walk += 0.22;
      const facing = facingOf(npc);
      if (Math.abs(facing.x) > 0.25) {
        this.facing = facing.x >= 0 ? 1 : -1;
      }
    }
    const bob = moving
      ? Math.abs(Math.sin(this.walk)) * -3
      : Math.sin(time / 460 + this.root.x) * 0.8;
    const sway = moving ? Math.sin(this.walk) * 0.05 : 0;
    const baseScale = SPRITE_HEIGHT / this.sprite.texture.height;
    this.sprite.scale.set(baseScale * this.facing, baseScale);
    this.sprite.y = 30 + bob;
    this.sprite.rotation = sway;
    this.shadow.scale.set(moving ? 1 - Math.abs(bob) * 0.04 : 1, 1);

    this.ring.clear();
    if (selected || hovered || followed) {
      this.ring.ellipse(0, 28, 17, 6.5).stroke({
        width: followed ? 3 : 2,
        color: followed ? 0xe88ba0 : selected ? 0xe8b45e : 0xf5f0e0,
        alpha: 0.95,
      });
    }

    this.balloon.clear();
    const mark = bubbleFor(npc);
    this.bubble.text = mark;
    this.bubble.visible = Boolean(mark);
    this.bubble.y = -46 + bob;
    if (mark) {
      this.balloon.roundRect(-11, -56 + bob, 22, 17, 8).fill(0xfffaf0);
      this.balloon
        .moveTo(-3, -39 + bob)
        .lineTo(0, -35 + bob)
        .lineTo(3, -39 + bob)
        .fill(0xfffaf0);
    }
    this.label.text = npc.name.split(' ')[0] ?? npc.name;
    this.label.visible = named || selected || hovered || followed || firstPersonNear;
    this.label.y = mark ? -60 + bob : -40 + bob;
    this.root.zIndex = npc.position.y;
  }
}
