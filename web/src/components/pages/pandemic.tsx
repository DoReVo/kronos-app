import { useMemo, useState } from "react";
import { useAtom } from "jotai";
import { DateTime } from "luxon";
import type { PandemicDataset, PandemicMetric } from "@kronos/common";
import { pandemicCompareAtom, pandemicStateAtom, pandemicYearAtom } from "../../atoms";
import { usePandemic } from "../../hooks/use-pandemic";
import { Loading } from "../base/loading";
import { FolioMark, RunningHead } from "../page-frame";
import { Imprint } from "../imprint";
import { QueryErrorBoundary } from "../../query/query-provider";
import { Switch } from "../base/Switch";
import { PandemicStateSelector } from "../pandemic-state-selector";
import { HairlineChart } from "../hairline-chart";
import { addDays, dayDiff, pickYears, sliceSeries } from "../../lib/pandemic-slice";

const FOLIO = "06";
const HERO_STYLE = { fontSize: "clamp(4rem,15vw,9rem)" } as const;
const CASES_THRESHOLD = 1000;
const DEATHS_THRESHOLD = 10;

function metricLabel(metric: PandemicMetric): string {
  return metric === "cases" ? "cases" : "deaths";
}

function fmtInt(n: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(n));
}

function fmtDate(iso: string, opts?: Intl.DateTimeFormatOptions): string {
  const dt = DateTime.fromISO(iso);
  return dt.toLocaleString(opts ?? { day: "numeric", month: "long", year: "numeric" });
}

interface YearTabsProps {
  available: string[];
  value: string;
  onChange: (year: string) => void;
}

function YearTabs({ available, value, onChange }: YearTabsProps) {
  const all: { key: string; label: string }[] = [
    { key: "all", label: "all" },
    ...available.map((y) => ({ key: y, label: y })),
  ];
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 kicker">
      {all.map((t, i) => (
        <span key={t.key} className="inline-flex items-baseline gap-3">
          {i > 0 && (
            <span aria-hidden="true" className="text-ink-faint">
              ·
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              onChange(t.key);
            }}
            className={
              t.key === value
                ? "text-accent border-b border-accent pb-px transition-colors cursor-pointer"
                : "text-ink-mute hover:text-accent transition-colors cursor-pointer"
            }
          >
            {t.label}
          </button>
        </span>
      ))}
    </div>
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

  return (
    <section className="flex flex-col gap-5 pt-4">
      <div className="flex items-baseline gap-3">
        <span className="kicker text-ink-mute">On this day</span>
        <span className="flex-1 border-t border-dotted border-rule translate-y-[-0.3rem]" />
        <span className="marginalia">{state}</span>
      </div>
      <input
        type="date"
        value={date}
        min={minDate}
        max={maxDate}
        onChange={(e) => {
          setDate(e.target.value);
        }}
        className="bg-transparent border-0 border-b border-rule focus:border-accent focus:border-b-2 outline-none font-display italic text-lg text-ink py-2 px-0 transition-colors w-full max-w-xs"
      />
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
                cases record ended{" "}
                {fmtDate(dataset.cases.to, { day: "numeric", month: "short", year: "numeric" })}
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
                deaths record ended{" "}
                {fmtDate(dataset.deaths.to, { day: "numeric", month: "short", year: "numeric" })}
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
      compareSlice === null
        ? null
        : { values: compareSlice.values, ariaLabel: effectiveCompare ?? "" },
    [compareSlice, effectiveCompare],
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

  const period =
    effectiveYear === "all"
      ? `${fmtDate(slice.from, { year: "numeric" })}–${fmtDate(slice.to, { year: "numeric" })}`
      : effectiveYear;

  const highlightDate = highlight === null ? null : addDays(slice.from, highlight);
  const highlightValue =
    highlight === null || highlight >= slice.values.length ? null : (slice.values[highlight] ?? 0);
  const highlightCompare =
    compareSlice === null || highlight === null || highlight >= compareSlice.values.length
      ? null
      : (compareSlice.values[highlight] ?? 0);
  const compareLabel = effectiveCompare;

  const dailyAvg = slice.mean;

  return (
    <div className="reveal-stack mx-auto w-full max-w-3xl flex flex-col gap-12">
      <RunningHead section="Pandemic" folio={FOLIO} />
      <Imprint setAt={dataUpdatedAt} />

      <header className="text-center flex flex-col gap-3">
        <div className="kicker text-ink-mute">SARS-CoV-2 · Malaysia</div>
        <div className="font-display italic text-2xl sm:text-3xl text-ink-quiet max-w-[42ch] mx-auto">
          A standing record of cases and deaths, set from MoH&rsquo;s linelists.
        </div>
      </header>

      <div className="flex justify-center">
        <Switch
          isSelected={metric === "deaths"}
          onChange={(b) => {
            setMetric(b ? "deaths" : "cases");
          }}
          offLabel="cases"
          onLabel="deaths"
        >
          Reading
        </Switch>
      </div>

      <section className="flex flex-col items-center text-center gap-4">
        <div className="kicker text-accent">
          <span className="text-ink-faint">·</span> {state}{" "}
          <span className="text-ink-faint">·</span> {period}{" "}
          <span className="text-ink-faint">·</span>
        </div>
        <div
          className="font-display italic text-ink tabular leading-[0.92] tracking-tight"
          style={HERO_STYLE}
        >
          {fmtInt(slice.total)}
        </div>
        <div className="font-display italic text-base sm:text-lg text-ink-quiet max-w-[44ch]">
          {metricLabel(metric)} recorded across the period.
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 border-t border-b border-rule-soft py-6">
        <div className="flex flex-col gap-1">
          <span className="kicker text-ink-mute">Peak day</span>
          {slice.peak ? (
            <>
              <span className="font-display italic text-xl text-ink">
                {fmtDate(slice.peak.date, { day: "numeric", month: "short", year: "2-digit" })}
              </span>
              <span className="font-mono tabular text-xs text-ink-quiet">
                {fmtInt(slice.peak.value)} {metricLabel(metric)}
              </span>
            </>
          ) : (
            <span className="font-display italic text-ink-quiet">—</span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <span className="kicker text-ink-mute">Daily mean</span>
          <span className="font-display italic text-xl text-ink tabular">{fmtInt(dailyAvg)}</span>
          <span className="font-mono tabular text-xs text-ink-quiet">
            across {slice.values.length} days
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="kicker text-ink-mute">Days ≥ {metric === "cases" ? "1,000" : "10"}</span>
          <span className="font-display italic text-xl text-ink tabular">
            {fmtInt(slice.daysOverThreshold)}
          </span>
          <span className="font-mono tabular text-xs text-ink-quiet">of {slice.values.length}</span>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline gap-3">
          <span className="kicker text-ink-mute">Curve</span>
          <span className="flex-1 border-t border-dotted border-rule translate-y-[-0.3rem]" />
          <span className="marginalia">
            {fmtDate(slice.from, { day: "numeric", month: "short", year: "2-digit" })} —{" "}
            {fmtDate(slice.to, { day: "numeric", month: "short", year: "2-digit" })}
          </span>
        </div>
        <HairlineChart
          values={slice.values}
          highlightIndex={highlight}
          onHighlight={setHighlight}
          ariaLabel={`Daily ${metric} for ${state}, ${period}`}
          overlay={overlayProp}
        />
        <div className="flex items-baseline justify-between min-h-[1.5rem]">
          <span className="font-mono tabular text-xs text-ink-mute">
            {highlightDate === null
              ? ""
              : fmtDate(highlightDate, { day: "numeric", month: "long", year: "numeric" })}
          </span>
          <span className="font-mono tabular text-xs text-ink">
            {highlightValue === null ? "" : `${fmtInt(highlightValue)} ${state}`}
            {highlightCompare !== null && compareLabel !== null ? (
              <span className="text-ink-mute">
                {" · "}
                {fmtInt(highlightCompare)} {compareLabel}
              </span>
            ) : null}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <div className="flex items-baseline gap-3">
          <span className="kicker text-ink-mute">Set the reading</span>
          <span className="flex-1 border-t border-rule" />
        </div>

        <div className="flex flex-col gap-2">
          <span className="kicker text-ink-mute">Year</span>
          <YearTabs available={years} value={effectiveYear} onChange={(y) => void setYear(y)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <PandemicStateSelector
            label="State"
            value={state}
            onChange={(s) => void setState(s ?? "Malaysia")}
            states={dataset.states}
          />
          <PandemicStateSelector
            label="Compare with"
            value={compare}
            onChange={(s) => void setCompare(s)}
            states={otherStates}
            placeholder="(none)"
            allowClear
          />
        </div>
      </section>

      <OnThisDay dataset={dataset} state={state} />

      <section className="border-t border-rule-soft pt-6 flex flex-col gap-2">
        <span className="kicker text-ink-mute">Source</span>
        <p className="font-display italic text-sm text-ink-quiet leading-relaxed max-w-[58ch]">
          MoH Malaysia, via{" "}
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
