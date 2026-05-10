import Image from "next/image";
import { User as UserIcon } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

export function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizeMap = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 56
  };
  
  const dimension = sizeMap[size];

  return (
    <div className={`avatar-container avatar-${size} ${className}`}>
      {src ? (
        <Image 
          src={src} 
          alt={name || "User"} 
          width={dimension} 
          height={dimension} 
          className="avatar-image" 
        />
      ) : (
        <div className="avatar-fallback">
          <UserIcon size={dimension * 0.5} />
        </div>
      )}
    </div>
  );
}
