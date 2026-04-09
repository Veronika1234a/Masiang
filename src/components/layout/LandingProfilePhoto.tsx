"use client";

import Image from "next/image";
import { useState } from "react";

interface LandingProfilePhotoProps {
  primarySrc: string;
  fallbackSrc: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function LandingProfilePhoto({
  primarySrc,
  fallbackSrc,
  alt,
  width,
  height,
  className,
}: LandingProfilePhotoProps) {
  const [src, setSrc] = useState(primarySrc);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => {
        if (src !== fallbackSrc) {
          setSrc(fallbackSrc);
        }
      }}
    />
  );
}
