"use client";

// Rendered as a client component so the current year is not baked into the
// static App Shell at build time. `new Date()` is non-deterministic and is not
// allowed inside the server prerender under Cache Components; reading it in a
// client component sidesteps that while keeping a stable, flash-free value.
export const FooterYear = () => {
   return <span>{new Date().getFullYear()}</span>;
};
