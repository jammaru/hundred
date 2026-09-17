import { useUiStore } from '../../stores/ui-store';

export const DebugOverlay = () => {
  const debug = useUiStore((state) => state.debug);
  const snapshot = useUiStore((state) => state.snapshot);
  if (!debug || !snapshot) {
    return null;
  }
  return (
    <pre
      style={{
        position: 'absolute',
        right: 412,
        top: 12,
        margin: 0,
        padding: 8,
        fontSize: 11,
        background: 'rgba(18,20,26,0.8)',
        borderRadius: 8,
        pointerEvents: 'none',
      }}
    >
      {`tick ${snapshot.tick}
npc ${snapshot.population}
speed ${snapshot.speed}x
provider ${snapshot.provider}`}
    </pre>
  );
};
