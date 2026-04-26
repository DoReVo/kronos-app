import { useEffect, useId, useMemo, useRef, useState } from "react";

interface HairlineChartProps {
  values: number[];
  height?: number;
  highlightIndex?: number | null;
  onHighlight?: (index: number | null) => void;
  ariaLabel?: string;
  overlay?: { values: number[]; ariaLabel?: string } | null;
}

const DEFAULT_HEIGHT = 180;
const PADDING_TOP = 6;
const PADDING_BOTTOM = 14;

const CURSOR_CROSSHAIR_STYLE = { cursor: "crosshair" } as const;
const CURSOR_DEFAULT_STYLE = { cursor: "default" } as const;
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

export function HairlineChart({
  values,
  height = DEFAULT_HEIGHT,
  highlightIndex,
  onHighlight,
  ariaLabel,
  overlay = null,
}: HairlineChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [width, setWidth] = useState(800);
  const reactId = useId();

  useEffect(() => {
    const node = ref.current;
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

  const innerHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const svgStyle = useMemo(() => ({ height }), [height]);

  const max = useMemo(() => {
    let m = 0;
    for (const v of values) if (v > m) m = v;
    if (overlay) for (const v of overlay.values) if (v > m) m = v;
    return m;
  }, [values, overlay]);

  const linePath = useMemo(
    () => buildPath(values, width, innerHeight, max),
    [values, width, innerHeight, max],
  );
  const areaPath = useMemo(
    () => buildArea(values, width, innerHeight, max),
    [values, width, innerHeight, max],
  );
  const overlayPath = useMemo(
    () => (overlay ? buildPath(overlay.values, width, innerHeight, max) : null),
    [overlay, width, innerHeight, max],
  );

  const handleMove = (e: React.PointerEvent<SVGRectElement>) => {
    if (!onHighlight || values.length === 0) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const ratio = (e.clientX - rect.left) / rect.width;
    const i = Math.max(0, Math.min(values.length - 1, Math.round(ratio * (values.length - 1))));
    onHighlight(i);
  };

  const handleLeave = () => {
    if (onHighlight) onHighlight(null);
  };

  const highlightX =
    highlightIndex !== undefined && highlightIndex !== null && values.length > 1
      ? (highlightIndex / (values.length - 1)) * width
      : null;

  return (
    <svg
      ref={ref}
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
        {areaPath !== "" && <path d={areaPath} fill={`url(#fade-${reactId})`} stroke="none" />}
        {overlayPath !== null && (
          <path
            d={overlayPath}
            fill="none"
            stroke="currentColor"
            strokeWidth={0.75}
            strokeOpacity={0.4}
            strokeDasharray="2 2"
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
        {highlightX !== null && (
          <line
            x1={highlightX}
            x2={highlightX}
            y1={0}
            y2={innerHeight}
            stroke="var(--color-accent)"
            strokeWidth={0.75}
          />
        )}
        <line
          x1={0}
          x2={width}
          y1={innerHeight}
          y2={innerHeight}
          stroke="currentColor"
          strokeWidth={0.5}
          strokeOpacity={0.45}
        />
      </g>
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="transparent"
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
        style={onHighlight ? CURSOR_CROSSHAIR_STYLE : CURSOR_DEFAULT_STYLE}
      />
    </svg>
  );
}
