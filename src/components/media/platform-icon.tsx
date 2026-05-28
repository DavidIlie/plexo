import type { ComponentType, ReactElement } from "react";
import {
  Cast,
  Chrome,
  Compass,
  Flame,
  Gamepad2,
  Globe,
  Monitor,
  MonitorPlay,
  Smartphone,
  Tv,
  type LucideIcon,
} from "lucide-react";

import { cn } from "~/lib/utils";

/**
 * Lucide ships generic device icons, not brand logos (it stripped Feather's
 * brand marks for trademark reasons), and no off-the-shelf set covers the
 * Apple family. So this is a curated registry: hand-drawn monochrome brand
 * silhouettes where one reads well at icon size, Lucide device glyphs
 * elsewhere. Every glyph inherits `currentColor` to stay in the amber theme.
 */

type GlyphProps = { className?: string };
type Glyph = ComponentType<GlyphProps>;

const svgBase = "0 0 24 24";

// --- Hand-drawn brand silhouettes (solid, currentColor) -------------------

const AppleGlyph = ({ className }: GlyphProps): ReactElement => (
  <svg viewBox={svgBase} fill="currentColor" className={className} aria-hidden>
    <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
  </svg>
);

const AndroidGlyph = ({ className }: GlyphProps): ReactElement => (
  <svg viewBox={svgBase} fill="currentColor" className={className} aria-hidden>
    <path d="M17.523 15.341a.998.998 0 1 1 0-1.998.998.998 0 0 1 0 1.998m-11.046 0a.998.998 0 1 1 0-1.999.998.998 0 0 1 0 1.999m11.405-6.02 1.997-3.459a.416.416 0 0 0-.72-.416l-2.022 3.503A12.082 12.082 0 0 0 12 7.851c-1.838 0-3.59.393-5.137 1.099L4.841 5.447a.416.416 0 0 0-.72.416l1.998 3.459C2.689 11.187.343 14.659 0 18.761h24c-.343-4.102-2.689-7.574-6.118-9.44" />
  </svg>
);

const WindowsGlyph = ({ className }: GlyphProps): ReactElement => (
  <svg viewBox={svgBase} fill="currentColor" className={className} aria-hidden>
    <path d="M0 0h11.377v11.372H0Zm12.623 0H24v11.372H12.623ZM0 12.623h11.377V24H0Zm12.623 0H24V24H12.623Z" />
  </svg>
);

// PlayStation's four face-button shapes — unmistakable, and they survive a
// 12px render better than the script "PS" mark does.
const PlayStationGlyph = ({ className }: GlyphProps): ReactElement => (
  <svg
    viewBox={svgBase}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <polygon points="12,2.6 14.5,7.2 9.5,7.2" />
    <circle cx="18.9" cy="12" r="2.3" />
    <rect x="2.9" y="9.7" width="4.6" height="4.6" rx="0.5" />
    <path d="m10 17 4 4m0-4-4 4" />
  </svg>
);

// --- Lucide-backed glyphs --------------------------------------------------

const lucide = (Icon: LucideIcon): Glyph => {
  const Wrapped = ({ className }: GlyphProps): ReactElement => (
    <Icon className={className} aria-hidden />
  );
  return Wrapped;
};

const DefaultGlyph = lucide(MonitorPlay);

// --- Registry: normalized platform key -> { label, Icon } ------------------

export interface PlatformMeta {
  label: string;
  Icon: Glyph;
}

const PLATFORMS: Record<string, PlatformMeta> = {
  // Apple family — one brand mark, device implied by the player name
  tvos: { label: "Apple TV", Icon: AppleGlyph },
  ios: { label: "iOS", Icon: AppleGlyph },
  ipados: { label: "iPadOS", Icon: AppleGlyph },
  macos: { label: "macOS", Icon: AppleGlyph },
  // Desktop / mobile OS
  android: { label: "Android", Icon: AndroidGlyph },
  windows: { label: "Windows", Icon: WindowsGlyph },
  windowsphone: { label: "Windows Phone", Icon: lucide(Smartphone) },
  linux: { label: "Linux", Icon: lucide(Monitor) },
  // Browsers
  chrome: { label: "Chrome", Icon: lucide(Chrome) },
  firefox: { label: "Firefox", Icon: lucide(Flame) },
  safari: { label: "Safari", Icon: lucide(Compass) },
  edge: { label: "Edge", Icon: lucide(Globe) },
  opera: { label: "Opera", Icon: lucide(Globe) },
  // Cast / consoles
  chromecast: { label: "Chromecast", Icon: lucide(Cast) },
  playstation: { label: "PlayStation", Icon: PlayStationGlyph },
  xbox: { label: "Xbox", Icon: lucide(Gamepad2) },
  // Smart TVs (no clean monochrome brand mark — generic TV reads best)
  vidaa: { label: "VIDAA", Icon: lucide(Tv) },
  samsung: { label: "Samsung", Icon: lucide(Tv) },
  webos: { label: "LG", Icon: lucide(Tv) },
  roku: { label: "Roku", Icon: lucide(Tv) },
  dlna: { label: "DLNA", Icon: lucide(Tv) },
  // Players
  kodi: { label: "Kodi", Icon: lucide(MonitorPlay) },
  plex: { label: "Plex", Icon: lucide(MonitorPlay) },
};

// Map raw Tautulli/Plex platform spellings onto a canonical registry key.
const ALIASES: Record<string, string> = {
  "apple tv": "tvos",
  "os x": "macos",
  "mac os x": "macos",
  macosx: "macos",
  "ipad os": "ipados",
  "google chrome": "chrome",
  "microsoft edge": "edge",
  msedge: "edge",
  "windows phone": "windowsphone",
  wp: "windowsphone",
  "google cast": "chromecast",
  "plex cast": "chromecast",
  "playstation 3": "playstation",
  "playstation 4": "playstation",
  "playstation 5": "playstation",
  ps3: "playstation",
  ps4: "playstation",
  ps5: "playstation",
  "xbox one": "xbox",
  "xbox 360": "xbox",
  tizen: "samsung",
  netcast: "webos",
  lg: "webos",
};

export const getPlatformMeta = (raw: string): PlatformMeta => {
  const key = raw.trim().toLowerCase().replace(/\s+/g, " ");
  const canonical = ALIASES[key] ?? key.replace(/\s+/g, "");
  return PLATFORMS[canonical] ?? PLATFORMS[key] ?? { label: raw, Icon: DefaultGlyph };
};

export const PlatformBadge = ({
  platform,
  className,
  iconClassName,
}: {
  platform: string;
  className?: string;
  iconClassName?: string;
}): ReactElement => {
  const { label, Icon } = getPlatformMeta(platform);
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <Icon className={cn("h-3 w-3 shrink-0", iconClassName)} />
      <span>{label}</span>
    </span>
  );
};
