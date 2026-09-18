import { useCallback, useEffect, useState } from 'react';

import { TopBar } from '../features/controls/TopBar';
import { EventFeed } from '../features/feed/EventFeed';
import { ActivityPanel } from '../features/hud/ActivityPanel';
import { DebugOverlay } from '../features/hud/DebugOverlay';
import { FirstPersonChrome } from '../features/hud/FirstPerson';
import { GodPanel } from '../features/hud/GodPanel';
import { Minimap } from '../features/hud/Minimap';
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
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, button, select, summary, [contenteditable]')
      )
        return;
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
      <div className={styles.stage}>
        <WorldCanvas onReady={onReady} />
        <DebugOverlay />
        <FirstPersonChrome />
        <WorldHud />
        <ActivityPanel />
        <Minimap />
        <GodPanel socket={socket} />
      </div>
      <div className={styles.sidebar}>
        <Inspector socket={socket} />
        <EventFeed />
      </div>
    </div>
  );
};
