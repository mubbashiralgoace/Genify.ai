"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface ClientImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
  "aria-hidden"?: boolean;
}

export default function ClientImage({ 
  src, 
  alt, 
  width, 
  height, 
  className, 
  priority,
  ...props 
}: ClientImageProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Return a placeholder during SSR to prevent hydration mismatch
    return (
      <div 
        style={{ 
          width, 
          height, 
          backgroundColor: 'transparent' 
        }} 
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      {...props}
    />
  );
}