import { Eye, Map, Pause, Play, UserRound } from 'lucide-react';

import { formatClockLabel, jobLabel, t } from '../../i18n';
import type { SimulationSocket } from '../../net/socket';
import { useUiStore } from '../../stores/ui-store';

import styles from './TopBar.module.css';

interface Props {
  socket: SimulationSocket | undefined;
}

export const TopBar = ({ socket }: Props) => {
  const snapshot = useUiStore((state) => state.snapshot);
  const locale = useUiStore((state) => state.locale);
  const setLocale = useUiStore((state) => state.setLocale);
  const query = useUiStore((state) => state.query);
  const setQuery = useUiStore((state) => state.setQuery);
  const selectNpc = useUiStore((state) => state.selectNpc);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const setCameraMode = useUiStore((state) => state.setCameraMode);
  if (!snapshot) {
    return (
      <header className={styles.bar}>
        <div className={styles.brand}>
          <strong>Hundred</strong>
        </div>
      </header>
    );
  }
  const matches = query.trim()
    ? snapshot.npcs
        .filter((npc) => npc.name.toLowerCase().includes(query.trim().toLowerCase()))
        .slice(0, 8)
    : [];
  const providerLabel =
    snapshot.provider === 'jev'
      ? t(locale, 'app.providerJev')
      : snapshot.provider === 'replay'
        ? t(locale, 'app.providerReplay')
        : t(locale, 'app.providerRules');
  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <strong>Hundred</strong>
        <span className={styles.clock}>
          {formatClockLabel(locale, snapshot.day, snapshot.minuteOfDay)}
        </span>
        <span className={styles.seed}>{t(locale, 'app.seed', { seed: snapshot.seed })}</span>
      </div>
      <div className={styles.controls}>
        <div className={styles.search}>
          <input
            value={query}
            placeholder={t(locale, 'app.search')}
            aria-label={t(locale, 'app.search')}
            data-testid="npc-search"
            onChange={(event) => setQuery(event.target.value)}
          />
          {matches.length > 0 ? (
            <ul className={styles.results}>
              {matches.map((npc) => (
                <li key={npc.id}>
                  <button
                    type="button"
                    onClick={() => {
                      selectNpc(npc.id);
                      setQuery('');
                    }}
                  >
                    {npc.name}
                    <span>
                      {jobLabel(locale, npc.job)} · {npc.age}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <fieldset className={styles.locale}>
          <legend className={styles.legend}>{t(locale, 'app.cameraTown')}</legend>
          <button
            type="button"
            data-active={cameraMode === 'town'}
            data-testid="camera-town"
            aria-label={t(locale, 'app.cameraTown')}
            onClick={() => setCameraMode('town')}
          >
            <Map size={14} />
          </button>
          <button
            type="button"
            data-active={cameraMode === 'follow'}
            data-testid="camera-follow"
            aria-label={t(locale, 'app.cameraFollow')}
            onClick={() => setCameraMode('follow')}
          >
            <UserRound size={14} />
          </button>
          <button
            type="button"
            data-active={cameraMode === 'first'}
            data-testid="camera-first"
            aria-label={t(locale, 'app.cameraFirst')}
            onClick={() => setCameraMode('first')}
          >
            <Eye size={14} />
          </button>
        </fieldset>
        <fieldset className={styles.locale}>
          <legend className={styles.legend}>{t(locale, 'app.language')}</legend>
          <button
            type="button"
            data-active={locale === 'ja'}
            data-testid="locale-ja"
            aria-label={t(locale, 'app.languageJa')}
            onClick={() => setLocale('ja')}
          >
            JA
          </button>
          <button
            type="button"
            data-active={locale === 'en'}
            data-testid="locale-en"
            aria-label={t(locale, 'app.languageEn')}
            onClick={() => setLocale('en')}
          >
            EN
          </button>
        </fieldset>
        <span className={styles.provider} data-testid="provider-indicator">
          <span className={snapshot.provider === 'jev' ? styles.dot : styles.dotMuted} />
          {providerLabel}
        </span>
        <button
          type="button"
          className={styles.iconButton}
          data-testid="pause-toggle"
          aria-label={
            snapshot.status === 'paused' ? t(locale, 'app.resume') : t(locale, 'app.pause')
          }
          onClick={() =>
            socket?.send({
              type: snapshot.status === 'paused' ? 'simulation.resume' : 'simulation.pause',
            })
          }
        >
          {snapshot.status === 'paused' ? <Play size={16} /> : <Pause size={16} />}
        </button>
        {([1, 2, 4] as const).map((speed) => (
          <button
            key={speed}
            type="button"
            className={styles.speed}
            data-active={snapshot.speed === speed}
            aria-label={t(locale, 'app.speed', { speed })}
            onClick={() => socket?.send({ type: 'simulation.setSpeed', speed })}
          >
            {speed}×
          </button>
        ))}
        {snapshot.recording ? (
          <span className={styles.rec}>{t(locale, 'app.recording')} ●</span>
        ) : null}
      </div>
    </header>
  );
};
