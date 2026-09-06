'use client';

import Image from 'next/image';
import { useState } from 'react';

interface HoverZoomImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  scale?: number;
  sizes?: string;
}

export default function HoverZoomImage({ src, alt, className = "", imageClassName = "", scale = 2, sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" }: HoverZoomImageProps) {
  const [zoomStyle, setZoomStyle] = useState({ transformOrigin: 'center' });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ transformOrigin: 'center' });
  };

  return (
    <div 
      className={`relative overflow-hidden group ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <Image 
        src={src} 
        alt={alt} 
        fill 
        sizes={sizes}
        style={zoomStyle}
        className={`object-contain transition-transform duration-200 group-hover:scale-[2] ${imageClassName}`} 
      />
    </div>
  );
}
