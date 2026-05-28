import { Apple, Chrome, Tv } from "lucide-react";
import { getPlatformConfig } from "~/lib/platform-icons";
import { CustomIcon } from "~/components/ui/platform-icons";

interface PlatformBadgeProps {
  platform: string | null | undefined;
  showLabel?: boolean;
  variant?: "icon-only" | "compact" | "full";
}

const LucideIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Apple: Apple,
  Tv: Tv,
  Chrome: Chrome,
};

export const PlatformBadge = ({
  platform,
  showLabel = true,
  variant = "compact",
}: PlatformBadgeProps) => {
  const config = getPlatformConfig(platform);

  const IconComponent =
    config.icon === "lucide"
      ? LucideIconMap[config.iconName] || Apple
      : CustomIcon;

  const iconProps =
    config.icon === "lucide"
      ? { className: "h-3.5 w-3.5" }
      : { name: config.iconName, className: "h-3.5 w-3.5" };

  if (variant === "icon-only") {
    return (
      <div
        className="flex items-center justify-center rounded transition-colors hover:opacity-75"
        title={config.displayName}
      >
        {config.icon === "lucide" ? (
          <IconComponent {...(iconProps as { className: string })} />
        ) : (
          <CustomIcon {...(iconProps as { name: string; className: string })} />
        )}
      </div>
    );
  }

  if (variant === "full") {
    return (
      <div
        className="inline-flex items-center gap-1.5 rounded-md bg-muted/40 px-2 py-1 transition-colors hover:bg-muted/60"
        style={{
          borderLeft: `3px solid ${config.brandColor}`,
        }}
      >
        {config.icon === "lucide" ? (
          <IconComponent {...(iconProps as { className: string })} />
        ) : (
          <CustomIcon {...(iconProps as { name: string; className: string })} />
        )}
        {showLabel && (
          <span
            className="text-xs font-medium"
            style={{ color: config.brandColor }}
          >
            {config.displayName}
          </span>
        )}
      </div>
    );
  }

  // Default: compact
  return (
    <div
      className="inline-flex items-center gap-1 rounded transition-colors hover:opacity-75"
      title={config.displayName}
    >
      {config.icon === "lucide" ? (
        <IconComponent {...(iconProps as { className: string })} />
      ) : (
        <CustomIcon {...(iconProps as { name: string; className: string })} />
      )}
      {showLabel && <span className="text-xs font-medium">{config.displayName}</span>}
    </div>
  );
};
