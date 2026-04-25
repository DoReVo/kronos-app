import { Link } from "@tanstack/react-router";
import type { FallbackProps } from "react-error-boundary";

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message || error.toString();
  if (typeof error === "string") return error;
  return "An unknown error occurred.";
}

export function EditorialError({ error, resetErrorBoundary }: FallbackProps) {
  const message = errorMessage(error);
  return (
    <div className="reveal-stack mx-auto w-full max-w-xl flex flex-col items-center text-center py-12 sm:py-20">
      <div className="kicker text-accent mb-5 tracking-[0.32em]">Erratum</div>

      <h2 className="font-display italic text-4xl sm:text-5xl text-ink mb-6 leading-[1.05] text-balance">
        Something failed to set.
      </h2>

      <p className="font-display italic text-base text-ink-quiet leading-snug mb-10 max-w-[42ch] text-balance">
        The press caught a snag rendering this section. The printer&rsquo;s note follows below.
      </p>

      <pre className="font-mono text-xs tabular text-ink-mute mb-10 px-5 py-4 border-t border-b border-rule-soft w-full max-w-[60ch] whitespace-pre-wrap text-left overflow-x-auto">
        {message}
      </pre>

      <button
        type="button"
        onClick={resetErrorBoundary}
        className="group w-full max-w-xs flex items-center gap-3 py-2 outline-none cursor-pointer"
      >
        <span className="flex-1 border-t border-rule group-hover:border-accent transition-colors" />
        <span className="kicker italic text-ink-mute group-hover:text-accent transition-colors flex items-baseline gap-1.5">
          <span className="text-ink-faint">·</span>
          <span>set again</span>
          <span className="text-ink-faint">·</span>
        </span>
        <span className="flex-1 border-t border-rule group-hover:border-accent transition-colors" />
      </button>

      <Link
        to="/"
        className="kicker mt-8 hover:text-accent transition-colors flex items-center gap-1.5"
      >
        <span aria-hidden="true" className="icon-[lucide--arrow-left] text-sm" />
        <span>contents</span>
      </Link>
    </div>
  );
}
