"use client";

import { useEffect, useRef } from "react";
import { motion, useInView, useReducedMotion, useSpring, useTransform } from "framer-motion";

interface AnimatedNumberProps {
   value: number;
   duration?: number;
   formatFn?: (n: number) => string;
   className?: string;
   immediate?: boolean;
}

// Spring count-up that starts when the element scrolls into view. Falls back
// to a static value under prefers-reduced-motion.
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

   const spring = useSpring(0, {
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
      spring.set(value);
   }, [active, prefersReducedMotion, spring, value]);

   if (prefersReducedMotion) {
      return (
         <motion.span ref={ref} className={className}>
            {formatFn(value)}
         </motion.span>
      );
   }

   return (
      <motion.span ref={ref} className={className} aria-label={formatFn(value)}>
         <motion.span aria-hidden="true">{display}</motion.span>
      </motion.span>
   );
};
