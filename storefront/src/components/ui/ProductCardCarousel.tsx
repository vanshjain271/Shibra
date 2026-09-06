'use client';

import { useState } from 'react';
import ImageZoom from './ImageZoom';
import HoverZoomImage from '../product/HoverZoomImage';

interface ProductCardCarouselProps {
  images: string[];
  alt: string;
  useHoverZoom?: boolean;
}

export default function ProductCardCarousel({ images, alt, useHoverZoom = false }: ProductCardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const setIndex = (e: React.MouseEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(idx);
  };

  const currentImage = images[currentIndex] || 'https://via.placeholder.com/300';

  return (
    <div className="relative w-full h-full group/carousel">
      {useHoverZoom ? (
        <HoverZoomImage 
          src={currentImage} 
          alt={alt} 
          scale={2}
          className="w-full h-full"
          imageClassName="p-3"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      ) : (
        <ImageZoom 
          src={currentImage} 
          alt={alt} 
          className="w-full h-full p-3 group-hover:scale-105 transition-transform duration-300 object-contain" 
        />
      )}

      {/* Navigation Arrows (Visible on Hover) */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 shadow text-gray-600 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white z-10"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <button
            onClick={nextImage}
            className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 shadow text-gray-600 flex items-center justify-center opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-white z-10"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover/carousel:opacity-100 transition-opacity z-10">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => setIndex(e, idx)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentIndex ? 'bg-purple-600 w-3' : 'bg-gray-300 hover:bg-gray-400'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
