import { useNetworkState } from "@uidotdev/usehooks";

export function OfflineMark({ className = "" }: { className?: string }) {
  const network = useNetworkState();
  if (network.online) return null;
  return (
    <span role="status" aria-live="polite" className={`kicker italic text-ink-mute ${className}`}>
      · without dispatch ·
    </span>
  );
}
