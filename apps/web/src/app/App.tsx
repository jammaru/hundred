import { useCallback, useEffect, useState } from 'react';

import { TopBar } from '../features/controls/TopBar';
import { EventFeed } from '../features/feed/EventFeed';
import { DebugOverlay } from '../features/hud/DebugOverlay';
import { FirstPersonChrome } from '../features/hud/FirstPerson';
import { WorldHud } from '../features/hud/WorldHud';
import { Inspector } from '../features/inspector/Inspector';
import type { SimulationSocket } from '../net/socket';
import { useUiStore } from '../stores/ui-store';
import { WorldCanvas } from '../world/WorldCanvas';

import styles from './App.module.css';

export const App = () => {
  const [socket, setSocket] = useState<SimulationSocket>();
  const onReady = useCallback((next: SimulationSocket) => setSocket(next), []);
  const snapshot = useUiStore((state) => state.snapshot);
  const selectedNpcId = useUiStore((state) => state.selectedNpcId);
  const selectNpc = useUiStore((state) => state.selectNpc);
  const locale = useUiStore((state) => state.locale);

  useEffect(() => {
    document.documentElement.lang = locale === 'ja' ? 'ja' : 'en';
  }, [locale]);

  useEffect(() => {
    if (selectedNpcId) {
      socket?.inspect(selectedNpcId);
    }
  }, [selectedNpcId, socket]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        socket?.send({
          type: snapshot?.status === 'paused' ? 'simulation.resume' : 'simulation.pause',
        });
      }
      if (event.code === 'Escape') {
        selectNpc(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectNpc, snapshot?.status, socket]);

  return (
    <div className={styles.shell}>
      <TopBar socket={socket} />
      <div className={styles.body}>
        <div className={styles.stage}>
          <WorldCanvas onReady={onReady} />
          <WorldHud socket={socket} />
          <DebugOverlay />
          {snapshot?.weather === 'rain' ? <div className={styles.rain} /> : null}
          {snapshot?.festival ? <div className={styles.festival} /> : null}
          <FirstPersonChrome />
        </div>
        <Inspector socket={socket} />
      </div>
      <EventFeed />
    </div>
  );
};
