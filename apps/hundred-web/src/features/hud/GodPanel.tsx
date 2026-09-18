import { CloudRain, PartyPopper, Sparkles, Store, Wheat, WheatOff } from 'lucide-react';

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
    <details className={styles.god} aria-label={t(locale, 'god.title')} data-testid="god-panel">
      <summary aria-label={t(locale, 'god.title')}>
        <Sparkles size={20} aria-hidden="true" />
      </summary>
      <div className={styles.godPopover}>
        <h2>{t(locale, 'god.title')}</h2>
        <p>{t(locale, 'god.hint')}</p>
        <div className={styles.godGrid}>
          <button type="button" data-testid="god-add-food" onClick={() => act('add_food')}>
            <Wheat size={14} aria-hidden="true" />
            {t(locale, 'god.addFood')}
          </button>
          <button type="button" data-testid="god-starve" onClick={() => act('starve')}>
            <WheatOff size={14} aria-hidden="true" />
            {t(locale, 'god.starve')}
          </button>
          <button type="button" data-testid="god-rain" onClick={() => act('rain')}>
            <CloudRain size={14} aria-hidden="true" />
            {t(locale, 'god.rain')}
          </button>
          <button type="button" data-testid="god-festival" onClick={() => act('festival')}>
            <PartyPopper size={14} aria-hidden="true" />
            {t(locale, 'god.festival')}
          </button>
          <button type="button" data-testid="god-close-market" onClick={() => act('close_market')}>
            <Store size={14} aria-hidden="true" />
            {t(locale, 'god.closeMarket')}
          </button>
        </div>
      </div>
    </details>
  );
};
