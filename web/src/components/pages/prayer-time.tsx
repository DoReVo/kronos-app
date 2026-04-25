import { useAtomValue } from "jotai";
import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import type { PrayerTime } from "@kronos/common";
import { methodAtom } from "../../atoms";
import { MethodToggle } from "../method-toggle";
import { UserCoordinate } from "../user-coordinate";
import { ZoneSelector } from "../ZoneSelector";
import { Switch } from "../base/Switch";
import { QueryErrorBoundary } from "../../query/query-provider";
import { useAutoPrayerTime, useManualPrayerTime } from "../../hooks/use-prayer-time";
import { TimeCard } from "../time-card";
import { Loading } from "../base/loading";
import { FolioMark, RunningHead } from "../page-frame";

const HERO_TIME_STYLE = { fontSize: "clamp(5rem,17vw,9rem)" } as const;
const EMPTY_ENTRIES: PrayerEntry[] = [];
const FOLIO = "02";

const PRAYER_KEYS = [
  "imsak",
  "subuh",
  "syuruk",
  "zohor",
  "asar",
  "maghrib",
  "isyak",
] as const satisfies readonly (keyof PrayerTime)[];

type PrayerKey = (typeof PRAYER_KEYS)[number];

interface PrayerEntry {
  key: PrayerKey;
  iso: string;
  display: string;
  isPast: boolean;
  isNext: boolean;
}

function useTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
    }, 30_000);
    return () => {
      window.clearInterval(id);
    };
  }, []);
}

function buildEntries(data: PrayerTime, now: DateTime): PrayerEntry[] {
  const parsed = PRAYER_KEYS.map((key) => {
    const iso = data[key];
    const dt = DateTime.fromISO(iso);
    return {
      key,
      iso,
      dt,
      display: dt.toLocaleString(DateTime.TIME_SIMPLE),
      isPast: dt < now,
    };
  });

  const nextIdx = parsed.findIndex((p) => !p.isPast);

  return parsed.map((p, i) => ({
    key: p.key,
    iso: p.iso,
    display: p.display,
    isPast: p.isPast,
    isNext: i === nextIdx,
  }));
}

function formatCountdown(target: DateTime, now: DateTime): string {
  const diff = target.diff(now, ["hours", "minutes"]).toObject();
  const hours = Math.floor(diff.hours ?? 0);
  const minutes = Math.floor(diff.minutes ?? 0);
  if (hours === 0 && minutes === 0) return "any moment now";
  if (hours === 0) return `in ${minutes} min`;
  if (minutes === 0) return `in ${hours} h`;
  return `in ${hours} h ${minutes} min`;
}

interface HeroProps {
  entry: PrayerEntry;
  now: DateTime;
}

function Hero({ entry, now }: HeroProps) {
  const target = DateTime.fromISO(entry.iso);
  const countdown = formatCountdown(target, now);
  return (
    <div className="flex flex-col items-center text-center py-6 sm:py-10">
      <div className="kicker text-accent mb-3">Up next</div>
      <div className="font-display italic text-3xl sm:text-4xl text-ink mb-4 capitalize">
        {entry.key}
      </div>
      <div
        className="font-display italic text-ink tabular leading-[0.95] tracking-tight"
        style={HERO_TIME_STYLE}
      >
        {entry.display}
      </div>
      <div className="font-display italic text-base text-ink-quiet mt-4">{countdown}</div>
    </div>
  );
}

interface ListProps {
  entries: PrayerEntry[];
}

function PrayerList({ entries }: ListProps) {
  return (
    <div className="flex flex-col">
      <div className="kicker text-ink-mute pb-2">The day&rsquo;s observances</div>
      {entries.map((e) => (
        <TimeCard key={e.key} name={e.key} time={e.display} isPast={e.isPast} />
      ))}
      <div className="border-t border-rule-soft" />
    </div>
  );
}

function PageContent() {
  const method = useAtomValue(methodAtom);
  const [useAdjustment, setUseAdjustment] = useState(false);
  useTick();

  const { data: autoData, isLoading: autoLoading } = useAutoPrayerTime(useAdjustment);
  const { data: manualData, isLoading: manualLoading } = useManualPrayerTime();

  const data = method === "auto" ? autoData : manualData;
  const isLoading = method === "auto" ? autoLoading : manualLoading;

  const now = DateTime.now();
  const entries = useMemo(() => (data === undefined ? null : buildEntries(data, now)), [data, now]);
  const hero = entries?.find((e) => e.isNext) ?? null;
  const others = useMemo(
    () => (entries === null ? EMPTY_ENTRIES : entries.filter((e) => !e.isNext)),
    [entries],
  );

  const today = now.toLocaleString({
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="reveal-stack mx-auto w-full max-w-2xl flex flex-col gap-8">
      <RunningHead section="Prayer Time" folio={FOLIO} />

      <div className="text-center">
        <div className="kicker text-ink-mute">Daily Observance</div>
        <div className="font-display italic text-base text-ink-quiet mt-2">{today}</div>
      </div>

      <div className="flex flex-col items-center gap-6">
        <MethodToggle />
        {method === "auto" && (
          <div className="flex flex-col items-center gap-4 mt-2">
            <UserCoordinate />
            <Switch
              isSelected={useAdjustment}
              onChange={setUseAdjustment}
              offLabel="astronomical"
              onLabel="jakim"
            >
              Adjustments
            </Switch>
          </div>
        )}
        {method === "manual" && (
          <div className="w-full max-w-sm mt-2">
            <ZoneSelector />
          </div>
        )}
      </div>

      <div className="flex items-center gap-5 text-ink-mute mt-2" aria-hidden="true">
        <span className="flex-1 border-t border-rule" />
        <span className="icon-[lucide--asterisk] text-lg" />
        <span className="flex-1 border-t border-rule" />
      </div>

      {isLoading && (
        <div className="flex justify-center pt-8">
          <Loading>fetching times</Loading>
        </div>
      )}

      {hero !== null && <Hero entry={hero} now={now} />}

      {hero === null && data !== undefined && entries !== null && (
        <div className="text-center font-display italic text-lg text-ink-quiet py-6">
          The day&rsquo;s observances are complete.
        </div>
      )}

      {entries !== null && others.length > 0 && <PrayerList entries={others} />}

      <FolioMark folio={FOLIO} />
    </div>
  );
}

export function PrayerTimePage() {
  return (
    <QueryErrorBoundary>
      <PageContent />
    </QueryErrorBoundary>
  );
}
