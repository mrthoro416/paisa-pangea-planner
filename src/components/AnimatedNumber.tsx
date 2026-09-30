import { useEffect, useRef } from "react";
import { animate } from "motion";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(value);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(prev.current, value, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (node.textContent = String(Math.round(v))),
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
