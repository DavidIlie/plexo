"use client";

import dynamic from "next/dynamic";

// The app dialogs render nothing until opened (keyboard shortcut / button),
// so their code — including Turnstile, nuqs and the media-detail chain — has
// no business in the first-load bundle of every route. next/dynamic with
// ssr: false keeps them out of the critical path; they mount right after
// hydration so keyboard shortcuts keep working, with zero CLS (no visual
// output until opened).
const SearchDialog = dynamic(
   () =>
      import("~/components/search-dialog").then((m) => ({
         default: m.SearchDialog,
      })),
   { ssr: false },
);

const RefreshDialog = dynamic(
   () =>
      import("~/components/refresh-dialog").then((m) => ({
         default: m.RefreshDialog,
      })),
   { ssr: false },
);

const RecommendDialog = dynamic(
   () =>
      import("~/components/recommend-dialog").then((m) => ({
         default: m.RecommendDialog,
      })),
   { ssr: false },
);

export const LazyDialogs = () => (
   <>
      <SearchDialog />
      <RefreshDialog />
      <RecommendDialog />
   </>
);
