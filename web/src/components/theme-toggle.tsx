import { Fragment, useMemo } from "react";
import cs from "clsx";
import type { Key } from "react-aria";
import { ToggleButton, ToggleButtonGroup } from "react-aria-components";
import { useTheme, type Theme } from "../hooks/use-theme";

const OPTIONS: readonly Theme[] = ["light", "system", "dark"] as const;

function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "system" || v === "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  const selectedKeys = useMemo(() => new Set<Key>([theme]), [theme]);

  return (
    <ToggleButtonGroup
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (isTheme(next)) setTheme(next);
      }}
      aria-label="Theme"
      className="kicker flex items-baseline gap-1.5 select-none"
    >
      {OPTIONS.map((t, i) => (
        <Fragment key={t}>
          {i > 0 && (
            <span aria-hidden="true" className="text-ink-faint">
              ·
            </span>
          )}
          <ToggleButton
            id={t}
            className={cs(
              "transition-colors cursor-pointer outline-none",
              "data-[focus-visible]:text-accent",
              "data-[selected]:text-accent data-[selected]:border-b data-[selected]:border-accent data-[selected]:pb-px",
              "text-ink-mute hover:text-ink-quiet",
            )}
          >
            {t}
          </ToggleButton>
        </Fragment>
      ))}
    </ToggleButtonGroup>
  );
}
