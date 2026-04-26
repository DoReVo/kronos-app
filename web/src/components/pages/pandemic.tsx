import { useCallback, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { DateTime } from "luxon";
import type { PandemicDataset, PandemicMetric } from "@kronos/common";
import { pandemicCompareAtom, pandemicStateAtom, pandemicYearAtom } from "../../atoms";
import { usePandemic } from "../../hooks/use-pandemic";
import { Loading } from "../base/loading";
import { FolioMark, RunningHead } from "../page-frame";
import { Imprint } from "../imprint";
import { QueryErrorBoundary } from "../../query/query-provider";
import { InlinePicker, PickerListItem } from "../inline-picker";
import { HairlineChart } from "../hairline-chart";
import { addDays, dayDiff, pickYears, sliceSeries } from "../../lib/pandemic-slice";

const FOLIO = "06";
const HERO_STYLE = { fontSize: "clamp(4rem,15vw,9rem)" } as const;
const METRIC_STYLE = { fontSize: "clamp(1.75rem,4.5vw,2.5rem)" } as const;
const CASES_THRESHOLD = 1000;
const DEATHS_THRESHOLD = 10;
const CHART_HEIGHT = 320;

const NAMED_EVENTS: { date: string; label: string }[] = [
  { date: "2020-03-18", label: "MCO begins" },
  { date: "2021-02-24", label: "vaccine rollout" },
  { date: "2021-08-26", label: "delta peak" },
  { date: "2022-04-01", label: "endemic transition" },
];

function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  return DateTime.fromISO(iso).toLocaleString(
    opts ?? { day: "numeric", month: "long", year: "numeric" },
  );
}

function fmtMonthYearShort(iso: string): string {
  return DateTime.fromISO(iso).toLocaleString({ day: "numeric", month: "short", year: "numeric" });
}

interface ChapterMarkProps {
  numeral: string;
  title: string;
}

function ChapterMark({ numeral, title }: ChapterMarkProps) {
  return (
    <div className="flex items-baseline gap-3 pb-2 border-b border-rule">
      <span className="font-display italic text-2xl text-accent leading-none">{numeral}</span>
      <span className="kicker text-ink-quiet text-sm">— {title}</span>
    </div>
  );
}

interface MetricToggleProps {
  value: PandemicMetric;
  onChange: (next: PandemicMetric) => void;
}

function MetricToggle({ value, onChange }: MetricToggleProps) {
  return (
    <div className="flex items-baseline gap-6 select-none">
      <button
        type="button"
        onClick={() => {
          onChange("cases");
        }}
        className={
          value === "cases"
            ? "font-display italic text-ink border-b-2 border-accent pb-1 transition-colors cursor-pointer"
            : "font-display italic text-ink-quiet hover:text-accent transition-colors cursor-pointer"
        }
        style={METRIC_STYLE}
      >
        cases
      </button>
      <span aria-hidden="true" className="text-ink-faint text-2xl">
        ·
      </span>
      <button
        type="button"
        onClick={() => {
          onChange("deaths");
        }}
        className={
          value === "deaths"
            ? "font-display italic text-ink border-b-2 border-accent pb-1 transition-colors cursor-pointer"
            : "font-display italic text-ink-quiet hover:text-accent transition-colors cursor-pointer"
        }
        style={METRIC_STYLE}
      >
        deaths
      </button>
    </div>
  );
}

interface YearPickerProps {
  available: string[];
  value: string;
  onChange: (next: string) => void;
  label: string;
}

function YearPicker({ available, value, onChange, label }: YearPickerProps) {
  const all: { key: string; label: string }[] = [
    { key: "all", label: "all years" },
    ...available.map((y) => ({ key: y, label: y })),
  ];
  return (
    <InlinePicker label={label}>
      {(close) => (
        <div className="flex flex-col">
          <div className="kicker text-ink-mute mb-2">Year</div>
          {all.map((t) => (
            <PickerListItem
              key={t.key}
              selected={t.key === value}
              onPress={() => {
                onChange(t.key);
                close();
              }}
            >
              {t.label}
            </PickerListItem>
          ))}
        </div>
      )}
    </InlinePicker>
  );
}

interface StatePickerProps {
  states: string[];
  value: string;
  onChange: (next: string) => void;
}

function StatePicker({ states, value, onChange }: StatePickerProps) {
  return (
    <InlinePicker label={value}>
      {(close) => (
        <div className="flex flex-col">
          <div className="kicker text-ink-mute mb-2">State</div>
          {states.map((s) => (
            <PickerListItem
              key={s}
              selected={s === value}
              onPress={() => {
                onChange(s);
                close();
              }}
            >
              {s}
            </PickerListItem>
          ))}
        </div>
      )}
    </InlinePicker>
  );
}

interface CompareSlotProps {
  states: string[];
  value: string | null;
  onChange: (next: string | null) => void;
}

function CompareSlot({ states, value, onChange }: CompareSlotProps) {
  if (value === null) {
    return (
      <InlinePicker label="+ alongside another state">
        {(close) => (
          <div className="flex flex-col">
            <div className="kicker text-ink-mute mb-2">Compare with</div>
            {states.map((s) => (
              <PickerListItem
                key={s}
                selected={false}
                onPress={() => {
                  onChange(s);
                  close();
                }}
              >
                {s}
              </PickerListItem>
            ))}
          </div>
        )}
      </InlinePicker>
    );
  }
  return (
    <span className="font-display italic text-ink-quiet inline-flex items-baseline gap-2">
      <span>alongside</span>
      <InlinePicker label={value}>
        {(close) => (
          <div className="flex flex-col">
            <div className="kicker text-ink-mute mb-2">Compare with</div>
            <PickerListItem
              selected={false}
              onPress={() => {
                onChange(null);
                close();
              }}
            >
              (none)
            </PickerListItem>
            {states.map((s) => (
              <PickerListItem
                key={s}
                selected={s === value}
                onPress={() => {
                  onChange(s);
                  close();
                }}
              >
                {s}
              </PickerListItem>
            ))}
          </div>
        )}
      </InlinePicker>
      <button
        type="button"
        onClick={() => {
          onChange(null);
        }}
        className="kicker text-ink-faint hover:text-accent transition-colors cursor-pointer"
        aria-label="Clear comparison"
      >
        ×
      </button>
    </span>
  );
}

interface OnThisDayProps {
  dataset: PandemicDataset;
  state: string;
}

function OnThisDay({ dataset, state }: OnThisDayProps) {
  const minDate =
    dataset.cases.from < dataset.deaths.from ? dataset.cases.from : dataset.deaths.from;
  const maxDate = dataset.cases.to > dataset.deaths.to ? dataset.cases.to : dataset.deaths.to;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [date, setDate] = useState<string>("2021-08-26");

  const valid = date >= minDate && date <= maxDate;
  const casesIdx = dayDiff(dataset.cases.from, date);
  const deathsIdx = dayDiff(dataset.deaths.from, date);
  const casesValues = dataset.cases.byState[state];
  const deathsValues = dataset.deaths.byState[state];

  const inCasesRange = valid && date >= dataset.cases.from && date <= dataset.cases.to;
  const inDeathsRange = valid && date >= dataset.deaths.from && date <= dataset.deaths.to;

  const casesValue =
    inCasesRange && casesValues !== undefined && casesIdx >= 0 && casesIdx < casesValues.length
      ? (casesValues[casesIdx] ?? 0)
      : null;
  const deathsValue =
    inDeathsRange && deathsValues !== undefined && deathsIdx >= 0 && deathsIdx < deathsValues.length
      ? (deathsValues[deathsIdx] ?? 0)
      : null;

  const openPicker = () => {
    const el = inputRef.current;
    if (el && typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el?.focus();
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="font-display italic text-ink-quiet text-base sm:text-lg max-w-[44ch]">
        Where the country stood on a particular day, set against the rest of the record.
      </div>
      <div className="relative inline-flex items-baseline gap-3 max-w-xs">
        <input
          ref={inputRef}
          type="date"
          value={date}
          min={minDate}
          max={maxDate}
          onChange={(e) => {
            setDate(e.target.value);
          }}
          className="kronos-bare-date bg-transparent border-0 border-b border-rule focus:border-accent focus:border-b-2 outline-none font-display italic text-lg text-ink py-2 px-0 transition-colors flex-1"
        />
        <button
          type="button"
          onClick={openPicker}
          className="text-ink-mute hover:text-accent transition-colors cursor-pointer"
          aria-label="Open date picker"
        >
          <span aria-hidden="true" className="icon-[lucide--calendar] text-base" />
        </button>
      </div>
      {!valid && (
        <div className="font-display italic text-ink-quiet">
          The record does not extend to that day.
        </div>
      )}
      {valid && (
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col">
            <span className="kicker text-ink-mute">Cases</span>
            <span className="font-display italic text-3xl sm:text-4xl text-ink tabular mt-1">
              {casesValue === null ? "—" : fmtInt(casesValue)}
            </span>
            {!inCasesRange && (
              <span className="marginalia mt-1">
                cases record ended {fmtMonthYearShort(dataset.cases.to)}
              </span>
            )}
          </div>
          <div className="flex flex-col">
            <span className="kicker text-ink-mute">Deaths</span>
            <span className="font-display italic text-3xl sm:text-4xl text-ink tabular mt-1">
              {deathsValue === null ? "—" : fmtInt(deathsValue)}
            </span>
            {!inDeathsRange && (
              <span className="marginalia mt-1">
                deaths record ended {fmtMonthYearShort(dataset.deaths.to)}
              </span>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function PageContent() {
  const { data: dataset, isLoading, dataUpdatedAt } = usePandemic();
  const [state, setState] = useAtom(pandemicStateAtom);
  const [compare, setCompare] = useAtom(pandemicCompareAtom);
  const [year, setYear] = useAtom(pandemicYearAtom);
  const [metric, setMetric] = useState<PandemicMetric>("cases");
  const [highlight, setHighlight] = useState<number | null>(null);

  const series = dataset === undefined ? null : dataset[metric];
  const threshold = metric === "cases" ? CASES_THRESHOLD : DEATHS_THRESHOLD;
  const years = useMemo(
    () => (dataset === undefined ? [] : pickYears(dataset[metric].from, dataset[metric].to)),
    [dataset, metric],
  );
  const effectiveYear = year === "all" || years.includes(year) ? year : "all";
  const slice = useMemo(
    () => (series === null ? null : sliceSeries(series, state, effectiveYear, threshold)),
    [series, state, effectiveYear, threshold],
  );
  const effectiveCompare = compare !== null && compare !== "" && compare !== state ? compare : null;
  const compareSlice = useMemo(
    () =>
      series !== null && effectiveCompare !== null
        ? sliceSeries(series, effectiveCompare, effectiveYear, threshold)
        : null,
    [series, effectiveCompare, effectiveYear, threshold],
  );
  const otherStates = useMemo(
    () => (dataset === undefined ? [] : dataset.states.filter((s) => s !== state)),
    [dataset, state],
  );
  const overlayProp = useMemo(
    () =>
      compareSlice === null ? null : { values: compareSlice.values, label: effectiveCompare ?? "" },
    [compareSlice, effectiveCompare],
  );
  const visibleEvents = useMemo(
    () =>
      slice === null ? [] : NAMED_EVENTS.filter((e) => e.date >= slice.from && e.date <= slice.to),
    [slice],
  );
  const formatHover = useCallback(
    (i: number) => {
      if (slice === null) return { date: "", primary: "", compare: null };
      const date = fmtDate(addDays(slice.from, i), {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
      const v = slice.values[i] ?? 0;
      const primary = `${fmtInt(v)} ${state}`;
      const compareV =
        compareSlice && i < compareSlice.values.length ? (compareSlice.values[i] ?? 0) : null;
      return {
        date,
        primary,
        compare:
          compareV !== null && effectiveCompare !== null
            ? `${fmtInt(compareV)} ${effectiveCompare}`
            : null,
      };
    },
    [slice, state, compareSlice, effectiveCompare],
  );

  if (isLoading || !dataset || !slice || !series) {
    return (
      <div className="reveal-stack mx-auto w-full max-w-3xl flex flex-col gap-10">
        <RunningHead section="Pandemic" folio={FOLIO} />
        <div className="flex justify-center pt-20">
          <Loading>setting the record</Loading>
        </div>
      </div>
    );
  }

  const periodLabel =
    effectiveYear === "all"
      ? `${DateTime.fromISO(slice.from).year}–${DateTime.fromISO(slice.to).year}`
      : effectiveYear;

  const peakOrdinal = slice.peak
    ? fmtDate(slice.peak.date, { day: "numeric", month: "long", year: "numeric" })
    : "—";

  return (
    <div className="reveal-stack mx-auto w-full max-w-3xl flex flex-col gap-14">
      <RunningHead section="Pandemic" folio={FOLIO} />
      <Imprint setAt={dataUpdatedAt} />

      <header className="text-center flex flex-col gap-3">
        <div className="kicker text-ink-mute">SARS-CoV-2 · Malaysia</div>
        <div className="font-display italic text-2xl sm:text-3xl text-ink-quiet max-w-[42ch] mx-auto">
          A standing record of cases and deaths, set from MoH&rsquo;s linelists.
        </div>
      </header>

      {/* I — At a glance */}
      <section className="flex flex-col gap-8">
        <ChapterMark numeral="I" title="At a glance" />

        <div className="flex flex-col gap-7">
          <p className="font-display italic text-lg sm:text-xl text-ink-quiet leading-snug">
            Across{" "}
            <YearPicker
              available={years}
              value={effectiveYear}
              onChange={(y) => void setYear(y)}
              label={periodLabel}
            />
            ,{" "}
            <StatePicker states={dataset.states} value={state} onChange={(s) => void setState(s)} />{" "}
            recorded
          </p>

          <div
            className="font-display italic text-ink tabular leading-[0.92] tracking-tight text-center"
            style={HERO_STYLE}
          >
            {fmtInt(slice.total)}
          </div>

          <div className="flex flex-col items-center gap-3">
            <MetricToggle value={metric} onChange={setMetric} />
            <p className="font-display italic text-ink-quiet text-base sm:text-lg leading-snug">
              <CompareSlot
                states={otherStates}
                value={effectiveCompare}
                onChange={(s) => void setCompare(s)}
              />
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 border-t border-b border-rule-soft py-6">
          <div className="flex flex-col gap-1">
            <span className="kicker text-ink-mute">Peak day</span>
            {slice.peak ? (
              <>
                <span className="font-display italic text-xl text-ink">{peakOrdinal}</span>
                <span className="font-mono tabular text-xs text-ink-quiet">
                  {fmtInt(slice.peak.value)} {metric}
                </span>
              </>
            ) : (
              <span className="font-display italic text-ink-quiet">—</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <span className="kicker text-ink-mute">Daily mean</span>
            <span className="font-display italic text-xl text-ink tabular">
              {fmtInt(slice.mean)}
            </span>
            <span className="font-mono tabular text-xs text-ink-quiet">
              across {slice.values.length} days
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="kicker text-ink-mute">
              {metric === "cases" ? "Days exceeding a thousand" : "Days exceeding ten"}
            </span>
            <span className="font-display italic text-xl text-ink tabular">
              {fmtInt(slice.daysOverThreshold)}
            </span>
            <span className="font-mono tabular text-xs text-ink-quiet">
              of {slice.values.length}
            </span>
          </div>
        </div>
      </section>

      {/* II — The curve */}
      <section className="flex flex-col gap-5">
        <ChapterMark numeral="II" title="The curve" />
        <div className="flex items-baseline gap-3">
          <span className="font-display italic text-ink-quiet text-base">
            Daily {metric}, drawn at hairline weight.
          </span>
          <span className="flex-1 border-t border-dotted border-rule translate-y-[-0.3rem]" />
          <span className="marginalia">
            {fmtMonthYearShort(slice.from)} — {fmtMonthYearShort(slice.to)}
          </span>
        </div>
        <HairlineChart
          values={slice.values}
          height={CHART_HEIGHT}
          highlightIndex={highlight}
          onHighlight={setHighlight}
          ariaLabel={`Daily ${metric} for ${state}, ${periodLabel}`}
          from={slice.from}
          to={slice.to}
          events={visibleEvents}
          primaryLabel={state}
          overlay={overlayProp}
          hoverFormat={formatHover}
        />
      </section>

      {/* III — On a particular day */}
      <section className="flex flex-col gap-6">
        <ChapterMark numeral="III" title="On a particular day" />
        <OnThisDay dataset={dataset} state={state} />
      </section>

      <section className="border-t border-rule-soft pt-8 flex flex-col gap-2">
        <span className="kicker text-ink-mute">Source</span>
        <p className="font-display italic text-sm text-ink-quiet leading-relaxed max-w-[58ch]">
          <span className="float-left font-display not-italic font-normal text-[2.5rem] leading-[0.78] text-accent mr-2 mt-[0.2rem] select-none">
            M
          </span>
          oH Malaysia, via{" "}
          <a
            href="https://data.gov.my"
            className="text-accent hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            data.gov.my
          </a>
          . Cases compiled from the daily epidemic series; deaths from the linelist, one row per
          person. The cases record terminates {fmtDate(dataset.meta.casesTo)}; the deaths linelist
          terminates {fmtDate(dataset.meta.deathsTo)}.
        </p>
      </section>

      <FolioMark folio={FOLIO} />
    </div>
  );
}

export function PandemicPage() {
  return (
    <QueryErrorBoundary>
      <PageContent />
    </QueryErrorBoundary>
  );
}
