"use client";

import { useCallback, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

// Right-of-cursor series fade during hover. Plexo's dark surfaces need a bit
// more presence than DataFast's 0.36 to stay legible.
export const HOVER_SERIES_OPACITY = 0.45;

// Shared active-dot chrome: series-colored fill with a ring in the card
// surface color (charts always sit on a card, not the page background).
export const ACTIVE_DOT = { r: 4, stroke: "var(--card)", strokeWidth: 2 } as const;

export const CHART_CURSOR = {
   stroke: "var(--chart-cursor)",
   strokeWidth: 1,
   strokeDasharray: "5 8",
   opacity: 0.42,
} as const;

export const BAR_CURSOR = { fill: "var(--chart-cursor)", opacity: 0.08 } as const;

export const MOUNT_ANIMATION = {
   animationDuration: 800,
   animationEasing: "ease-out",
} as const;

// recharts 3 reports TooltipIndex as a numeric string (2.x used numbers); its
// chart-level mouse state carries only the index, never activePayload.
export const parseTooltipIndex = (raw: unknown): number | null => {
   const parsed = typeof raw === "number" ? raw : raw != null ? Number(raw) : NaN;
   return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
};

interface ChartHoverState {
   isTooltipActive?: boolean;
   activeTooltipIndex?: number | string | null;
}

export const useChartHover = () => {
   const prefersReducedMotion = useReducedMotion();
   const hoveredOnceRef = useRef(false);
   const [hasHoveredOnce, setHasHoveredOnce] = useState(false);
   const [hoverIdx, setHoverIdx] = useState<number | null>(null);

   const onMouseMove = useCallback((state: ChartHoverState) => {
      if (!state?.isTooltipActive) return;
      if (!hoveredOnceRef.current) {
         hoveredOnceRef.current = true;
         setHasHoveredOnce(true);
      }
      const idx = parseTooltipIndex(state.activeTooltipIndex);
      setHoverIdx((prev) => (prev === idx ? prev : idx));
   }, []);

   const onMouseLeave = useCallback(() => setHoverIdx(null), []);

   return {
      hoverIdx,
      hovering: hoverIdx !== null,
      // Draw-in runs on mount only, and never re-triggers once the user has
      // interacted — a mid-hover redraw reads as a glitch.
      baseAnimate: !prefersReducedMotion && !hasHoveredOnce,
      onMouseMove,
      onMouseLeave,
   };
};

interface CustomBarProps {
   x?: number;
   y?: number;
   width?: number;
   height?: number;
   fill?: string;
   fillOpacity?: number;
   barCount: number;
}

// Rounded-top bar with adaptive radius (ported from zerocut's custom-bar).
// Recharts' `radius` prop rounds corners independently of bar height, which
// distorts short bars; this clamps the radius to min(r, h/2, w/2) and floors
// non-zero bars at 4px so tiny values stay visible. Bottom edge stays square
// on the baseline.
export const CustomBar = ({
   x = 0,
   y = 0,
   width = 0,
   height = 0,
   fill,
   fillOpacity = 1,
   barCount,
}: CustomBarProps) => {
   if (width <= 0 || height <= 0) return null;

   const bottom = y + height;
   const minH = 4;
   const h = height < minH ? minH : height;
   const top = bottom - h;

   let radius = barCount > 90 ? 2.5 : 5;
   radius = Math.min(radius, Math.floor(h / 2), Math.floor(width / 2));
   if (radius < 0) radius = 0;

   const r = radius;
   const d = r
      ? `M ${x},${top + r} Q ${x},${top} ${x + r},${top} L ${x + width - r},${top} Q ${x + width},${top} ${x + width},${top + r} L ${x + width},${bottom} L ${x},${bottom} Z`
      : `M ${x},${top} L ${x + width},${top} L ${x + width},${bottom} L ${x},${bottom} Z`;

   return <path d={d} fill={fill} fillOpacity={fillOpacity} />;
};

interface PulseDotProps {
   cx?: number;
   cy?: number;
   color: string;
   payload?: { liveEdge?: number };
}

// Live-edge pulse: a solid r2 core with an r4 breathing halo, drawn only on
// the last (still accumulating) bucket of the dashed "today" tail.
export const PulseDot = ({ cx, cy, color, payload }: PulseDotProps) => {
   if (typeof cx !== "number" || typeof cy !== "number") return null;
   if (!payload?.liveEdge) return null;

   return (
      <g transform={`translate(${cx},${cy})`} style={{ pointerEvents: "none" }}>
         <circle className="animate-pulse" r={4} fill={color} opacity={0.28} />
         <circle r={2} fill={color} />
      </g>
   );
};
