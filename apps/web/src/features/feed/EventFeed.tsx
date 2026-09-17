import { useState } from 'react';

import { formatEvent, formatEventTime, t } from '../../i18n';
import { useUiStore } from '../../stores/ui-store';

import styles from './EventFeed.module.css';

export const EventFeed = () => {
  const [importantOnly, setImportantOnly] = useState(false);
  const events = useUiStore((state) => state.events);
  const selectNpc = useUiStore((state) => state.selectNpc);
  const locale = useUiStore((state) => state.locale);
  const favorites = useUiStore((state) => state.favorites);
  const tags: Record<string, string> = {
    crime: t(locale, 'feed.crime'),
    conflict: t(locale, 'feed.conflict'),
    help: t(locale, 'feed.help'),
  };
  return (
    <section className={styles.feed} aria-label={t(locale, 'feed.label')} data-testid="event-feed">
      <div className={styles.heading}>
        <strong>{t(locale, 'feed.label')}</strong>
        <button
          type="button"
          aria-pressed={importantOnly}
          onClick={() => setImportantOnly(!importantOnly)}
        >
          {t(locale, 'feed.highlights')}
        </button>
      </div>
      <div className={styles.stream}>
        {events.filter((event) => !importantOnly || event.important).length === 0 ? (
          <span>{t(locale, 'feed.waiting')}</span>
        ) : null}
        {events
          .filter((event) => !importantOnly || event.important)
          .map((event) => (
            <button
              key={`${locale}-${event.id}-${event.tick}-${event.kind}`}
              type="button"
              className={styles.item}
              data-important={event.important}
              data-favorite={event.npcIds.some((id) => favorites.has(id))}
              onClick={() => {
                const id = event.npcIds[0];
                if (id) {
                  selectNpc(id);
                }
              }}
            >
              <span className={styles.meta}>
                {formatEventTime(locale, event)}
                {event.important && tags[event.category] ? (
                  <span className={styles.tag}>{tags[event.category]}</span>
                ) : null}
              </span>
              {formatEvent(locale, event)}
            </button>
          ))}
      </div>
    </section>
  );
};
