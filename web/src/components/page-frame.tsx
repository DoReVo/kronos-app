import { Link } from "@tanstack/react-router";

interface RunningHeadProps {
  section: string;
  folio: string;
}

export function RunningHead({ section, folio }: RunningHeadProps) {
  return (
    <header className="flex items-baseline justify-between border-b border-rule-soft pb-2">
      <Link to="/" className="kicker hover:text-accent transition-colors flex items-center gap-1.5">
        <span aria-hidden="true" className="icon-[lucide--arrow-left] text-sm" />
        <span>contents</span>
      </Link>
      <span className="kicker text-ink-quiet">{section}</span>
      <span className="font-mono text-xs tabular text-ink-mute">{folio}</span>
    </header>
  );
}

interface FolioMarkProps {
  folio: string;
}

export function FolioMark({ folio }: FolioMarkProps) {
  return (
    <div className="flex items-center justify-center gap-3 pt-12 pb-8" aria-hidden="true">
      <span className="font-mono text-xs tabular text-ink-faint">─</span>
      <span className="font-mono text-xs tabular text-ink-mute">{folio}</span>
      <span className="font-mono text-xs tabular text-ink-faint">─</span>
    </div>
  );
}
