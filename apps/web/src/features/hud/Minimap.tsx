import { useEffect, useRef } from 'react';

import { t } from '../../i18n';
import { useUiStore } from '../../stores/ui-store';

import styles from './Minimap.module.css';

const MAP_WIDTH = 184;
const MAP_HEIGHT = 128;

const KIND_COLORS: Record<string, string> = {
  home: '#d9a441',
  farm: '#7ba95c',
  market: '#e08a5e',
  workshop: '#a08a6a',
  tavern: '#c46a6a',
  clinic: '#7ec8e3',
  plaza: '#e8d9a8',
  park: '#6fbf7a',
};

export const Minimap = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  const locale = useUiStore((state) => state.locale);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = MAP_WIDTH * ratio;
    canvas.height = MAP_HEIGHT * ratio;
    const draw = () => {
      const state = useUiStore.getState();
      const snapshot = state.snapshot;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!snapshot) {
        return;
      }
      const sx = canvas.width / snapshot.bounds.width;
      const sy = canvas.height / snapshot.bounds.height;
      ctx.fillStyle = '#1d2b1c';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      for (const location of snapshot.locations) {
        ctx.fillStyle = KIND_COLORS[location.kind] ?? '#8a927e';
        ctx.globalAlpha = 0.85;
        const w = Math.max(3 * ratio, location.size.x * sx);
        const h = Math.max(3 * ratio, location.size.y * sy);
        ctx.beginPath();
        ctx.roundRect(location.position.x * sx, location.position.y * sy, w, h, 2 * ratio);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#f2f4e6';
      for (const npc of snapshot.npcs) {
        ctx.fillRect(
          npc.position.x * sx - ratio,
          npc.position.y * sy - ratio,
          2 * ratio,
          2 * ratio,
        );
      }
      const view = state.cameraView;
      if (view && view.scale > 0) {
        const vx = -view.x / view.scale;
        const vy = -view.y / view.scale;
        const vw = view.width / view.scale;
        const vh = view.height / view.scale;
        ctx.strokeStyle = '#d9a441';
        ctx.lineWidth = 1.5 * ratio;
        ctx.strokeRect(vx * sx, vy * sy, vw * sx, vh * sy);
      }
    };
    draw();
    const id = window.setInterval(draw, 250);
    return () => window.clearInterval(id);
  }, []);

  const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const state = useUiStore.getState();
    const bounds = state.snapshot?.bounds;
    const canvas = ref.current;
    if (!bounds || !canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    state.requestCameraFocus({
      x: ((event.clientX - rect.left) / rect.width) * bounds.width,
      y: ((event.clientY - rect.top) / rect.height) * bounds.height,
    });
    if (state.cameraMode !== 'town') {
      state.setCameraMode('town');
    }
  };

  return (
    <canvas
      ref={ref}
      className={styles.map}
      style={{ width: MAP_WIDTH, height: MAP_HEIGHT }}
      aria-label={t(locale, 'app.minimap')}
      data-testid="minimap"
      onClick={onClick}
    />
  );
};
