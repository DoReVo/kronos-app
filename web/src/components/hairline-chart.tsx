import { useEffect, useId, useMemo, useRef, useState } from "react";
import { DateTime } from "luxon";

interface ChartEvent {
  date: string;
  label: string;
}

interface HairlineChartProps {
  values: number[];
  height?: number;
  highlightIndex?: number | null;
  onHighlight?: (index: number | null) => void;
  ariaLabel?: string;
  from?: string;
  to?: string;
  events?: ChartEvent[];
  primaryLabel?: string;
  hoverFormat?: (index: number) => { date: string; primary: string; compare?: string | null };
  overlay?: { values: number[]; label?: string } | null;
  peakLabel?: string | undefined;
}

const DEFAULT_HEIGHT = 320;
const PADDING_TOP = 50;
const PADDING_BOTTOM = 22;
const PADDING_RIGHT = 80;
const ANNOTATION_OFFSET = 12;

const ENDLABEL_STYLE = { letterSpacing: "0.08em", textTransform: "uppercase" } as const;
const YEARLABEL_STYLE = { letterSpacing: "0.06em" } as const;
const noop = (): void => {};

function buildPath(values: number[], width: number, innerHeight: number, max: number): string {
  if (values.length === 0 || max <= 0) {
    return `M 0 ${innerHeight} L ${width} ${innerHeight}`;
  }
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const parts = values.map((v, i) => {
    const x = i * step;
    const y = innerHeight - (v / max) * innerHeight;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  });
  return parts.join(" ");
}

function buildArea(values: number[], width: number, innerHeight: number, max: number): string {
  if (values.length === 0 || max <= 0) return "";
  const line = buildPath(values, width, innerHeight, max);
  const lastX = values.length > 1 ? width : 0;
  return `${line} L ${lastX.toFixed(2)} ${innerHeight} L 0 ${innerHeight} Z`;
}

interface EventAnnotationProps {
  x: number;
  row: number;
  label: string;
}

function EventAnnotation({ x, row, label }: EventAnnotationProps) {
  const style = useMemo(
    () => ({ left: x, top: row === 0 ? 0 : 14, transform: "translateX(-50%)", maxWidth: 140 }),
    [x, row],
  );
  return (
    <div
      className="absolute marginalia text-ink-mute pointer-events-none whitespace-nowrap"
      style={style}
    >
      {label}
    </div>
  );
}

interface HoverAnnotationProps {
  left: number;
  top: number;
  date: string;
  primary: string;
  compare: string | null;
}

function HoverAnnotation({ left, top, date, primary, compare }: HoverAnnotationProps) {
  const style = useMemo(() => ({ left, top }), [left, top]);
  return (
    <div className="absolute pointer-events-none flex flex-col items-start" style={style}>
      <span className="font-mono tabular text-[10px] text-ink-mute uppercase tracking-wider">
        {date}
      </span>
      <span className="font-display italic text-base text-ink tabular leading-tight mt-0.5">
        {primary}
      </span>
      {compare !== null && (
        <span className="font-display italic text-sm text-ink-mute tabular leading-tight">
          {compare}
        </span>
      )}
    </div>
  );
}

function indexFor(date: string, from: string, total: number): number {
  const a = DateTime.fromISO(from, { zone: "utc" });
  const b = DateTime.fromISO(date, { zone: "utc" });
  const days = Math.round(b.diff(a, "days").days);
  if (days < 0 || days >= total) return -1;
  return days;
}

function yAtIndex(values: number[], i: number, innerHeight: number, max: number): number {
  if (i < 0 || i >= values.length || max <= 0) return innerHeight;
  return innerHeight - ((values[i] ?? 0) / max) * innerHeight;
}

interface YearMark {
  x: number;
  label: string;
}

interface YearLabel {
  x: number;
  label: string;
}

function yearBoundaries(from: string, to: string, total: number, plotWidth: number): YearMark[] {
  if (total <= 1) return [];
  const start = DateTime.fromISO(from, { zone: "utc" }).year;
  const end = DateTime.fromISO(to, { zone: "utc" }).year;
  const marks: YearMark[] = [];
  for (let y = start + 1; y <= end; y++) {
    const date = `${y}-01-01`;
    const i = indexFor(date, from, total);
    if (i < 0) continue;
    const x = (i / (total - 1)) * plotWidth;
    marks.push({ x, label: String(y).slice(-2) });
  }
  return marks;
}

function yearMidpointLabels(
  from: string,
  to: string,
  total: number,
  plotWidth: number,
): YearLabel[] {
  if (total <= 1) return [];
  const startYear = DateTime.fromISO(from, { zone: "utc" }).year;
  const endYear = DateTime.fromISO(to, { zone: "utc" }).year;
  const labels: YearLabel[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const slotStart = y === startYear ? from : `${y}-01-01`;
    const slotEnd = y === endYear ? to : `${y}-12-31`;
    const iStart = indexFor(slotStart, from, total);
    const iEnd = indexFor(slotEnd, from, total);
    if (iStart < 0 || iEnd < 0) continue;
    const xStart = (iStart / (total - 1)) * plotWidth;
    const xEnd = (iEnd / (total - 1)) * plotWidth;
    labels.push({ x: (xStart + xEnd) / 2, label: String(y).slice(-2) });
  }
  return labels;
}

export function HairlineChart({
  values,
  height = DEFAULT_HEIGHT,
  highlightIndex,
  onHighlight,
  ariaLabel,
  from,
  to,
  events = [],
  primaryLabel,
  hoverFormat,
  overlay = null,
  peakLabel,
}: HairlineChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(800);
  const reactId = useId();

  useEffect(() => {
    const node = containerRef.current;
    if (node === null) {
      return noop;
    }
    const initial = node.getBoundingClientRect().width;
    if (initial > 0) setWidth(initial);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const next = entry.contentRect.width;
      if (next > 0) setWidth(next);
    });
    ro.observe(node);
    return () => {
      ro.disconnect();
    };
  }, []);

  const plotWidth = Math.max(0, width - PADDING_RIGHT);
  const innerHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const svgStyle = useMemo(() => ({ height }), [height]);

  const max = useMemo(() => {
    let m = 0;
    for (const v of values) if (v > m) m = v;
    if (overlay) for (const v of overlay.values) if (v > m) m = v;
    return m;
  }, [values, overlay]);

  const linePath = useMemo(
    () => buildPath(values, plotWidth, innerHeight, max),
    [values, plotWidth, innerHeight, max],
  );
  const areaPath = useMemo(
    () => buildArea(values, plotWidth, innerHeight, max),
    [values, plotWidth, innerHeight, max],
  );
  const overlayPath = useMemo(
    () => (overlay ? buildPath(overlay.values, plotWidth, innerHeight, max) : null),
    [overlay, plotWidth, innerHeight, max],
  );

  const yearLines = useMemo(
    () =>
      from !== undefined && to !== undefined
        ? yearBoundaries(from, to, values.length, plotWidth)
        : [],
    [from, to, values.length, plotWidth],
  );

  const yearLabels = useMemo(
    () =>
      from !== undefined && to !== undefined
        ? yearMidpointLabels(from, to, values.length, plotWidth)
        : [],
    [from, to, values.length, plotWidth],
  );

  const eventMarks = useMemo(() => {
    if (from === undefined || values.length === 0) return [];
    return events
      .map((e, idx) => {
        const i = indexFor(e.date, from, values.length);
        if (i < 0) return null;
        const x = values.length > 1 ? (i / (values.length - 1)) * plotWidth : 0;
        const y = yAtIndex(values, i, innerHeight, max);
        return { ...e, x, y, i, row: idx % 2 };
      })
      .filter(
        (
          m,
        ): m is {
          date: string;
          label: string;
          x: number;
          y: number;
          i: number;
          row: number;
        } => m !== null,
      );
  }, [events, from, values, plotWidth, innerHeight, max]);

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onHighlight || values.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / Math.max(1, plotWidth);
    const i = Math.max(0, Math.min(values.length - 1, Math.round(ratio * (values.length - 1))));
    onHighlight(i);
  };

  const handleLeave = () => {
    if (onHighlight) onHighlight(null);
  };

  const overlayStyle = useMemo(
    () => ({
      top: PADDING_TOP,
      bottom: PADDING_BOTTOM,
      right: PADDING_RIGHT,
      cursor: onHighlight ? ("crosshair" as const) : ("default" as const),
    }),
    [onHighlight],
  );

  const highlightX =
    highlightIndex !== undefined && highlightIndex !== null && values.length > 1
      ? (highlightIndex / (values.length - 1)) * plotWidth
      : null;

  const primaryEndY =
    values.length > 0 ? yAtIndex(values, values.length - 1, innerHeight, max) : innerHeight;
  const overlayEndY =
    overlay && overlay.values.length > 0
      ? yAtIndex(overlay.values, overlay.values.length - 1, innerHeight, max)
      : null;

  const hoverInfo =
    hoverFormat && highlightIndex !== undefined && highlightIndex !== null
      ? hoverFormat(highlightIndex)
      : null;

  const highlightCurveY =
    highlightIndex !== undefined && highlightIndex !== null
      ? yAtIndex(values, highlightIndex, innerHeight, max)
      : null;

  const peakInfo = useMemo(() => {
    if (values.length === 0 || max <= 0) return null;
    let peakIdx = 0;
    let peakVal = values[0] ?? 0;
    for (let i = 1; i < values.length; i++) {
      const v = values[i] ?? 0;
      if (v > peakVal) {
        peakVal = v;
        peakIdx = i;
      }
    }
    if (peakVal <= 0) return null;
    const x = values.length > 1 ? (peakIdx / (values.length - 1)) * plotWidth : 0;
    const y = yAtIndex(values, peakIdx, innerHeight, max);
    return { x, y, value: peakVal };
  }, [values, plotWidth, innerHeight, max]);

  return (
    <div ref={containerRef} className="relative w-full" style={svgStyle}>
      <svg
        role="img"
        aria-label={ariaLabel}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="block w-full text-ink"
        style={svgStyle}
      >
        <defs>
          <linearGradient id={`fade-${reactId}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>

        <g transform={`translate(0, ${PADDING_TOP})`}>
          {/* year boundary hairlines */}
          {yearLines.map((y) => (
            <line
              key={`yb-${y.label}`}
              x1={y.x}
              x2={y.x}
              y1={0}
              y2={innerHeight}
              stroke="currentColor"
              strokeWidth={0.5}
              strokeOpacity={0.18}
              strokeDasharray="1 3"
            />
          ))}

          {/* event hairlines */}
          {eventMarks.map((e) => (
            <g key={`ev-${e.date}`}>
              <line
                x1={e.x}
                x2={e.x}
                y1={e.row === 0 ? -PADDING_TOP + 16 : -PADDING_TOP + 30}
                y2={e.y}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeOpacity={0.4}
              />
            </g>
          ))}

          {areaPath !== "" && <path d={areaPath} fill={`url(#fade-${reactId})`} stroke="none" />}
          {overlayPath !== null && (
            <path
              d={overlayPath}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.85}
              strokeOpacity={0.45}
              strokeDasharray="3 2"
              strokeLinejoin="round"
            />
          )}
          <path
            d={linePath}
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            strokeLinejoin="round"
          />

          {highlightX !== null && highlightCurveY !== null && (
            <g>
              <line
                x1={highlightX}
                x2={highlightX}
                y1={0}
                y2={highlightCurveY}
                stroke="var(--color-accent)"
                strokeWidth={0.75}
              />
              <circle
                cx={highlightX}
                cy={highlightCurveY}
                r={2.5}
                fill="var(--color-accent)"
                stroke="var(--color-paper)"
                strokeWidth={1}
              />
            </g>
          )}

          {/* peak callout — mono number floating above the apex */}
          {peakLabel !== undefined && peakInfo !== null && highlightX === null && (
            <g>
              <line
                x1={peakInfo.x}
                x2={peakInfo.x}
                y1={Math.max(0, peakInfo.y - 14)}
                y2={peakInfo.y}
                stroke="currentColor"
                strokeWidth={0.5}
                strokeOpacity={0.4}
              />
              <text
                x={peakInfo.x}
                y={Math.max(0, peakInfo.y - 18)}
                fontFamily="var(--font-mono)"
                fontSize="10"
                textAnchor="middle"
                fill="currentColor"
                opacity={0.7}
                style={ENDLABEL_STYLE}
              >
                {peakLabel}
              </text>
            </g>
          )}

          {/* baseline rule extends across plot only */}
          <line
            x1={0}
            x2={plotWidth}
            y1={innerHeight}
            y2={innerHeight}
            stroke="currentColor"
            strokeWidth={0.5}
            strokeOpacity={0.45}
          />

          {/* primary curve label at right end */}
          {primaryLabel !== undefined && values.length > 0 && (
            <text
              x={plotWidth + 6}
              y={primaryEndY}
              dy="0.32em"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="currentColor"
              opacity={0.85}
              style={ENDLABEL_STYLE}
            >
              {primaryLabel.toUpperCase()}
            </text>
          )}

          {/* overlay (compare) label at right end */}
          {overlay && overlay.label !== undefined && overlayEndY !== null && (
            <text
              x={plotWidth + 6}
              y={overlayEndY}
              dy="0.32em"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="currentColor"
              opacity={0.55}
              style={ENDLABEL_STYLE}
            >
              {overlay.label.toUpperCase()}
            </text>
          )}
        </g>

        {/* year labels under baseline (midpoint per year) */}
        <g transform={`translate(0, ${PADDING_TOP + innerHeight + 14})`}>
          {yearLabels.map((y) => (
            <text
              key={`yl-${y.label}`}
              x={y.x}
              y={0}
              fontFamily="var(--font-mono)"
              fontSize="10"
              textAnchor="middle"
              fill="currentColor"
              opacity={0.55}
              style={YEARLABEL_STYLE}
            >
              {y.label}
            </text>
          ))}
        </g>
      </svg>

      {/* event annotations (DOM, real typography) — staggered into two rows */}
      {eventMarks.map((e) => (
        <EventAnnotation key={`evlabel-${e.date}`} x={e.x} row={e.row} label={e.label} />
      ))}

      {/* hover annotation, floating next to the scrub line */}
      {highlightX !== null && hoverInfo !== null && (
        <HoverAnnotation
          left={Math.min(highlightX + ANNOTATION_OFFSET, plotWidth - 160)}
          top={PADDING_TOP - 14}
          date={hoverInfo.date}
          primary={hoverInfo.primary}
          compare={hoverInfo.compare ?? null}
        />
      )}

      {/* pointer capture overlay — tracks the plot area only */}
      <div
        className="absolute left-0"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        onPointerCancel={handleLeave}
        onPointerUp={handleLeave}
        style={overlayStyle}
      />
    </div>
  );
}
