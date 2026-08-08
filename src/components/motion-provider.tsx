"use client";

import { LazyMotion, domAnimation } from "framer-motion";

// LazyMotion + `m` components keep the full `motion` runtime out of the
// bundle; domAnimation covers everything the app uses (enter/exit/whileHover
// animations, AnimatePresence, and the value hooks — no layout/drag features
// anywhere). `strict` makes any accidental `motion.` usage throw in dev so
// the saving can't silently regress.
export const MotionProvider = ({ children }: { children: React.ReactNode }) => (
   <LazyMotion features={domAnimation} strict>
      {children}
   </LazyMotion>
);
