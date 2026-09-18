import type { Role } from '@jev/shogi-engine';

import { HAND_ORDER, roleLabel } from './glyphs';
import { t, type Locale } from './i18n';
import { Koma } from './Koma';

interface KomadaiProps {
  side: 'sente' | 'gote';
  hand: Record<string, number>;
  locale: Locale;
  selected?: Role;
  onSelect?: (role: Role) => void;
  disabled?: boolean;
}

export const Komadai = ({ side, hand, locale, selected, onSelect, disabled }: KomadaiProps) => {
  const pieces = HAND_ORDER.flatMap((role) =>
    Array.from({ length: hand[role] ?? 0 }, (_, index) => ({ role, index })),
  );
  const interactive = side === 'sente' && Boolean(onSelect) && !disabled;

  return (
    <section
      className={`komadai komadai-${side}`}
      aria-label={`${t(locale, side === 'sente' ? 'you' : 'jev')} ${t(locale, 'hand')}`}
    >
      <header>
        <strong>{side === 'sente' ? t(locale, 'you') : t(locale, 'jev')}</strong>
        <span>{t(locale, 'hand')}</span>
      </header>
      {pieces.length === 0 ? (
        <p className="emptyHand">{t(locale, 'emptyHand')}</p>
      ) : (
        <ul>
          {HAND_ORDER.map((role) => {
            const count = hand[role] ?? 0;
            if (count === 0) {
              return null;
            }
            return (
              <li key={role}>
                <button
                  type="button"
                  className={selected === role ? 'handPiece selected' : 'handPiece'}
                  disabled={!interactive}
                  onClick={() => onSelect?.(role)}
                  aria-label={`${roleLabel(role)} ×${count}`}
                >
                  <Koma role={role} side={side} selected={selected === role} />
                  {count > 1 ? <em>{count}</em> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
