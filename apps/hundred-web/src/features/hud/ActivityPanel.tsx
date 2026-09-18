import { actionLabel, formatEvent, t, type Locale } from '../../i18n';
import { useUiStore } from '../../stores/ui-store';
import { countBusyActions } from './activity';

import styles from './ActivityPanel.module.css';

export const ActivityPanel = () => {
  const locale = useUiStore((state) => state.locale);
  const snapshot = useUiStore((state) => state.snapshot);
  const decisions = useUiStore((state) => state.decisions);
  const events = useUiStore((state) => state.events);
  const people = useUiStore((state) => state.people);
  const selectNpc = useUiStore((state) => state.selectNpc);
  const census = snapshot ? countBusyActions(snapshot.npcs) : [];
  const choices = decisions.slice(0, 3);
  const headlines = events.filter((event) => event.important).slice(0, 1);
  return (
    <section
      className={styles.panel}
      aria-label={t(locale, 'activity.title')}
      data-testid="activity-panel"
    >
      <div className={styles.heading}>
        <strong>{t(locale, 'activity.title')}</strong>
        <span>{t(locale, 'activity.summary')}</span>
      </div>
      {census.length > 0 ? (
        <div className={styles.census}>
          {census.map((row) => (
            <span className={styles.chip} data-action={row.action} key={row.action}>
              {t(locale, 'activity.count', {
                action: actionLabel(locale, row.action),
                count: row.count,
              })}
            </span>
          ))}
        </div>
      ) : null}
      <div className={styles.stream}>
        {choices.length === 0 && headlines.length === 0 ? (
          <p>{t(locale, 'activity.none')}</p>
        ) : null}
        {choices.map((record) => {
          const odds = record.probabilities[record.selected] ?? 0;
          return (
            <button
              key={`${record.npcId}-${record.tick}`}
              type="button"
              className={styles.line}
              data-provider={record.fallback ? 'fallback' : record.provider}
              onClick={() => selectNpc(record.npcId)}
            >
              <span className={styles.tag}>
                {record.fallback
                  ? t(locale, 'decisions.fallback')
                  : record.provider === 'jev'
                    ? t(locale, 'app.providerJev')
                    : t(locale, 'app.providerRules')}
              </span>
              <span>
                {t(locale, 'activity.chose', {
                  name: people[record.npcId]?.name ?? record.npcId,
                  action: actionLabel(locale, record.selected),
                })}
              </span>
              {odds > 0 ? (
                <em>{t(locale, 'activity.odds', { percent: Math.round(odds * 100) })}</em>
              ) : null}
            </button>
          );
        })}
        {headlines.map((event) => (
          <button
            key={event.id}
            type="button"
            className={styles.line}
            data-provider={event.category}
            onClick={() => {
              const id = event.npcIds[0];
              if (id) {
                selectNpc(id);
              }
            }}
          >
            <span className={styles.tag}>{headlineTag(locale, event.category)}</span>
            <span>{formatEvent(locale, event)}</span>
          </button>
        ))}
      </div>
      <small>{t(locale, 'activity.hint')}</small>
    </section>
  );
};

const headlineTag = (locale: Locale, category: string): string => {
  if (category === 'crime' || category === 'conflict' || category === 'help') {
    return t(locale, `feed.${category}`);
  }
  return t(locale, 'activity.headline');
};
