interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export function MapControls({ onZoomIn, onZoomOut, onReset }: MapControlsProps) {
  const btn =
    "tap-target flex items-center justify-center rounded-xl text-foreground text-lg transition-colors hover:bg-accent active:bg-secondary";
  return (
    <div className="map-overlay flex flex-col overflow-hidden rounded-2xl" role="group" aria-label="Map controls">
      <button type="button" onClick={onZoomIn} aria-label="Zoom in" className={btn}>
        ＋
      </button>
      <button type="button" onClick={onZoomOut} aria-label="Zoom out" className={`${btn} border-y border-border`}>
        −
      </button>
      <button type="button" onClick={onReset} aria-label="Reset to world view" className={btn}>
        ◎
      </button>
    </div>
  );
}
