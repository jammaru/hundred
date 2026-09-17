import { Maximize, Minus, Plus } from 'lucide-react';

import { actionLabel, jobLabel, t } from '../../i18n';
import { useUiStore } from '../../stores/ui-store';

import styles from './WorldHud.module.css';

export const WorldHud = () => {
  const hovered = useUiStore((state) => state.hoveredNpcId);
  const hoverNpc = useUiStore((state) => (hovered ? state.people[hovered] : undefined));
  const locale = useUiStore((state) => state.locale);
  const command = useUiStore((state) => state.setCameraCommand);
  return (
    <>
      <div className={styles.cameraTools}>
        <button
          type="button"
          aria-label={t(locale, 'camera.zoomIn')}
          title={t(locale, 'camera.zoomIn')}
          onClick={() => command('in')}
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          aria-label={t(locale, 'camera.zoomOut')}
          title={t(locale, 'camera.zoomOut')}
          onClick={() => command('out')}
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          aria-label={t(locale, 'camera.reset')}
          title={t(locale, 'camera.reset')}
          onClick={() => command('reset')}
        >
          <Maximize size={16} />
        </button>
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
