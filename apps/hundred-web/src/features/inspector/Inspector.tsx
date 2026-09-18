import { X } from 'lucide-react';
import { useState } from 'react';

import {
  actionLabel,
  formatActionPhrase,
  formatMemory,
  formatMemoryAge,
  jobLabel,
  locationLabel,
  t,
} from '../../i18n';
import type { SimulationSocket } from '../../net/socket';
import { useUiStore } from '../../stores/ui-store';
import { villagerSpriteName } from '../../world/sprite-identity';
import { rankBusyPeople } from '../hud/activity';
import { pickInteresting, relationLabel, whyActing } from '../hud/interesting';
import { DecisionJournal } from './DecisionJournal';

import styles from './Inspector.module.css';

const NEED_KEYS = ['hunger', 'energy', 'health', 'mood'] as const;
const TRAIT_KEYS = ['kindness', 'greed', 'courage', 'sociability', 'diligence'] as const;
const TABS = ['overview', 'relations', 'memories'] as const;
type InspectorTab = (typeof TABS)[number];

export const Inspector = ({ socket }: { socket: SimulationSocket | undefined }) => {
  const [tab, setTab] = useState<InspectorTab>('overview');
  const inspected = useUiStore((state) => state.inspected);
  const selectNpc = useUiStore((state) => state.selectNpc);
  const locale = useUiStore((state) => state.locale);
  const followNpcId = useUiStore((state) => state.followNpcId);
  const followNpc = useUiStore((state) => state.followNpc);
  const favorites = useUiStore((state) => state.favorites);
  const toggleFavorite = useUiStore((state) => state.toggleFavorite);
  const snapshot = useUiStore((state) => state.snapshot);
  const interesting = snapshot ? pickInteresting(snapshot.npcs, favorites) : [];
  const interestingList = (
    <section className={styles.section}>
      <h3>{t(locale, 'interesting.title')}</h3>
      {interesting.length === 0 ? <p>{t(locale, 'feed.waiting')}</p> : null}
      {interesting.map((person) => (
        <button
          key={person.id}
          type="button"
          className={styles.rel}
          onClick={() => followNpc(person.id)}
        >
          <span>{person.name}</span>
          <span>{t(locale, person.reason)}</span>
        </button>
      ))}
    </section>
  );
  if (!inspected) {
    return (
      <aside
        className={styles.panel}
        aria-label={t(locale, 'inspector.label')}
        data-testid="inspector"
      >
        <DecisionJournal />
        <div className={styles.welcome}>
          <h2>{t(locale, 'app.explore')}</h2>
          <p>{t(locale, 'app.exploreHint')}</p>
        </div>
        <section className={styles.section}>
          <h3>
            {t(locale, 'app.residents')} <span>{snapshot?.population ?? 0}</span>
          </h3>
          {(snapshot ? rankBusyPeople(snapshot.npcs, 12) : []).map((npc) => (
            <button
              className={styles.resident}
              type="button"
              key={npc.id}
              onClick={() => selectNpc(npc.id)}
            >
              <span className={styles.face}>
                <img
                  src={`/assets/world/${villagerSpriteName(npc.avatarSeed)}.png`}
                  alt=""
                  width={40}
                  height={40}
                />
              </span>
              <span>
                <strong>{npc.name}</strong>
                <small>
                  {jobLabel(locale, npc.job)} · {actionLabel(locale, npc.action)}
                </small>
              </span>
              <span aria-hidden="true">↗</span>
            </button>
          ))}
        </section>
        {interestingList}
      </aside>
    );
  }
  const probabilities = inspected.decision.probabilities;
  const ranked = probabilities
    ? Object.entries(probabilities).sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
    : [];
  return (
    <aside
      className={styles.panel}
      aria-label={t(locale, 'inspector.label')}
      data-testid="inspector"
    >
      <button
        type="button"
        className={styles.close}
        aria-label={t(locale, 'app.close')}
        onClick={() => selectNpc(null)}
      >
        <X size={15} />
      </button>
      <div className={styles.head}>
        <div className={styles.portrait}>
          <img
            src={`/assets/world/${villagerSpriteName(inspected.avatarSeed)}.png`}
            alt=""
            width={96}
            height={120}
          />
        </div>
        <div className={styles.identity}>
          <h2>{inspected.name}</h2>
          <p>
            {inspected.age} · {jobLabel(locale, inspected.job)}
          </p>
          <p>
            {locationLabel(locale, {
              name: inspected.locationName,
              ...(inspected.locationId ? { id: inspected.locationId } : {}),
              ...(inspected.locationKind ? { kind: inspected.locationKind } : {}),
            })}
          </p>
          <p>{formatActionPhrase(locale, inspected)}</p>
          <p className={styles.money}>
            {t(locale, 'inspector.money')} ${inspected.money}
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => followNpc(followNpcId === inspected.id ? null : inspected.id)}
        >
          {followNpcId === inspected.id ? t(locale, 'app.unfollow') : t(locale, 'app.follow')}
        </button>
        <button type="button" onClick={() => toggleFavorite(inspected.id)}>
          {favorites.has(inspected.id) ? t(locale, 'app.unfavorite') : t(locale, 'app.favorite')}
        </button>
        <button
          type="button"
          onClick={() => socket?.send({ type: 'god.act', intent: 'gift', npcId: inspected.id })}
        >
          {t(locale, 'god.gift')}
        </button>
        <button
          type="button"
          onClick={() => socket?.send({ type: 'god.act', intent: 'aid', npcId: inspected.id })}
        >
          {t(locale, 'god.aid')}
        </button>
      </div>
      <nav className={styles.tabs} aria-label={t(locale, 'inspector.label')}>
        {TABS.map((key) => (
          <button key={key} type="button" data-active={tab === key} onClick={() => setTab(key)}>
            {key === 'overview'
              ? t(locale, 'inspector.tabOverview')
              : key === 'relations'
                ? t(locale, 'inspector.relationships')
                : t(locale, 'inspector.timeline')}
          </button>
        ))}
      </nav>
      {tab === 'overview' ? (
        <>
          <DecisionJournal npcId={inspected.id} />
          <section className={styles.section}>
            <h3>{t(locale, 'inspector.needs')}</h3>
            {NEED_KEYS.map((key) => {
              const warn =
                (key === 'hunger' && inspected.needs.hunger >= 75) ||
                (key === 'energy' && inspected.needs.energy <= 25);
              return (
                <div className={styles.need} key={key}>
                  <span>{t(locale, `inspector.${key}`)}</span>
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      data-warn={warn ? 'true' : undefined}
                      style={{ width: `${Math.round(inspected.needs[key])}%` }}
                    />
                  </div>
                  <span>{Math.round(inspected.needs[key])}</span>
                </div>
              );
            })}
          </section>
          {whyActing(inspected).length > 0 ? (
            <section className={styles.section}>
              <h3>{t(locale, 'inspector.why')}</h3>
              {whyActing(inspected).map((reason) => (
                <p key={reason}>{t(locale, reason)}</p>
              ))}
            </section>
          ) : null}
          <section className={styles.section}>
            <h3>{t(locale, 'inspector.next')}</h3>
            <p>
              {inspected.decision.status === 'deciding'
                ? t(locale, 'inspector.deciding')
                : inspected.decision.provider === 'jev'
                  ? t(locale, 'app.providerJev')
                  : inspected.decision.provider === 'replay'
                    ? t(locale, 'app.providerReplay')
                    : t(locale, 'app.providerRules')}
            </p>
            {inspected.decision.status === 'decided' && inspected.decision.selected ? (
              <p>→ {actionLabel(locale, inspected.decision.selected)}</p>
            ) : null}
            {ranked.map(([action, value]) => (
              <div className={styles.choice} key={action}>
                <div>
                  {actionLabel(locale, action)}
                  <div className={styles.track}>
                    <div
                      className={styles.fill}
                      style={{ width: `${Math.round((value ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
                <span>{Math.round((value ?? 0) * 100)}%</span>
              </div>
            ))}
          </section>
          <section className={styles.section}>
            <h3>{t(locale, 'inspector.personality')}</h3>
            {TRAIT_KEYS.map((key) => (
              <div className={styles.need} key={key}>
                <span>{t(locale, `inspector.${key}`)}</span>
                <div className={styles.track}>
                  <div
                    className={styles.fill}
                    style={{ width: `${inspected.personality[key]}%` }}
                  />
                </div>
                <span>{inspected.personality[key]}</span>
              </div>
            ))}
          </section>
        </>
      ) : null}
      {tab === 'relations' ? (
        <section className={styles.section}>
          <h3>{t(locale, 'inspector.relationships')}</h3>
          {inspected.relationships.length === 0 ? <p>{t(locale, 'inspector.noTies')}</p> : null}
          {inspected.relationships.map((rel) => (
            <button
              key={rel.npcId}
              type="button"
              className={styles.rel}
              onClick={() => selectNpc(rel.npcId)}
            >
              <span>{rel.name}</span>
              <span>
                {relationLabel(rel.trust) ? `${t(locale, relationLabel(rel.trust)!)} ` : ''}
                {rel.trust > 0 ? '+' : ''}
                {rel.trust}
              </span>
            </button>
          ))}
        </section>
      ) : null}
      {tab === 'memories' ? (
        <section className={styles.section}>
          <h3>{t(locale, 'inspector.timeline')}</h3>
          {inspected.memories.length === 0 ? <p>{t(locale, 'inspector.noMemories')}</p> : null}
          {inspected.memories.map((memory) => (
            <div className={styles.memory} key={`${memory.age}-${memory.text}`}>
              <span>{formatMemoryAge(locale, memory.ageMinutes, memory.age)}</span>
              {formatMemory(locale, memory)}
            </div>
          ))}
        </section>
      ) : null}
    </aside>
  );
};
