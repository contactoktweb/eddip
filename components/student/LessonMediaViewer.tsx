'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@/lib/icons';
import { getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/mediaUtils';

type Props = {
  videoUrl?: string;
  videoType?: 'youtube' | 'direct';
  images?: string[];
  imageUrl?: string;
  lessonTitle: string;
};

export function LessonMediaViewer({
  videoUrl,
  videoType,
  images = [],
  imageUrl,
  lessonTitle,
}: Props) {
  // Consolidar lista de imágenes válidas
  const allImages = [
    ...(images && images.length > 0 ? images : []),
    ...(imageUrl && (!images || !images.includes(imageUrl)) ? [imageUrl] : []),
  ].filter(Boolean);

  const [activeModalImage, setActiveModalImage] = useState<string | null>(null);
  const [modalIndex, setModalIndex] = useState<number>(0);

  const hasVideo = Boolean(videoUrl && videoUrl.trim());
  const isYoutube = hasVideo && (videoType === 'youtube' || isYouTubeUrl(videoUrl!));
  const embedUrl = isYoutube && videoUrl ? getYouTubeEmbedUrl(videoUrl) : null;

  // Manejo de teclado para cerrar modal con Escape y navegar con flechas
  useEffect(() => {
    if (!activeModalImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModalImage(null);
      } else if (e.key === 'ArrowRight' && allImages.length > 1) {
        setModalIndex(prev => {
          const next = (prev + 1) % allImages.length;
          setActiveModalImage(allImages[next]);
          return next;
        });
      } else if (e.key === 'ArrowLeft' && allImages.length > 1) {
        setModalIndex(prev => {
          const next = (prev - 1 + allImages.length) % allImages.length;
          setActiveModalImage(allImages[next]);
          return next;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalImage, allImages]);

  const openImageModal = (imgUrl: string, idx: number) => {
    setActiveModalImage(imgUrl);
    setModalIndex(idx);
  };

  if (!hasVideo && allImages.length === 0) {
    return null;
  }

  return (
    <div className="lesson-media-wrapper">
      {/* 1. SECCIÓN DE VIDEO DE LA LECCIÓN */}
      {hasVideo && (
        <section className="lesson-video-card" aria-label="Videoclase de la lección">
          <div className="lesson-video-header">
            <span className="lesson-video-badge">
              <Icon name={isYoutube ? 'youtube' : 'play'} size={18} />
              {isYoutube ? 'Videoclase Oficial de la Lección (YouTube)' : 'Video Formativo de la Lección'}
            </span>
            <span className="lesson-video-hint">
              {isYoutube ? 'Transmisión HD' : 'Archivo Audiovisual'}
            </span>
          </div>

          <div className="lesson-video-aspect">
            {isYoutube && embedUrl ? (
              <iframe
                src={embedUrl}
                title={`Videoclase: ${lessonTitle}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <video
                src={videoUrl}
                controls
                playsInline
                preload="metadata"
                controlsList="nodownload"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              >
                Tu navegador no soporta la reproducción de video HTML5.
              </video>
            )}
          </div>
        </section>
      )}

      {/* 2. SECCIÓN DE IMÁGENES / INFOGRAFÍAS PEDAGÓGICAS */}
      {allImages.length > 0 && (
        <section className="lesson-gallery-card" aria-label="Material gráfico y esquemas de la lección">
          <h3 className="lesson-gallery-title">
            <Icon name="image" size={18} />
            Material Gráfico y Esquemas Doctrinales ({allImages.length})
          </h3>

          <div className="lesson-gallery-grid">
            {allImages.map((imgSrc, idx) => (
              <div
                key={`${imgSrc}-${idx}`}
                className="lesson-gallery-thumb"
                onClick={() => openImageModal(imgSrc, idx)}
                role="button"
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && openImageModal(imgSrc, idx)}
                aria-label={`Ver imagen ampliada ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imgSrc}
                  alt={`Recurso ilustrativo ${idx + 1} de la lección: ${lessonTitle}`}
                  loading="lazy"
                />
                <div className="lesson-gallery-overlay">
                  <span
                    style={{
                      background: 'rgba(0,0,0,0.65)',
                      padding: '6px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Icon name="search" size={14} /> Ampliar
                  </span>
                </div>
              </div>
            ))}
          </div>
          <span style={{ display: 'block', fontSize: 12, color: '#64748b', marginTop: 10 }}>
            * Haz clic en cualquier esquema o imagen para visualizarlo en alta resolución.
          </span>
        </section>
      )}

      {/* 3. MODAL LIGHTBOX INTERACTIVO */}
      {activeModalImage && (
        <div
          className="lesson-lightbox-backdrop"
          onClick={() => setActiveModalImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Visualizador de imagen en alta resolución"
        >
          <div className="lesson-lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="lesson-lightbox-close"
              onClick={() => setActiveModalImage(null)}
              aria-label="Cerrar visor"
            >
              <Icon name="close" size={20} />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeModalImage}
              alt={`Esquema doctrinal ampliado ${modalIndex + 1}`}
            />

            {allImages.length > 1 && (
              <div
                style={{
                  marginTop: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  color: '#fff',
                  fontSize: 13,
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const prev = (modalIndex - 1 + allImages.length) % allImages.length;
                    setModalIndex(prev);
                    setActiveModalImage(allImages[prev]);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  ← Anterior
                </button>

                <span>
                  {modalIndex + 1} de {allImages.length}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const next = (modalIndex + 1) % allImages.length;
                    setModalIndex(next);
                    setActiveModalImage(allImages[next]);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
