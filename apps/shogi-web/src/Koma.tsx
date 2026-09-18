import { useId } from 'react';

import { isPromoted, kanjiOf } from './glyphs';

interface KomaProps {
  role: string;
  side: 'sente' | 'gote';
  selected?: boolean;
  last?: boolean;
}

export const Koma = ({ role, side, selected = false, last = false }: KomaProps) => {
  const id = useId().replaceAll(':', '');
  const kanji = kanjiOf(role, side);
  const promoted = isPromoted(role);
  const className = [
    'koma',
    side === 'gote' ? 'komaGote' : '',
    selected ? 'komaSelected' : '',
    last ? 'komaLast' : '',
    promoted ? 'komaPromoted' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <svg className={className} viewBox="0 0 44 56" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f7e7c3" />
          <stop offset="42%" stopColor="#e8c98a" />
          <stop offset="100%" stopColor="#c7924a" />
        </linearGradient>
        <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fff6df" />
          <stop offset="100%" stopColor="#8a5a28" />
        </linearGradient>
      </defs>
      <path
        d="M22 3.2 L40.6 13.4 L37.8 52.6 L6.2 52.6 L3.4 13.4 Z"
        fill={`url(#${id}-face)`}
        stroke={`url(#${id}-edge)`}
        strokeWidth="1.4"
      />
      <path
        d="M22 6 L37 14.5 L34.8 49.6 L9.2 49.6 L7 14.5 Z"
        fill="none"
        stroke="rgba(90,50,16,0.18)"
      />
      <text
        x="22"
        y={kanji.length > 1 ? 33 : 36}
        textAnchor="middle"
        className={promoted ? 'komaKanjiPromo' : 'komaKanji'}
      >
        {kanji}
      </text>
    </svg>
  );
};
