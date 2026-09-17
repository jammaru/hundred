import { actionLabel, t } from '../../i18n';
import { useUiStore } from '../../stores/ui-store';

import styles from './Inspector.module.css';

export const DecisionJournal = ({ npcId }: { npcId?: string }) => {
  const locale = useUiStore((state) => state.locale);
  const provider = useUiStore((state) => state.snapshot?.provider);
  const decisions = useUiStore((state) => state.decisions);
  const people = useUiStore((state) => state.people);
  const selectNpc = useUiStore((state) => state.selectNpc);
  const records = decisions
    .filter((record) => !npcId || record.npcId === npcId)
    .slice(0, npcId ? 2 : 3);
  return (
    <section className={styles.decisions} data-testid="decision-journal">
      <h3>{t(locale, 'decisions.title')}</h3>
      <p>
        {t(
          locale,
          provider === 'jev'
            ? 'decisions.jev'
            : provider === 'replay'
              ? 'decisions.replay'
              : 'decisions.rules',
        )}
      </p>
      <p>{t(locale, 'decisions.tryConditions')}</p>
      {records.length === 0 ? <p>{t(locale, 'decisions.waiting')}</p> : null}
      {records.map((record) => {
        const context = record.context;
        const ranked = Object.entries(record.probabilities)
          .sort(
            (a, b) =>
              Number(b[0] === record.selected) - Number(a[0] === record.selected) || b[1] - a[1],
          )
          .slice(0, 3);
        return (
          <article className={styles.decisionCard} key={`${record.npcId}-${record.tick}`}>
            <div className={styles.decisionHeading}>
              <button type="button" onClick={() => selectNpc(record.npcId)}>
                {people[record.npcId]?.name ?? record.npcId}
              </button>
              <span>
                {record.fallback
                  ? t(locale, 'decisions.fallback')
                  : record.provider === 'jev'
                    ? 'Jev'
                    : record.provider === 'replay'
                      ? t(locale, 'app.providerReplay')
                      : t(locale, 'app.providerRules')}
              </span>
            </div>
            <strong>{actionLabel(locale, record.selected)}</strong>
            {context ? (
              <p>
                {t(locale, 'decisions.context', {
                  hunger: context.hunger,
                  energy: context.energy,
                  money: context.money,
                })}
                <br />
                {t(locale, 'decisions.social', {
                  kindness: context.kindness,
                  greed: context.greed,
                  nearby: context.nearby,
                  memories: context.memories,
                })}
                <br />
                {t(locale, context.raining ? 'hud.weatherRain' : 'hud.weatherClear')} ·{' '}
                {t(locale, context.shopOpen ? 'hud.shopOpen' : 'hud.shopClosed')}
                {context.festival ? ` · ${t(locale, 'hud.festival')}` : ''}
              </p>
            ) : null}
            {ranked.map(([action, probability]) => (
              <div className={styles.choice} key={action}>
                <div>
                  {action === record.selected ? '→ ' : ''}
                  {actionLabel(locale, action)}
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${Math.round(probability * 100)}%` }}
                    />
                  </div>
                </div>
                <span>{Math.round(probability * 100)}%</span>
              </div>
            ))}
          </article>
        );
      })}
      <small>{t(locale, 'decisions.note')}</small>
    </section>
  );
};
