interface BeaconLogoProps {
  size?: number;
  className?: string;
}

// The Beacon — universal "start over" mark. A light over a destination pin.
export function BeaconMark({ size = 36, className }: BeaconLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <circle cx="20" cy="20" r="18.5" stroke="var(--beacon)" strokeOpacity="0.5" strokeWidth="1.4" />
      {/* radiating light */}
      <path
        d="M20 8.5 L25.5 24 A6.5 6.5 0 0 1 14.5 24 Z"
        fill="var(--beacon)"
        fillOpacity="0.9"
      />
      <circle cx="20" cy="27" r="2.6" fill="var(--beacon)" />
      <path d="M20 3.5 V7 M34 9.5 L31.5 12 M6 9.5 L8.5 12" stroke="var(--beacon)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="20" cy="20" r="1.4" fill="var(--background)" />
    </svg>
  );
}

export function BeaconLogo({ onReset }: { onReset: () => void }) {
  return (
    <button
      type="button"
      onClick={onReset}
      aria-label="Paisa Planner — reset map and start over"
      title="Reset map and start over"
      className="group flex items-center gap-3 rounded-full p-1 pr-4 text-left transition-colors hover:bg-beacon-soft"
    >
      <BeaconMark size={38} className="beacon-glow group-hover:scale-105" />
      <span className="hidden sm:flex flex-col leading-tight">
        <span className="masthead text-[15px] text-foreground">Paisa Planner</span>
        <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Colombian Passport · Entry Guide
        </span>
      </span>
    </button>
  );
}
