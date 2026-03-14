import { useEffect, useRef } from "react";

export const useIntersectionObserver = (
   callback: () => void,
   enabled: boolean,
) => {
   const ref = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!enabled) return;
      const el = ref.current;
      if (!el) return;

      const observer = new IntersectionObserver(
         ([entry]) => {
            if (entry?.isIntersecting) {
               callback();
            }
         },
         { rootMargin: "200px" },
      );

      observer.observe(el);
      return () => observer.disconnect();
   }, [callback, enabled]);

   return ref;
};
