import { actionLabel, jobLabel, t } from '../../i18n';
import type { SimulationSocket } from '../../net/socket';
import { useUiStore } from '../../stores/ui-store';
import { GodPanel } from './GodPanel';

import styles from './WorldHud.module.css';

interface Props {
  socket: SimulationSocket | undefined;
}

export const WorldHud = ({ socket }: Props) => {
  const snapshot = useUiStore((state) => state.snapshot);
  const hovered = useUiStore((state) => state.hoveredNpcId);
  const hoverNpc = useUiStore((state) => (hovered ? state.people[hovered] : undefined));
  const locale = useUiStore((state) => state.locale);
  if (!snapshot) {
    return null;
  }
  let atmosphere = t(locale, 'hud.weatherClear');
  if (snapshot.festival) {
    atmosphere = t(locale, 'hud.festival');
  } else if (snapshot.weather === 'rain') {
    atmosphere = t(locale, 'hud.weatherRain');
  }
  return (
    <>
      <div className={styles.left}>
        <aside className={styles.card} aria-label={t(locale, 'hud.worldStats')}>
          <div className={styles.row}>
            {t(locale, 'hud.population')} <strong>{snapshot.population}</strong>
          </div>
          <div className={styles.row}>
            {t(locale, 'hud.food')} <strong>{snapshot.food}</strong>
          </div>
          <div className={styles.row}>
            {t(locale, 'hud.wealth')} <strong>${snapshot.averageWealth}</strong>
          </div>
          <div className={styles.row}>
            {t(locale, 'hud.unemployed')} <strong>{snapshot.unemployed}</strong>
          </div>
          <div className={styles.row}>
            {t(locale, 'hud.incidents')} <strong>{snapshot.incidentsToday}</strong>
          </div>
          <div className={styles.row}>
            {t(locale, 'hud.helps')} <strong>{snapshot.helpsToday}</strong>
          </div>
          <div className={styles.row}>
            {t(locale, 'hud.fights')} <strong>{snapshot.fightsToday}</strong>
          </div>
          <div className={styles.row}>
            {t(locale, 'hud.shop')}{' '}
            <strong>
              {snapshot.shopOpen ? t(locale, 'hud.shopOpen') : t(locale, 'hud.shopClosed')}
            </strong>
          </div>
          <div className={styles.row} data-testid="world-atmosphere">
            {atmosphere}
          </div>
        </aside>
        <GodPanel socket={socket} />
      </div>
      {hoverNpc ? (
        <div className={styles.hover}>
          <strong>{hoverNpc.name}</strong>
          <div>
            {jobLabel(locale, hoverNpc.job)} · {actionLabel(locale, hoverNpc.action)}
            <br />
            {t(locale, 'inspector.hunger')} {hoverNpc.hunger} · {t(locale, 'inspector.money')} $
            {hoverNpc.money}
          </div>
        </div>
      ) : null}
    </>
  );
};
