import { parseUsi, squareToUsi, type Role } from '@jev/shogi-engine';
import { useMemo, useState } from 'react';

import { createGame, playMove } from './api';
import { Board } from './Board';
import { t, type Locale } from './i18n';
import { Komadai } from './Komadai';
import type { GameView } from './types';

type Selection =
  | { kind: 'none' }
  | { kind: 'board'; from: number }
  | { kind: 'hand'; role: Role }
  | { kind: 'promote'; from: number; to: number };

const loadLocale = (): Locale => (localStorage.getItem('jev-lab-locale') === 'en' ? 'en' : 'ja');

const destOf = (usi: string): number | undefined => {
  try {
    return parseUsi(usi).to;
  } catch {
    return undefined;
  }
};

export const App = () => {
  const [locale, setLocale] = useState<Locale>(loadLocale);
  const [game, setGame] = useState<GameView | undefined>();
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(true);
  const [awaitingReply, setAwaitingReply] = useState(false);
  const [selection, setSelection] = useState<Selection>({ kind: 'none' });

  const start = async () => {
    setError(false);
    setBusy(true);
    setAwaitingReply(false);
    setSelection({ kind: 'none' });
    try {
      setGame(await createGame());
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  useState(() => {
    void createGame()
      .then((view) => {
        setGame(view);
        setError(false);
      })
      .catch(() => setError(true))
      .finally(() => setBusy(false));
    return true;
  });

  const setLang = (next: Locale) => {
    setLocale(next);
    localStorage.setItem('jev-lab-locale', next);
  };

  const targets = useMemo(() => {
    if (!game || selection.kind === 'none' || selection.kind === 'promote') {
      return new Set<number>();
    }
    const squares = new Set<number>();
    for (const usi of game.legal) {
      if (selection.kind === 'board') {
        const from = squareToUsi(selection.from);
        if (usi.startsWith(from)) {
          const to = destOf(usi);
          if (to !== undefined) {
            squares.add(to);
          }
        }
      } else {
        const prefix = `${selection.role.toUpperCase()}*`;
        if (usi.startsWith(prefix)) {
          const to = destOf(usi);
          if (to !== undefined) {
            squares.add(to);
          }
        }
      }
    }
    return squares;
  }, [game, selection]);

  const send = async (usi: string) => {
    if (!game) {
      return;
    }
    setBusy(true);
    setAwaitingReply(true);
    setSelection({ kind: 'none' });
    try {
      setGame(await playMove(game.id, usi));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
      setAwaitingReply(false);
    }
  };

  const onSquare = (index: number) => {
    if (!game || busy || game.mate || game.sideToMove !== 'sente') {
      return;
    }
    if (selection.kind === 'promote') {
      return;
    }
    if (selection.kind === 'hand') {
      if (!targets.has(index)) {
        setSelection({ kind: 'none' });
        return;
      }
      void send(`${selection.role.toUpperCase()}*${squareToUsi(index)}`);
      return;
    }
    if (selection.kind === 'board' && targets.has(index)) {
      const from = squareToUsi(selection.from);
      const to = squareToUsi(index);
      const options = game.legal.filter((usi) => usi === `${from}${to}` || usi === `${from}${to}+`);
      if (options.includes(`${from}${to}+`) && options.includes(`${from}${to}`)) {
        setSelection({ kind: 'promote', from: selection.from, to: index });
        return;
      }
      void send(options[0] ?? `${from}${to}`);
      return;
    }
    const piece = game.squares[index];
    if (piece?.side === 'sente') {
      setSelection({ kind: 'board', from: index });
      return;
    }
    setSelection({ kind: 'none' });
  };

  const status = (): string => {
    if (!game) {
      return '';
    }
    if (game.mate) {
      return game.sideToMove === 'gote' ? t(locale, 'mateWin') : t(locale, 'mateLose');
    }
    if (awaitingReply) {
      return game.provider === 'jev' ? t(locale, 'thinking') : t(locale, 'rulesThinking');
    }
    if (game.check) {
      return t(locale, 'check');
    }
    return t(locale, 'yourTurn');
  };

  return (
    <div className="page">
      <header className="topbar">
        <a className="labLink" href="http://127.0.0.1:5173">
          {t(locale, 'lab')}
        </a>
        <div>
          <h1>{t(locale, 'title')}</h1>
          <p>{t(locale, 'subtitle')}</p>
        </div>
        <div className="topActions">
          <span className={game?.provider === 'jev' ? 'badge jev' : 'badge'}>
            {game?.provider === 'jev' ? t(locale, 'providerJev') : t(locale, 'providerRules')}
          </span>
          <button type="button" onClick={() => void start()}>
            {t(locale, 'newGame')}
          </button>
          <label>
            {t(locale, 'language')}
            <select
              value={locale}
              onChange={(event) => setLang(event.target.value === 'en' ? 'en' : 'ja')}
              aria-label={t(locale, 'language')}
            >
              <option value="ja">{t(locale, 'languageJa')}</option>
              <option value="en">{t(locale, 'languageEn')}</option>
            </select>
          </label>
        </div>
      </header>

      {error ? (
        <main className="fallback">
          <p>{t(locale, 'error')}</p>
          <button type="button" onClick={() => void start()}>
            {t(locale, 'retry')}
          </button>
        </main>
      ) : !game ? (
        <main className="fallback">
          <p>{t(locale, 'loading')}</p>
        </main>
      ) : (
        <main className="table">
          <Komadai side="gote" hand={game.hands.gote} locale={locale} disabled />
          <section className="stage">
            <p
              className={`status ${game.mate ? 'mate' : game.check ? 'check' : ''} ${awaitingReply ? 'thinking' : ''}`}
            >
              {status()}
            </p>
            <Board
              game={game}
              {...(selection.kind === 'board' || selection.kind === 'promote'
                ? { selectedFrom: selection.from }
                : {})}
              {...(selection.kind === 'hand' ? { selectedDrop: selection.role } : {})}
              targets={targets}
              onSquare={onSquare}
              disabled={busy || game.mate}
            />
            <p className="hint">{t(locale, 'hint')}</p>
          </section>
          <Komadai
            side="sente"
            hand={game.hands.sente}
            locale={locale}
            {...(selection.kind === 'hand' ? { selected: selection.role } : {})}
            onSelect={(role) => setSelection({ kind: 'hand', role })}
            disabled={busy || game.mate || game.sideToMove !== 'sente'}
          />
          <aside className="kifu">
            <h2>{t(locale, 'kifu')}</h2>
            {game.history.length === 0 ? <p>{t(locale, 'waiting')}</p> : null}
            <ol>
              {game.history.map((move, index) => (
                <li
                  key={`${move.usi}-${index}`}
                  className={index === game.history.length - 1 ? 'latest' : ''}
                >
                  <span>{move.ja}</span>
                  {move.provider ? (
                    <em>
                      {move.provider === 'jev'
                        ? t(locale, 'providerJev')
                        : t(locale, 'providerRules')}
                    </em>
                  ) : null}
                </li>
              ))}
            </ol>
          </aside>
        </main>
      )}

      {selection.kind === 'promote' ? (
        <dialog className="modal" open aria-label={t(locale, 'promote')}>
          <div className="modalCard">
            <p>{t(locale, 'promote')}</p>
            <div>
              <button
                type="button"
                onClick={() =>
                  void send(`${squareToUsi(selection.from)}${squareToUsi(selection.to)}+`)
                }
              >
                {t(locale, 'promoteYes')}
              </button>
              <button
                type="button"
                onClick={() =>
                  void send(`${squareToUsi(selection.from)}${squareToUsi(selection.to)}`)
                }
              >
                {t(locale, 'promoteNo')}
              </button>
            </div>
          </div>
        </dialog>
      ) : null}
    </div>
  );
};
