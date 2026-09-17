import { t } from '../../i18n';
import type { SimulationSocket } from '../../net/socket';
import { useUiStore } from '../../stores/ui-store';

import styles from './WorldHud.module.css';

interface Props {
  socket: SimulationSocket | undefined;
}

export const GodPanel = ({ socket }: Props) => {
  const locale = useUiStore((state) => state.locale);
  const act = (intent: 'add_food' | 'starve' | 'rain' | 'festival' | 'close_market') => {
    socket?.send({
      type: 'god.act',
      intent,
    });
  };
  return (
    <aside className={styles.god} aria-label={t(locale, 'god.title')} data-testid="god-panel">
      <h2>{t(locale, 'god.title')}</h2>
      <p>{t(locale, 'god.hint')}</p>
      <div className={styles.godGrid}>
        <button type="button" data-testid="god-add-food" onClick={() => act('add_food')}>
          {t(locale, 'god.addFood')}
        </button>
        <button type="button" data-testid="god-starve" onClick={() => act('starve')}>
          {t(locale, 'god.starve')}
        </button>
        <button type="button" data-testid="god-rain" onClick={() => act('rain')}>
          {t(locale, 'god.rain')}
        </button>
        <button type="button" data-testid="god-festival" onClick={() => act('festival')}>
          {t(locale, 'god.festival')}
        </button>
        <button type="button" data-testid="god-close-market" onClick={() => act('close_market')}>
          {t(locale, 'god.closeMarket')}
        </button>
      </div>
    </aside>
  );
};
