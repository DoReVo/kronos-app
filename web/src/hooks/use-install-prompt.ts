import { useMediaQuery } from "@uidotdev/usehooks";
import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

interface IOSNavigator extends Navigator {
  standalone?: boolean;
}

const IOS_UA = /iPad|iPhone|iPod/;
const IS_IOS = typeof navigator !== "undefined" && IOS_UA.test(navigator.userAgent);

interface InstallPrompt {
  installable: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  prompt: () => Promise<void>;
}

export function useInstallPrompt(): InstallPrompt {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const isDisplayStandalone = useMediaQuery("(display-mode: standalone)");
  const isStandalone = isDisplayStandalone || (navigator as IOSNavigator).standalone === true;

  useEffect(() => {
    const onBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const prompt = useCallback(async () => {
    if (deferred === null) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  }, [deferred]);

  return {
    installable: deferred !== null && !isStandalone,
    isIOS: IS_IOS && !isStandalone,
    isStandalone,
    prompt,
  };
}
