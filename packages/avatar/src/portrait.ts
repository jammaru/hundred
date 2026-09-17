import {
  appearanceFromSeed,
  hairColor,
  outfitColor,
  skinColor,
  type AvatarAppearance,
  type AvatarExpression,
} from './appearance';

const mouthPath = (expression: AvatarExpression, cx: number): string => {
  if (expression === 'happy') return `M ${cx - 5} 27 Q ${cx} 33 ${cx + 5} 27`;
  if (expression === 'sad') return `M ${cx - 5} 31 Q ${cx} 26 ${cx + 5} 31`;
  if (expression === 'angry') return `M ${cx - 5} 30 L ${cx + 5} 28`;
  if (expression === 'afraid') return `M ${cx - 2} 27 Q ${cx} 34 ${cx + 2} 27`;
  if (expression === 'surprised') return `M ${cx} 29 m -2 0 a 2 2 0 1 0 4 0 a 2 2 0 1 0 -4 0`;
  if (expression === 'tired') return `M ${cx - 4} 29 L ${cx + 4} 29`;
  return `M ${cx - 4} 29 Q ${cx} 31 ${cx + 4} 29`;
};

export const portraitSvg = (
  seed: string,
  expression: AvatarExpression = 'neutral',
  size = 128,
): string => {
  const appearance = appearanceFromSeed(seed);
  return renderPortrait(appearance, expression, size);
};

export const renderPortrait = (
  appearance: AvatarAppearance,
  expression: AvatarExpression,
  size: number,
): string => {
  const skin = skinColor(appearance);
  const hair = hairColor(appearance);
  const cloth = outfitColor(appearance);
  const cx = 32;
  const headRx = 12 + appearance.headShape;
  const eyeY = expression === 'tired' ? 23 : 22;
  const eyeOpen = expression === 'tired' ? 1.2 : 2.2;
  const leftBrow =
    expression === 'angry'
      ? `M 22 17 L 28 19`
      : expression === 'surprised'
        ? `M 22 16 L 28 16`
        : `M 22 18 Q 25 16 28 18`;
  const rightBrow =
    expression === 'angry'
      ? `M 36 19 L 42 17`
      : expression === 'surprised'
        ? `M 36 16 L 42 16`
        : `M 36 18 Q 39 16 42 18`;
  const accessory =
    appearance.accessory === 1
      ? `<circle cx="32" cy="14" r="3" fill="${hair}" />`
      : appearance.accessory === 2
        ? `<rect x="18" y="20" width="28" height="3" rx="1" fill="#2c241c" opacity="0.55" />`
        : appearance.accessory === 3
          ? `<circle cx="20" cy="24" r="1.6" fill="#d8b15a" />`
          : '';
  const hairTop =
    appearance.hairStyle % 3 === 0
      ? `<ellipse cx="32" cy="16" rx="${headRx + 2}" ry="8" fill="${hair}" />`
      : appearance.hairStyle % 3 === 1
        ? `<path d="M ${32 - headRx} 20 Q 32 4 ${32 + headRx} 20" fill="${hair}" />`
        : `<path d="M ${32 - headRx} 22 L 18 10 L 32 16 L 46 10 L ${32 + headRx} 22" fill="${hair}" />`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80" width="${size}" height="${Math.round(size * 1.25)}" aria-hidden="true">
  <ellipse cx="32" cy="76" rx="12" ry="3" fill="rgba(40,30,20,0.18)" />
  <path d="M 24 58 L 20 76 L 26 76 L 30 60 Z" fill="${cloth}" />
  <path d="M 40 58 L 38 76 L 44 76 L 40 58 Z" fill="${cloth}" />
  <rect x="${26 - appearance.body}" y="42" width="${12 + appearance.body * 2}" height="20" rx="6" fill="${cloth}" />
  <circle cx="32" cy="24" r="${headRx}" fill="${skin}" />
  ${hairTop}
  <path d="${leftBrow}" stroke="#2a2118" stroke-width="1.4" fill="none" />
  <path d="${rightBrow}" stroke="#2a2118" stroke-width="1.4" fill="none" />
  <ellipse cx="25" cy="${eyeY}" rx="2.1" ry="${eyeOpen}" fill="#1d1712" />
  <ellipse cx="39" cy="${eyeY}" rx="2.1" ry="${eyeOpen}" fill="#1d1712" />
  <path d="${mouthPath(expression, cx)}" stroke="#7a4336" stroke-width="1.6" fill="none" stroke-linecap="round" />
  ${accessory}
</svg>`;
};
