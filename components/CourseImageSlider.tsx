'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Icon } from '@/lib/icons';

interface CourseImageSliderProps {
  images?: string[];
  fallbackImage?: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  showControls?: boolean;
  showDots?: boolean;
  aspectRatio?: string;
  overlayChildren?: React.ReactNode;
}

export function CourseImageSlider({
  images,
  fallbackImage = '/images/courses/seguridad.jpg',
  alt,
  className = '',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  showControls = true,
  showDots = true,
  aspectRatio,
  overlayChildren,
}: CourseImageSliderProps) {
  // Lista unificada y normalizada de imágenes
  const validImages = React.useMemo(() => {
    if (images && images.length > 0) {
      const filtered = images.filter(img => typeof img === 'string' && img.trim().length > 0);
      if (filtered.length > 0) return filtered;
    }
    return [fallbackImage];
  }, [images, fallbackImage]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const isDragging = useRef<boolean>(false);

  const total = validImages.length;
  const isMultiple = total > 1;

  // Ajustar el índice si la cantidad de imágenes cambia
  useEffect(() => {
    if (currentIndex >= total) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const prevSlide = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setCurrentIndex(prev => (prev === 0 ? total - 1 : prev - 1));
    },
    [total]
  );

  const nextSlide = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setCurrentIndex(prev => (prev === total - 1 ? 0 : prev + 1));
    },
    [total]
  );

  const goToSlide = useCallback(
    (index: number, e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation();
        e.preventDefault();
      }
      setCurrentIndex(index);
    },
    []
  );

  // Soporte de gestos táctiles Swipe Nativo (Regla 15)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMultiple) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isMultiple || !isDragging.current || touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const diffX = touchStartX.current - touchEndX;
    const diffY = (touchStartY.current || 0) - touchEndY;

    // Solo considerar swipe si el desplazamiento horizontal es mayor al vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 35) {
      if (diffX > 0) {
        // Deslizó hacia la izquierda -> siguiente foto
        nextSlide();
      } else {
        // Deslizó hacia la derecha -> foto anterior
        prevSlide();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
    isDragging.current = false;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isMultiple) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  return (
    <div
      className={`course-slider-chamber ${className}`.trim()}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onKeyDown={handleKeyDown}
      tabIndex={isMultiple ? 0 : undefined}
      role={isMultiple ? 'region' : undefined}
      aria-label={isMultiple ? `Galería de ${alt}` : undefined}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...(aspectRatio ? { aspectRatio } : {}),
      }}
    >
      {/* Contenedor de Imágenes */}
      <div
        className="course-slider-viewport"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {validImages.map((src, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={`${src}-${idx}`}
              className={`course-slider-slide ${isActive ? 'active' : ''}`}
              aria-hidden={!isActive}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: isActive ? 1 : 0,
                transform: isActive ? 'scale(1)' : 'scale(1.03)',
                transition: 'opacity 0.4s ease, transform 0.4s ease',
                pointerEvents: isActive ? 'auto' : 'none',
                zIndex: isActive ? 1 : 0,
              }}
            >
              <Image
                src={src}
                alt={`${alt} - Imagen ${idx + 1}`}
                fill
                sizes={sizes}
                priority={priority && idx === 0}
                className="media-photo"
                style={{ objectFit: 'cover' }}
              />
            </div>
          );
        })}
      </div>

      {/* Degradado Cinematográfico */}
      <div className="media-overlay-gradient" />

      {/* Elementos Superpuestos (Chips, Badges, etc.) */}
      {overlayChildren && (
        <div style={{ position: 'relative', zIndex: 3, height: '100%', pointerEvents: 'none' }}>
          {overlayChildren}
        </div>
      )}

      {/* Controles de Navegación Flechas (Desktop / Pointer) */}
      {isMultiple && showControls && (
        <div className="slider-arrows-wrap" style={{ pointerEvents: 'none' }}>
          <button
            type="button"
            className="slider-arrow-btn slider-arrow-prev"
            onClick={prevSlide}
            aria-label="Imagen anterior"
            title="Anterior"
            tabIndex={0}
          >
            <span style={{ display: 'inline-block', transform: 'rotate(180deg)' }}>
              <Icon name="arrow" size={13} />
            </span>
          </button>
          <button
            type="button"
            className="slider-arrow-btn slider-arrow-next"
            onClick={nextSlide}
            aria-label="Siguiente imagen"
            title="Siguiente"
            tabIndex={0}
          >
            <Icon name="arrow" size={13} />
          </button>
        </div>
      )}

      {/* Paginación con Dots e Indicador Multi-Slide */}
      {isMultiple && (
        <div className="slider-footer-indicators" style={{ pointerEvents: 'none' }}>
          {showDots && (
            <div className="slider-dots-track" style={{ pointerEvents: 'auto' }}>
              {validImages.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={e => goToSlide(dotIdx, e)}
                  className={`slider-dot-item ${dotIdx === currentIndex ? 'active' : ''}`}
                  aria-label={`Ver imagen ${dotIdx + 1} de ${total}`}
                />
              ))}
            </div>
          )}
          <span className="slider-count-badge" aria-hidden="true">
            {currentIndex + 1}/{total}
          </span>
        </div>
      )}
    </div>
  );
}
