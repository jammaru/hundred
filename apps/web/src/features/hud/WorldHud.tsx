import { actionLabel, jobLabel, t } from '../../i18n';
import { useUiStore } from '../../stores/ui-store';

import styles from './WorldHud.module.css';

export const WorldHud = () => {
  const hovered = useUiStore((state) => state.hoveredNpcId);
  const hoverNpc = useUiStore((state) => (hovered ? state.people[hovered] : undefined));
  const locale = useUiStore((state) => state.locale);
  if (!hoverNpc) {
    return null;
  }
  return (
    <div className={styles.hover}>
      <strong>{hoverNpc.name}</strong>
      <div>
        {jobLabel(locale, hoverNpc.job)} · {actionLabel(locale, hoverNpc.action)}
        <br />
        {t(locale, 'inspector.hunger')} {hoverNpc.hunger} · {t(locale, 'inspector.money')} $
        {hoverNpc.money}
      </div>
    </div>
  );
};
