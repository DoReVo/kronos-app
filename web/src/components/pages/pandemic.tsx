import { Fragment, useCallback, useMemo, useState } from "react";
import { useAtom } from "jotai";
import { DateTime } from "luxon";
import {
  DatePicker,
  DateInput,
  DateSegment,
  Group,
  Dialog,
  Calendar,
  CalendarGrid,
  CalendarGridHeader,
  CalendarHeaderCell,
  CalendarGridBody,
  CalendarCell,
  Heading,
  Popover as AriaPopover,
  ToggleButton,
  ToggleButtonGroup,
  Button as AriaButton,
} from "react-aria-components";
import cs from "clsx";
import type { Key } from "react-aria";
import { parseDate, type CalendarDate } from "@internationalized/date";
import type { PandemicDataset, PandemicMetric } from "@kronos/common";
import { pandemicCompareAtom, pandemicStateAtom, pandemicYearAtom } from "../../atoms";
import { usePandemic } from "../../hooks/use-pandemic";
import { Loading } from "../base/loading";
import { FolioMark, RunningHead } from "../page-frame";
import { Imprint } from "../imprint";
import { QueryErrorBoundary } from "../../query/query-provider";
import { InlinePicker, type InlinePickerItem } from "../inline-picker";
import { HairlineChart } from "../hairline-chart";
import { addDays, dayDiff, pickYears, sliceSeries } from "../../lib/pandemic-slice";

const FOLIO = "06";
const HERO_STYLE = { fontSize: "clamp(4rem,15vw,9rem)" } as const;
const METRIC_STYLE = { fontSize: "clamp(1.75rem,4.5vw,2.5rem)" } as const;
const CASES_THRESHOLD = 1000;
const DEATHS_THRESHOLD = 10;
const CHART_HEIGHT = 320;
const DEFAULT_LOOKUP_DATE = "2021-08-26";

const NAMED_EVENTS: { date: string; label: string }[] = [
  { date: "2020-03-18", label: "MCO begins" },
  { date: "2021-02-24", label: "vaccine rollout" },
  { date: "2021-08-26", label: "delta peak" },
  { date: "2022-04-01", label: "endemic transition" },
];

const METRIC_OPTIONS: readonly PandemicMetric[] = ["cases", "deaths"] as const;

function isMetric(v: unknown): v is PandemicMetric {
  return v === "cases" || v === "deaths";
}

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

function clampIso(iso: string, min: string, max: string): string {
  if (iso < min) return min;
  if (iso > max) return max;
  return iso;
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
  const selectedKeys = useMemo(() => new Set<Key>([value]), [value]);
  return (
    <ToggleButtonGroup
      selectionMode="single"
      disallowEmptySelection
      selectedKeys={selectedKeys}
      onSelectionChange={(keys) => {
        const [next] = keys;
        if (isMetric(next)) onChange(next);
      }}
      aria-label="Metric"
      className="flex items-baseline gap-6 select-none"
    >
      {METRIC_OPTIONS.map((m, i) => (
        <Fragment key={m}>
          {i > 0 && (
            <span aria-hidden="true" className="text-ink-faint text-2xl">
              ·
            </span>
          )}
          <ToggleButton
            id={m}
            className={
              "font-display italic transition-colors cursor-pointer outline-none " +
              "text-ink-quiet hover:text-accent " +
              "data-[focus-visible]:text-accent " +
              "data-[selected]:text-ink data-[selected]:border-b-2 data-[selected]:border-accent data-[selected]:pb-1"
            }
            style={METRIC_STYLE}
          >
            {m}
          </ToggleButton>
        </Fragment>
      ))}
    </ToggleButtonGroup>
  );
}

interface YearPickerProps {
  available: string[];
  value: string;
  onChange: (next: string) => void;
  label: string;
}

function YearPicker({ available, value, onChange, label }: YearPickerProps) {
  const items = useMemo<InlinePickerItem[]>(
    () => [{ key: "all", label: "all years" }, ...available.map((y) => ({ key: y, label: y }))],
    [available],
  );
  return (
    <InlinePicker
      trigger={label}
      ariaLabel="Year"
      header="Year"
      items={items}
      selectedKey={value}
      onAction={onChange}
    />
  );
}

interface StatePickerProps {
  states: string[];
  value: string;
  onChange: (next: string) => void;
}

function StatePicker({ states, value, onChange }: StatePickerProps) {
  const items = useMemo<InlinePickerItem[]>(
    () => states.map((s) => ({ key: s, label: s })),
    [states],
  );
  return (
    <InlinePicker
      trigger={value}
      ariaLabel="State"
      header="State"
      items={items}
      selectedKey={value}
      onAction={onChange}
    />
  );
}

interface CompareSlotProps {
  states: string[];
  value: string | null;
  onChange: (next: string | null) => void;
}

function CompareSlot({ states, value, onChange }: CompareSlotProps) {
  const items = useMemo<InlinePickerItem[]>(
    () => states.map((s) => ({ key: s, label: s })),
    [states],
  );
  if (value === null) {
    return (
      <InlinePicker
        trigger="+ alongside another state"
        ariaLabel="Compare with"
        header="Compare with"
        items={items}
        onAction={(key) => {
          onChange(key);
        }}
      />
    );
  }
  return (
    <span className="font-display italic text-ink-quiet inline-flex items-baseline gap-2">
      <span>alongside</span>
      <InlinePicker
        trigger={value}
        ariaLabel="Compare with"
        header="Compare with"
        items={items}
        selectedKey={value}
        onAction={(key) => {
          onChange(key);
        }}
      />
      <AriaButton
        onPress={() => {
          onChange(null);
        }}
        className="kicker text-ink-faint hover:text-accent transition-colors cursor-pointer outline-none data-[focus-visible]:text-accent"
        aria-label="Clear comparison"
      >
        ×
      </AriaButton>
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

  const minCal = useMemo(() => parseDate(minDate), [minDate]);
  const maxCal = useMemo(() => parseDate(maxDate), [maxDate]);
  const initialIso = useMemo(
    () => clampIso(DEFAULT_LOOKUP_DATE, minDate, maxDate),
    [minDate, maxDate],
  );

  const [date, setDate] = useState<CalendarDate>(() => parseDate(initialIso));
  const dateIso = date.toString();

  const casesIdx = dayDiff(dataset.cases.from, dateIso);
  const deathsIdx = dayDiff(dataset.deaths.from, dateIso);
  const casesValues = dataset.cases.byState[state];
  const deathsValues = dataset.deaths.byState[state];

  const inCasesRange = dateIso >= dataset.cases.from && dateIso <= dataset.cases.to;
  const inDeathsRange = dateIso >= dataset.deaths.from && dateIso <= dataset.deaths.to;

  const casesValue =
    inCasesRange && casesValues !== undefined && casesIdx >= 0 && casesIdx < casesValues.length
      ? (casesValues[casesIdx] ?? 0)
      : null;
  const deathsValue =
    inDeathsRange && deathsValues !== undefined && deathsIdx >= 0 && deathsIdx < deathsValues.length
      ? (deathsValues[deathsIdx] ?? 0)
      : null;

  return (
    <section className="flex flex-col gap-6">
      <div className="font-display italic text-ink-quiet text-base sm:text-lg max-w-[44ch]">
        Where the country stood on a particular day, set against the rest of the record.
      </div>
      <DatePicker
        value={date}
        onChange={(d) => {
          if (d !== null) setDate(d);
        }}
        minValue={minCal}
        maxValue={maxCal}
        aria-label="Date"
        className="inline-flex"
      >
        <Group
          className={
            "inline-flex items-baseline gap-2 " +
            "border-0 border-b border-rule data-[focus-within]:border-accent data-[focus-within]:border-b-2 " +
            "py-2 transition-colors"
          }
        >
          <DateInput className="inline-flex items-baseline gap-px font-display italic text-lg text-ink">
            {(segment) => (
              <DateSegment
                segment={segment}
                className={
                  "px-0.5 outline-none tabular " +
                  "data-[type=literal]:text-ink-mute data-[type=literal]:px-0 " +
                  "data-[placeholder]:text-ink-mute data-[placeholder]:italic " +
                  "data-[focused]:bg-accent-soft data-[focused]:text-accent"
                }
              />
            )}
          </DateInput>
          <AriaButton
            aria-label="Open calendar"
            className={
              "text-ink-mute hover:text-accent data-[focus-visible]:text-accent " +
              "transition-colors cursor-pointer outline-none px-1"
            }
          >
            <span aria-hidden="true" className="icon-[lucide--calendar] text-base" />
          </AriaButton>
        </Group>
        <AriaPopover
          placement="bottom start"
          offset={8}
          className={
            "bg-paper border border-ink-faint " +
            "shadow-[0_8px_24px_-12px_rgba(26,22,18,0.18)] rounded-none " +
            "px-4 py-4"
          }
        >
          <Dialog className="outline-none">
            <Calendar className="flex flex-col gap-3">
              <header className="flex items-center justify-between gap-4">
                <AriaButton
                  slot="previous"
                  className={
                    "text-ink-mute hover:text-accent data-[focus-visible]:text-accent " +
                    "data-[disabled]:text-ink-faint data-[disabled]:cursor-not-allowed " +
                    "transition-colors cursor-pointer outline-none p-1"
                  }
                >
                  <span aria-hidden="true" className="icon-[lucide--chevron-left] text-base" />
                </AriaButton>
                <Heading className="font-display italic text-base text-ink" />
                <AriaButton
                  slot="next"
                  className={
                    "text-ink-mute hover:text-accent data-[focus-visible]:text-accent " +
                    "data-[disabled]:text-ink-faint data-[disabled]:cursor-not-allowed " +
                    "transition-colors cursor-pointer outline-none p-1"
                  }
                >
                  <span aria-hidden="true" className="icon-[lucide--chevron-right] text-base" />
                </AriaButton>
              </header>
              <CalendarGrid className="border-collapse">
                <CalendarGridHeader>
                  {(day) => (
                    <CalendarHeaderCell className="kicker text-ink-mute pb-2 px-1 text-center">
                      {day}
                    </CalendarHeaderCell>
                  )}
                </CalendarGridHeader>
                <CalendarGridBody>
                  {(d) => (
                    <CalendarCell
                      date={d}
                      className={({
                        isSelected,
                        isOutsideMonth,
                        isUnavailable,
                        isDisabled,
                        isFocusVisible,
                        isHovered,
                      }) =>
                        cs(
                          "h-7 w-9 text-center font-mono tabular text-sm cursor-pointer outline-none transition-colors",
                          isOutsideMonth
                            ? "invisible"
                            : isUnavailable || isDisabled
                              ? "text-ink-faint cursor-not-allowed"
                              : isSelected
                                ? "text-accent border-b border-accent"
                                : isHovered || isFocusVisible
                                  ? "text-ink bg-paper-deep"
                                  : "text-ink-quiet",
                        )
                      }
                    />
                  )}
                </CalendarGridBody>
              </CalendarGrid>
            </Calendar>
          </Dialog>
        </AriaPopover>
      </DatePicker>
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
  const effectiveCompare = compare !== null && compare !== state ? compare : null;
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
