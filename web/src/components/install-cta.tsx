import { useInstallPrompt } from "../hooks/use-install-prompt";

export function InstallCta() {
  const { installable, isIOS, prompt } = useInstallPrompt();

  if (installable) {
    return (
      <div className="kicker italic text-ink-mute text-center">
        <button
          type="button"
          onClick={() => void prompt()}
          className="hover:text-accent underline decoration-accent underline-offset-4 decoration-1 cursor-pointer"
        >
          · place this volume on your shelf ·
        </button>
      </div>
    );
  }

  if (isIOS) {
    return (
      <div className="kicker italic text-ink-mute text-center">
        · share <span className="text-ink-faint">→</span> add to home screen — for the shelf ·
      </div>
    );
  }

  return null;
}
