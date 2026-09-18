import { actionLabel, jobLabel, locationLabel, t } from '../../i18n';
import { useUiStore } from '../../stores/ui-store';
import { nearbyPeople } from '../../world/camera';

import styles from './FirstPerson.module.css';

export const FirstPersonChrome = () => {
  const cameraMode = useUiStore((state) => state.cameraMode);
  const followNpcId = useUiStore((state) => state.followNpcId);
  const people = useUiStore((state) => state.people);
  const snapshot = useUiStore((state) => state.snapshot);
  const locale = useUiStore((state) => state.locale);
  const self = followNpcId ? people[followNpcId] : undefined;
  if (cameraMode !== 'first' || !self || !snapshot) {
    return null;
  }
  const nearby = nearbyPeople(self, Object.values(people), 140).slice(0, 4);
  const place = snapshot.locations.find((location) => location.id === self.locationId);
  return (
    <div className={styles.visor} data-testid="first-person">
      <div className={styles.vignette} />
      <p className={styles.eyes}>{t(locale, 'camera.eyes', { name: self.name })}</p>
      <p className={styles.place}>
        {place ? locationLabel(locale, place) : t(locale, 'location.town')}
        {' · '}
        {actionLabel(locale, self.action)}
      </p>
      <ul className={styles.near}>
        {nearby.map((person) => (
          <li key={person.id}>
            <strong>{person.name}</strong>
            <span>
              {jobLabel(locale, person.job)} · {actionLabel(locale, person.action)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
