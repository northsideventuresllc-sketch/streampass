import {
  STREAMING_SERVICES,
  VIDEO_STREAMING_SERVICES,
  MUSIC_STREAMING_SERVICES,
  type MediaType,
  servicesForMediaType,
} from "@/lib/constants";

interface PlatformSelectProps {
  value: string;
  onChange: (value: string) => void;
  mediaType?: MediaType | "all";
  className?: string;
  id?: string;
}

export function PlatformSelect({
  value,
  onChange,
  mediaType = "all",
  className = "input",
  id,
}: PlatformSelectProps) {
  if (mediaType === "video" || mediaType === "music") {
    const services = servicesForMediaType(mediaType);
    return (
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={className}
      >
        {services.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    );
  }

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={className}
    >
      <optgroup label="Video">
        {VIDEO_STREAMING_SERVICES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </optgroup>
      <optgroup label="Music">
        {MUSIC_STREAMING_SERVICES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

/** Ensure a stored platform value is valid for the given media scope. */
export function defaultPlatformForMedia(
  mediaType: MediaType | "all",
  current?: string
): string {
  const allowed =
    mediaType === "all"
      ? STREAMING_SERVICES
      : servicesForMediaType(mediaType);
  if (current && (allowed as readonly string[]).includes(current)) {
    return current;
  }
  return allowed[0];
}
