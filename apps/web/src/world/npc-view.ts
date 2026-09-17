import {
  appearanceFromSeed,
  hairColor,
  outfitColor,
  skinColor,
  type AvatarExpression,
} from '@hundred/avatar';
import type { NpcPublic } from '@hundred/protocol';
import { Container, Graphics, Text } from 'pixi.js';

const toColor = (hex: string): number => Number.parseInt(hex.slice(1), 16);

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
  readonly body = new Graphics();
  readonly face = new Graphics();
  readonly ring = new Graphics();
  readonly balloon = new Graphics();
  readonly label = new Text({
    text: '',
    style: {
      fontFamily: '"M PLUS Rounded 1c", "Zen Maru Gothic", ui-rounded, sans-serif',
      fontSize: 11,
      fill: 0x4a3228,
      fontWeight: '700',
    },
  });
  readonly bubble = new Text({
    text: '',
    style: {
      fontFamily: '"M PLUS Rounded 1c", ui-rounded, sans-serif',
      fontSize: 13,
      fill: 0x7a2018,
      fontWeight: '800',
    },
  });
  private walk = 0;
  private blink = 0;

  constructor(id: string) {
    this.id = id;
    this.root.eventMode = 'static';
    this.root.cursor = 'pointer';
    this.label.anchor.set(0.5, 1);
    this.bubble.anchor.set(0.5, 0.5);
    this.root.addChild(this.ring, this.body, this.face, this.balloon, this.label, this.bubble);
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
      this.walk += 0.2;
    }
    this.blink += 0.02;
    const bob = moving ? Math.sin(this.walk) * 1.8 : Math.sin(time / 420 + this.root.x) * 0.6;
    this.body.clear();
    this.face.clear();
    this.ring.clear();
    this.balloon.clear();
    const appearance = appearanceFromSeed(npc.avatarSeed);
    const skin = toColor(skinColor(appearance));
    const hair = toColor(hairColor(appearance));
    const cloth = toColor(outfitColor(appearance));
    this.body.ellipse(0, 28, 11, 4).fill({ color: 0x3a2a18, alpha: 0.2 });
    const legSwing = moving ? Math.sin(this.walk) * 6 : 0;
    this.body.roundRect(-8, 8 + bob, 5, 16, 2).fill(cloth);
    this.body.roundRect(3, 8 + bob, 5, 16, 2).fill(cloth);
    this.body.roundRect(-9 - legSwing * 0.15, 20 + bob, 6, 8, 2).fill(0x5a4034);
    this.body.roundRect(3 + legSwing * 0.15, 20 + bob, 6, 8, 2).fill(0x5a4034);
    this.body.roundRect(-11, -4 + bob, 22, 22, 8).fill(cloth);
    this.body.circle(0, -16 + bob, 13).fill(skin);
    this.body.ellipse(0, -24 + bob, 14, 8).fill(hair);
    if (appearance.hairStyle % 2 === 0) {
      this.body.ellipse(-11, -16 + bob, 4, 8).fill(hair);
      this.body.ellipse(11, -16 + bob, 4, 8).fill(hair);
    } else {
      this.body.roundRect(-6, -30 + bob, 12, 6, 3).fill(hair);
    }
    const eyesClosed = Math.sin(this.blink) > 0.96;
    this.drawFace(npc.expression, bob, eyesClosed, npc.action === 'talk');
    if (selected || hovered || followed) {
      this.ring.ellipse(0, 28, 16, 6).stroke({
        width: followed ? 3 : 2,
        color: followed ? 0xf29bb0 : selected ? 0xf2c56b : 0xfff6e8,
        alpha: 0.95,
      });
    }
    const mark = bubbleFor(npc);
    this.bubble.text = mark;
    this.bubble.visible = Boolean(mark);
    this.bubble.y = -42 + bob;
    if (mark) {
      this.balloon.roundRect(-10, -52 + bob, 20, 16, 8).fill(0xfff6e8);
      this.balloon
        .moveTo(-3, -36 + bob)
        .lineTo(0, -32 + bob)
        .lineTo(3, -36 + bob)
        .fill(0xfff6e8);
    }
    this.label.text = npc.name.split(' ')[0] ?? npc.name;
    this.label.visible = named || selected || hovered || followed || firstPersonNear;
    this.label.y = mark ? -56 + bob : -36 + bob;
    this.root.zIndex = npc.position.y;
  }

  private drawFace(
    expression: AvatarExpression,
    bob: number,
    closed: boolean,
    talking: boolean,
  ): void {
    const y = -17 + bob;
    if (closed || expression === 'tired') {
      this.face.moveTo(-5, y).lineTo(-2, y).stroke({ width: 1.6, color: 0x3a241c });
      this.face.moveTo(2, y).lineTo(5, y).stroke({ width: 1.6, color: 0x3a241c });
    } else {
      const height = expression === 'surprised' ? 3 : 2.1;
      this.face.ellipse(-4, y, 2, height).fill(0x3a241c);
      this.face.ellipse(4, y, 2, height).fill(0x3a241c);
      this.face.circle(-3.2, y - 0.6, 0.7).fill(0xfff6e8);
      this.face.circle(4.8, y - 0.6, 0.7).fill(0xfff6e8);
    }
    if (expression === 'angry') {
      this.face
        .moveTo(-7, y - 5)
        .lineTo(-1, y - 2)
        .stroke({ width: 1.6, color: 0x3a241c });
      this.face
        .moveTo(7, y - 5)
        .lineTo(1, y - 2)
        .stroke({ width: 1.6, color: 0x3a241c });
    }
    const mouthY = y + 6;
    if (talking) {
      this.face.ellipse(0, mouthY, 2.4, 2).fill(0xc97878);
    } else if (expression === 'happy') {
      this.face
        .moveTo(-4, mouthY)
        .quadraticCurveTo(0, mouthY + 4, 4, mouthY)
        .stroke({ width: 1.6, color: 0xc97878 });
    } else if (expression === 'sad') {
      this.face
        .moveTo(-4, mouthY + 2)
        .quadraticCurveTo(0, mouthY - 2, 4, mouthY + 2)
        .stroke({ width: 1.6, color: 0xc97878 });
    } else {
      this.face.ellipse(0, mouthY, 2.2, 1.1).fill(0xc97878);
    }
  }
}
