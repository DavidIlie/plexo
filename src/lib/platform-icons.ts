export interface PlatformConfig {
  displayName: string;
  icon: "lucide" | "custom";
  iconName: string;
  brandColor: string;
  category: "desktop" | "mobile" | "tv" | "web" | "device" | "unknown";
}

export const PLATFORM_MAP: Record<string, PlatformConfig> = {
  // Desktop
  Windows: {
    displayName: "Windows",
    icon: "custom",
    iconName: "Windows",
    brandColor: "rgb(0, 120, 215)",
    category: "desktop",
  },
  macOS: {
    displayName: "macOS",
    icon: "lucide",
    iconName: "Apple",
    brandColor: "rgb(155, 155, 155)",
    category: "desktop",
  },
  "Mac OS X": {
    displayName: "macOS",
    icon: "lucide",
    iconName: "Apple",
    brandColor: "rgb(155, 155, 155)",
    category: "desktop",
  },
  Linux: {
    displayName: "Linux",
    icon: "custom",
    iconName: "Linux",
    brandColor: "rgb(255, 165, 0)",
    category: "desktop",
  },
  Ubuntu: {
    displayName: "Ubuntu",
    icon: "custom",
    iconName: "Ubuntu",
    brandColor: "rgb(221, 72, 20)",
    category: "desktop",
  },
  Debian: {
    displayName: "Debian",
    icon: "custom",
    iconName: "Debian",
    brandColor: "rgb(215, 30, 70)",
    category: "desktop",
  },

  // Mobile
  iOS: {
    displayName: "iOS",
    icon: "lucide",
    iconName: "Apple",
    brandColor: "rgb(155, 155, 155)",
    category: "mobile",
  },
  Android: {
    displayName: "Android",
    icon: "custom",
    iconName: "Android",
    brandColor: "rgb(60, 200, 63)",
    category: "mobile",
  },

  // Smart TV / Streaming Devices
  tvOS: {
    displayName: "Apple TV",
    icon: "lucide",
    iconName: "Tv",
    brandColor: "rgb(155, 155, 155)",
    category: "tv",
  },
  "Apple TV": {
    displayName: "Apple TV",
    icon: "lucide",
    iconName: "Tv",
    brandColor: "rgb(155, 155, 155)",
    category: "tv",
  },
  Roku: {
    displayName: "Roku",
    icon: "custom",
    iconName: "Roku",
    brandColor: "rgb(112, 34, 182)",
    category: "tv",
  },
  "Fire TV": {
    displayName: "Fire TV",
    icon: "custom",
    iconName: "FireTV",
    brandColor: "rgb(255, 153, 0)",
    category: "tv",
  },
  "Android TV": {
    displayName: "Android TV",
    icon: "custom",
    iconName: "Android",
    brandColor: "rgb(60, 200, 63)",
    category: "tv",
  },
  "Google TV": {
    displayName: "Google TV",
    icon: "custom",
    iconName: "GoogleTV",
    brandColor: "rgb(66, 133, 244)",
    category: "tv",
  },
  "LG TV": {
    displayName: "LG TV",
    icon: "custom",
    iconName: "LGTV",
    brandColor: "rgb(206, 32, 41)",
    category: "tv",
  },
  "Samsung TV": {
    displayName: "Samsung TV",
    icon: "custom",
    iconName: "SamsungTV",
    brandColor: "rgb(30, 144, 255)",
    category: "tv",
  },
  "Sony TV": {
    displayName: "Sony TV",
    icon: "custom",
    iconName: "SonyTV",
    brandColor: "rgb(0, 0, 0)",
    category: "tv",
  },
  "Nvidia Shield": {
    displayName: "Shield",
    icon: "custom",
    iconName: "Shield",
    brandColor: "rgb(118, 184, 82)",
    category: "tv",
  },

  // Web Browsers
  Chrome: {
    displayName: "Chrome",
    icon: "lucide",
    iconName: "Chrome",
    brandColor: "rgb(66, 133, 244)",
    category: "web",
  },
  Firefox: {
    displayName: "Firefox",
    icon: "custom",
    iconName: "Firefox",
    brandColor: "rgb(255, 103, 0)",
    category: "web",
  },
  Safari: {
    displayName: "Safari",
    icon: "custom",
    iconName: "Safari",
    brandColor: "rgb(0, 122, 255)",
    category: "web",
  },
  Edge: {
    displayName: "Edge",
    icon: "custom",
    iconName: "Edge",
    brandColor: "rgb(0, 120, 215)",
    category: "web",
  },

  // Gaming Consoles
  Xbox: {
    displayName: "Xbox",
    icon: "custom",
    iconName: "Xbox",
    brandColor: "rgb(16, 124, 16)",
    category: "device",
  },
  PlayStation: {
    displayName: "PlayStation",
    icon: "custom",
    iconName: "PlayStation",
    brandColor: "rgb(0, 70, 170)",
    category: "device",
  },
  "Nintendo Switch": {
    displayName: "Switch",
    icon: "custom",
    iconName: "Switch",
    brandColor: "rgb(230, 0, 35)",
    category: "device",
  },
};

export function getPlatformConfig(platform: string | null | undefined): PlatformConfig {
  if (!platform) {
    return {
      displayName: "Unknown",
      icon: "lucide",
      iconName: "Monitor",
      brandColor: "rgb(128, 128, 128)",
      category: "unknown",
    };
  }

  return (
    PLATFORM_MAP[platform] || {
      displayName: platform,
      icon: "custom",
      iconName: "Generic",
      brandColor: "rgb(128, 128, 128)",
      category: "unknown",
    }
  );
}
