import { Apple, Tv, Chrome, Monitor } from "lucide-react";

interface IconProps {
  className?: string;
}

// Windows logo
export const WindowsIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z" />
  </svg>
);

// Linux penguin (tux)
export const LinuxIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2a1 1 0 0 0-1 1v1a1 1 0 0 0 2 0V3a1 1 0 0 0-1-1zm-4 2a1.5 1.5 0 0 0-1.5 1.5v1.5a1.5 1.5 0 0 0 3 0v-1.5A1.5 1.5 0 0 0 8 4zm8 0a1.5 1.5 0 0 0-1.5 1.5v1.5a1.5 1.5 0 0 0 3 0v-1.5A1.5 1.5 0 0 0 16 4zm-4 3a2 2 0 0 0-2 2v2a2 2 0 0 0 4 0V9a2 2 0 0 0-2-2zm-5 2a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0v-3a1 1 0 0 0-1-1zm10 0a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0v-3a1 1 0 0 0-1-1zm-5 4a3 3 0 0 0-3 3v2a1 1 0 0 0 2 0v-2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 0 2 0v-2a3 3 0 0 0-3-3h-2z" />
  </svg>
);

// Ubuntu logo
export const UbuntuIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="5" r="1.5" fill="white" opacity="0.8" />
    <circle cx="18" cy="16.5" r="1.5" fill="white" opacity="0.8" />
    <circle cx="6" cy="16.5" r="1.5" fill="white" opacity="0.8" />
  </svg>
);

// Debian swirl logo
export const DebianIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
  </svg>
);

// Android logo
export const AndroidIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1zm12 0a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V9a1 1 0 0 0-1-1zm-8-3c-.55 0-1 .45-1 1v.5c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1zm4 0c-.55 0-1 .45-1 1v.5c0 .55.45 1 1 1s1-.45 1-1V6c0-.55-.45-1-1-1zM7 14c-.55 0-1 .45-1 1s.45 1 1 1h10c.55 0 1-.45 1-1s-.45-1-1-1H7zm0-2h10V8H7v4z" />
  </svg>
);

// Roku logo
export const RokuIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <circle cx="7" cy="12" r="2" fill="white" opacity="0.9" />
    <rect x="11" y="8" width="2" height="8" fill="white" opacity="0.9" />
    <circle cx="17" cy="12" r="2" fill="white" opacity="0.9" />
  </svg>
);

// Fire TV logo (Amazon simplified)
export const FireTVIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2l3 8h8l-6.5 5 2.5 8-7-5.5-7 5.5 2.5-8-6.5-5h8l3-8z" />
  </svg>
);

// Google TV (simplified G)
export const GoogleTVIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 13h7V5H3v8zm0 6h7v-4H3v4zm9-6h7V5h-7v8zm0 6h7v-4h-7v4z" />
  </svg>
);

// LG TV
export const LGTVIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="3" width="20" height="14" rx="1" stroke="currentColor" strokeWidth="2" fill="none" />
    <rect x="3" y="4" width="18" height="11" fill="currentColor" opacity="0.3" />
    <rect x="4" y="18" width="16" height="2" rx="1" />
  </svg>
);

// Samsung TV
export const SamsungTVIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M2 4h20c1.1 0 2 .9 2 2v10c0 1.1-.9 2-2 2H2c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zm0 12h20v2c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-2z" />
  </svg>
);

// Sony TV (minimalist)
export const SonyTVIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="1" y="4" width="22" height="12" rx="1.5" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="6" cy="18" r="1.5" />
    <circle cx="18" cy="18" r="1.5" />
    <line x1="8" y1="18" x2="16" y2="18" stroke="currentColor" strokeWidth="1" />
  </svg>
);

// Shield (Nvidia)
export const ShieldIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
  </svg>
);

// Firefox logo
export const FirefoxIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 4a8 8 0 0 1 0 16 8 8 0 0 1 0-16z" fill="white" opacity="0.2" />
  </svg>
);

// Safari (compass)
export const SafariIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="2" />
    <line x1="12" y1="12" x2="16" y2="8" stroke="currentColor" strokeWidth="2" />
  </svg>
);

// Edge (green e)
export const EdgeIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M4 2h16c1.1 0 2 .9 2 2v16c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2zm2 6h12v2H6V8zm0 4h12v2H6v-2z" />
  </svg>
);

// Xbox
export const XboxIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M8 8l4 4-4 4M16 8l-4 4 4 4" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

// PlayStation
export const PlayStationIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L2 5v12c0 8 10 5 10 5s10 3 10-5V5l-10-3z" />
  </svg>
);

// Nintendo Switch
export const SwitchIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="2" y="4" width="6" height="12" rx="1" />
    <rect x="16" y="4" width="6" height="12" rx="1" />
    <rect x="10" y="6" width="4" height="8" rx="1" />
  </svg>
);

// Generic/fallback monitor
export const GenericIcon = ({ className }: IconProps) => (
  <Monitor className={className} />
);

interface CustomIconProps {
  name: string;
  className?: string;
}

export const CustomIcon = ({ name, className }: CustomIconProps) => {
  switch (name) {
    case "Windows":
      return <WindowsIcon className={className} />;
    case "Linux":
      return <LinuxIcon className={className} />;
    case "Ubuntu":
      return <UbuntuIcon className={className} />;
    case "Debian":
      return <DebianIcon className={className} />;
    case "Android":
      return <AndroidIcon className={className} />;
    case "Roku":
      return <RokuIcon className={className} />;
    case "FireTV":
      return <FireTVIcon className={className} />;
    case "GoogleTV":
      return <GoogleTVIcon className={className} />;
    case "LGTV":
      return <LGTVIcon className={className} />;
    case "SamsungTV":
      return <SamsungTVIcon className={className} />;
    case "SonyTV":
      return <SonyTVIcon className={className} />;
    case "Shield":
      return <ShieldIcon className={className} />;
    case "Firefox":
      return <FirefoxIcon className={className} />;
    case "Safari":
      return <SafariIcon className={className} />;
    case "Edge":
      return <EdgeIcon className={className} />;
    case "Xbox":
      return <XboxIcon className={className} />;
    case "PlayStation":
      return <PlayStationIcon className={className} />;
    case "Switch":
      return <SwitchIcon className={className} />;
    case "Generic":
      return <GenericIcon className={className} />;
    default:
      return <GenericIcon className={className} />;
  }
};
