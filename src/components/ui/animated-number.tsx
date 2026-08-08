"use client";

import { useEffect, useRef } from "react";
import { m, useInView, useReducedMotion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
   value: number;
   duration?: number;
   formatFn?: (n: number) => string;
   className?: string;
   immediate?: boolean;
}

// Spring count-up that starts when the element scrolls into view. Falls back
// to a static value under prefers-reduced-motion. The spring is initialized
// to the real value so SSR/static contexts (print, captures, fast scrolls
// before the animation triggers) never show a literal "0" — the count-up only
// rewinds to 0 at the instant it actually starts playing.
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
   value,
   duration = 1.2,
   formatFn = (n) => Math.round(n).toLocaleString(),
   className,
   immediate = false,
}) => {
   const ref = useRef<HTMLSpanElement>(null);
   const isInView = useInView(ref, { once: true, margin: "-50px" });
   const prefersReducedMotion = useReducedMotion();
   const active = immediate || isInView;
   const started = useRef(false);

   const spring = useSpring(value, {
      duration: duration * 1000,
      bounce: 0,
   });

   const display = useTransform(spring, (current) => formatFn(current));

   useEffect(() => {
      if (!active) return;
      if (prefersReducedMotion) {
         spring.jump(value);
         return;
      }
      if (!started.current) {
         started.current = true;
         spring.jump(0);
      }
      spring.set(value);
   }, [active, prefersReducedMotion, spring, value]);

   if (prefersReducedMotion) {
      return (
         <m.span ref={ref} className={className}>
            {formatFn(value)}
         </m.span>
      );
   }

   return (
      <m.span ref={ref} className={className} aria-label={formatFn(value)}>
         <m.span aria-hidden="true">{display}</m.span>
      </m.span>
   );
};
