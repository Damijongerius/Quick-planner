import Image from "next/image";
import { User as UserIcon } from "lucide-react";
import "./Avatar.css";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_PX = { xs: 22, sm: 28, md: 32, lg: 48 } as const;
const FONT_PX = { xs: 9, sm: 11, md: 12, lg: 17 } as const;

function initials(name: string): string {
  const parts = name.trim().split(/[\s@._-]+/).filter(Boolean);
  if (parts.length === 0) return "";
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[parts.length - 1][0];
  return letters.toUpperCase();
}

/** Stable colour per person, so the same teammate always looks the same. */
function hueFor(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360;
  return hash;
}

export function Avatar({ src, name, size = "md", className = "" }: Readonly<AvatarProps>) {
  const dimension = SIZE_PX[size];
  const label = name?.trim() ? initials(name) : "";

  return (
    <div
      className={`avatar-container avatar-${size} ${className}`}
      style={!src && label ? { background: `hsl(${hueFor(name ?? "")} 55% 45%)`, color: "#fff" } : undefined}
      title={name ?? undefined}
    >
      {src ? (
        <Image src={src} alt={name || "User"} width={dimension} height={dimension} className="avatar-image" />
      ) : label ? (
        <span style={{ fontSize: FONT_PX[size], fontWeight: 600, lineHeight: 1 }} aria-hidden>{label}</span>
      ) : (
        <div className="avatar-fallback"><UserIcon size={dimension * 0.5} /></div>
      )}
    </div>
  );
}
