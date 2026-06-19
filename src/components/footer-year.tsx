"use client";

import { useEffect, useState } from "react";

// `new Date()` (current time) is non-deterministic and Cache Components rejects
// it during the prerender — even inside a Client Component. So compute the year
// after mount on the client only. The footer copyright year popping in one
// frame later is imperceptible and keeps the page in the static App Shell.
export const FooterYear = () => {
   const [year, setYear] = useState<number | null>(null);

   useEffect(() => {
      setYear(new Date().getFullYear());
   }, []);

   return <span suppressHydrationWarning>{year ?? ""}</span>;
};
