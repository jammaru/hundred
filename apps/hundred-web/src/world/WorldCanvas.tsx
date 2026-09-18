import { useEffect, useRef } from 'react';

import { SimulationSocket } from '../net/socket';
import { WorldRuntime } from './runtime';

import styles from './WorldCanvas.module.css';

interface Props {
  onReady: (socket: SimulationSocket) => void;
}

export const WorldCanvas = ({ onReady }: Props) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const runtime = new WorldRuntime();
    let socket: SimulationSocket | undefined;
    let cancelled = false;
    void runtime.mount(host).then(() => {
      if (cancelled) {
        runtime.destroy();
        return;
      }
      socket = new SimulationSocket(runtime);
      socket.connect();
      onReady(socket);
    });
    return () => {
      cancelled = true;
      socket?.dispose();
      runtime.destroy();
    };
  }, [onReady]);

  return <div ref={hostRef} className={styles.canvas} data-testid="world-canvas" />;
};
