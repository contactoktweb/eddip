'use client';
import { useState, useRef } from 'react';
import { Icon } from '@/lib/icons';
import { extractYouTubeId, getYouTubeEmbedUrl, isYouTubeUrl } from '@/lib/mediaUtils';
import type { Lesson } from '@/lib/types';

type Props = {
  lesson: Lesson;
  onUpdate: (fields: Partial<Lesson>) => void;
};

export function LessonMediaEditor({ lesson, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState<'video' | 'images'>('video');

  // Determinar modo de video actual
  const currentVideoUrl = lesson.videoUrl || '';
  const initialMode = !currentVideoUrl
    ? 'none'
    : isYouTubeUrl(currentVideoUrl) || lesson.videoType === 'youtube'
    ? 'youtube'
    : 'direct';

  const [videoMode, setVideoMode] = useState<'none' | 'youtube' | 'direct'>(initialMode);
  const [youtubeInput, setYoutubeInput] = useState(isYouTubeUrl(currentVideoUrl) ? currentVideoUrl : '');
  const [directVideoInput, setDirectVideoInput] = useState(!isYouTubeUrl(currentVideoUrl) ? currentVideoUrl : '');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isDragOverImages, setIsDragOverImages] = useState(false);
  const [isDragOverVideo, setIsDragOverVideo] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);

  const lessonImages: string[] = [
    ...(lesson.images && lesson.images.length > 0 ? lesson.images : []),
    ...(lesson.imageUrl && (!lesson.images || !lesson.images.includes(lesson.imageUrl)) ? [lesson.imageUrl] : []),
  ].filter(Boolean);

  // Compresión optimizada para imágenes web en canvas
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return reject(new Error('Archivo vacío'));

        const img = new window.Image();
        img.onload = () => {
          const maxWidth = 1200;
          const maxHeight = 900;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width / height > maxWidth / maxHeight) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(dataUrl);

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Manejo de cambio de video de YouTube
  const handleYouTubeChange = (val: string) => {
    setYoutubeInput(val);
    const trimmed = val.trim();
    if (!trimmed) {
      onUpdate({ videoUrl: '', videoType: undefined });
      return;
    }
    const ytid = extractYouTubeId(trimmed);
    if (ytid) {
      onUpdate({ videoUrl: trimmed, videoType: 'youtube' });
    }
  };

  // Manejo de video directo por URL
  const handleDirectVideoChange = (val: string) => {
    setDirectVideoInput(val);
    onUpdate({
      videoUrl: val.trim(),
      videoType: val.trim() ? 'direct' : undefined,
    });
  };

  // Subida de video directo desde el equipo
  const handleDirectVideoUpload = (file: File) => {
    if (!file.type.startsWith('video/')) {
      alert('Por favor selecciona un archivo de video válido (.mp4, .webm, .ogg).');
      return;
    }

    // Si el video es menor a 25MB, convertir a DataURL para persistencia directa
    if (file.size > 25 * 1024 * 1024) {
      alert(
        'El archivo de video supera los 25MB. Para videos de mayor duración o tamaño, te recomendamos ingresar el enlace de YouTube o una URL directa de almacenamiento.'
      );
      return;
    }

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = e => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        setDirectVideoInput(dataUrl);
        onUpdate({
          videoUrl: dataUrl,
          videoType: 'direct',
        });
      }
      setIsProcessing(false);
    };
    reader.onerror = () => {
      alert('Error al leer el archivo de video seleccionado.');
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  // Limpiar video
  const handleClearVideo = () => {
    setVideoMode('none');
    setYoutubeInput('');
    setDirectVideoInput('');
    onUpdate({ videoUrl: '', videoType: undefined });
  };

  // Subida de imágenes
  const handleImageFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (validFiles.length === 0) return;

    setIsProcessing(true);
    try {
      const compressedList = await Promise.all(validFiles.map(compressImage));
      const updated = [...lessonImages, ...compressedList];
      onUpdate({
        images: updated,
        imageUrl: updated[0] || '',
      });
    } catch {
      alert('Error al procesar las imágenes.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddImageUrl = () => {
    if (!imageUrlInput.trim()) return;
    const updated = [...lessonImages, imageUrlInput.trim()];
    onUpdate({
      images: updated,
      imageUrl: updated[0] || '',
    });
    setImageUrlInput('');
  };

  const handleRemoveImage = (index: number) => {
    const updated = lessonImages.filter((_, i) => i !== index);
    onUpdate({
      images: updated,
      imageUrl: updated[0] || '',
    });
  };

  const youtubeEmbedUrl = youtubeInput ? getYouTubeEmbedUrl(youtubeInput) : null;

  return (
    <div className="lesson-media-panel">
      {/* Pestañas de Medios */}
      <div className="lesson-media-tabs">
        <button
          type="button"
          className={`lesson-media-tab-btn ${activeTab === 'video' ? 'active' : ''}`}
          onClick={() => setActiveTab('video')}
        >
          <Icon name="play" size={15} />
          Videoclase {currentVideoUrl ? '✓ (Configurado)' : '(Opcional)'}
        </button>

        <button
          type="button"
          className={`lesson-media-tab-btn ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          <Icon name="image" size={15} />
          Imágenes y Esquemas ({lessonImages.length})
        </button>
      </div>

      {/* CONTENIDO PESTAÑA: VIDEOCLASE */}
      {activeTab === 'video' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Selector de tipo de video */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Origen del video:</span>

            <button
              type="button"
              onClick={() => {
                setVideoMode('none');
                handleClearVideo();
              }}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 6,
                border: videoMode === 'none' ? '2px solid #0F59DF' : '1px solid #cbd5e1',
                background: videoMode === 'none' ? '#eff6ff' : '#fff',
                color: videoMode === 'none' ? '#0F59DF' : '#475569',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Sin video
            </button>

            <button
              type="button"
              onClick={() => {
                setVideoMode('youtube');
                if (youtubeInput) {
                  onUpdate({ videoUrl: youtubeInput, videoType: 'youtube' });
                }
              }}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 6,
                border: videoMode === 'youtube' ? '2px solid #0F59DF' : '1px solid #cbd5e1',
                background: videoMode === 'youtube' ? '#eff6ff' : '#fff',
                color: videoMode === 'youtube' ? '#0F59DF' : '#475569',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Icon name="youtube" size={14} /> Enlace de YouTube
            </button>

            <button
              type="button"
              onClick={() => {
                setVideoMode('direct');
                if (directVideoInput) {
                  onUpdate({ videoUrl: directVideoInput, videoType: 'direct' });
                }
              }}
              style={{
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 6,
                border: videoMode === 'direct' ? '2px solid #0F59DF' : '1px solid #cbd5e1',
                background: videoMode === 'direct' ? '#eff6ff' : '#fff',
                color: videoMode === 'direct' ? '#0F59DF' : '#475569',
                cursor: 'pointer',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Icon name="upload" size={14} /> Cargar video directo / MP4
            </button>
          </div>

          {/* MODO YOUTUBE */}
          {videoMode === 'youtube' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                Pega el enlace de YouTube del video pedagógico:
              </label>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={youtubeInput}
                  onChange={e => handleYouTubeChange(e.target.value)}
                  placeholder="Ej: https://www.youtube.com/watch?v=ScMzIvxBSi4 o https://youtu.be/..."
                  style={{ fontSize: 13, padding: '8px 12px', flex: 1 }}
                />
                {youtubeInput && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleClearVideo}
                    style={{ fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    Quitar
                  </button>
                )}
              </div>

              {youtubeEmbedUrl ? (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    ✓ Video de YouTube detectado correctamente. Vista previa interactiva:
                  </span>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                    <iframe
                      src={youtubeEmbedUrl}
                      title="Vista previa YouTube"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ width: '100%', height: '100%', border: 0 }}
                    />
                  </div>
                </div>
              ) : youtubeInput.trim() ? (
                <span style={{ fontSize: 11, color: '#d97706' }}>
                  ⚠ Por favor verifica que el enlace pertenezca a YouTube (formato https://www.youtube.com/watch?v=... o https://youtu.be/...).
                </span>
              ) : null}
            </div>
          )}

          {/* MODO VIDEO DIRECTO / ARCHIVO */}
          {videoMode === 'direct' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, background: '#fff', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <input
                ref={videoFileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/ogg"
                style={{ display: 'none' }}
                onChange={e => {
                  if (e.target.files && e.target.files[0]) {
                    handleDirectVideoUpload(e.target.files[0]);
                  }
                  e.target.value = '';
                }}
              />

              <div
                className={`lesson-media-uploader-box ${isDragOverVideo ? 'dragover' : ''}`}
                onClick={() => videoFileInputRef.current?.click()}
                onDragOver={e => {
                  e.preventDefault();
                  setIsDragOverVideo(true);
                }}
                onDragLeave={() => setIsDragOverVideo(false)}
                onDrop={e => {
                  e.preventDefault();
                  setIsDragOverVideo(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleDirectVideoUpload(e.dataTransfer.files[0]);
                  }
                }}
              >
                <div style={{ color: '#0F59DF', marginBottom: 4 }}>
                  <Icon name="upload" size={24} />
                </div>
                <strong style={{ fontSize: 13, color: '#071F49', display: 'block' }}>
                  {isProcessing ? 'Procesando video...' : 'Haz clic para seleccionar o arrastra un video MP4/WebM aquí'}
                </strong>
                <span style={{ fontSize: 11, color: '#64748b' }}>
                  Soporta formatos estándar de video (.mp4, .webm). Límite de carga directa: 25MB.
                </span>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#64748b', whiteSpace: 'nowrap' }}>O URL de video:</span>
                <input
                  value={directVideoInput.startsWith('data:') ? '(Video cargado directamente desde archivo)' : directVideoInput}
                  onChange={e => handleDirectVideoChange(e.target.value)}
                  placeholder="https://.../video-leccion.mp4"
                  disabled={directVideoInput.startsWith('data:')}
                  style={{ fontSize: 12, padding: '7px 10px', flex: 1 }}
                />
                {directVideoInput && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={handleClearVideo}
                    style={{ fontSize: 11, color: '#dc2626', borderColor: '#fca5a5' }}
                  >
                    Quitar
                  </button>
                )}
              </div>

              {directVideoInput && (
                <div style={{ marginTop: 8 }}>
                  <span style={{ fontSize: 11, color: '#059669', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                    ✓ Vista previa del reproductor HTML5:
                  </span>
                  <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', background: '#000' }}>
                    <video
                      src={directVideoInput}
                      controls
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    >
                      Tu navegador no soporta video HTML5.
                    </video>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* CONTENIDO PESTAÑA: IMÁGENES PEDAGÓGICAS */}
      {activeTab === 'images' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            ref={imageFileInputRef}
            type="file"
            multiple
            accept="image/*"
            style={{ display: 'none' }}
            onChange={e => {
              if (e.target.files) handleImageFiles(e.target.files);
              e.target.value = '';
            }}
          />

          {/* Zona de Arrastrar y Soltar Imágenes */}
          <div
            className={`lesson-media-uploader-box ${isDragOverImages ? 'dragover' : ''}`}
            onClick={() => imageFileInputRef.current?.click()}
            onDragOver={e => {
              e.preventDefault();
              setIsDragOverImages(true);
            }}
            onDragLeave={() => setIsDragOverImages(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragOverImages(false);
              if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files);
            }}
          >
            <div style={{ color: '#0F59DF', marginBottom: 4 }}>
              <Icon name="image" size={24} />
            </div>
            <strong style={{ fontSize: 13, color: '#071F49', display: 'block' }}>
              {isProcessing ? 'Optimizando imágenes...' : 'Haz clic o arrastra imágenes pedagógicas para esta lección'}
            </strong>
            <span style={{ fontSize: 11, color: '#64748b' }}>
              Esquemas conceptuales, infografías o diagramas explicativos (PNG, JPG, WEBP)
            </span>
          </div>

          {/* Presets rápidos y URL de Imagen */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Esquemas rápidos:</span>
              {[
                { name: '+ Seguridad', path: '/images/courses/seguridad.jpg' },
                { name: '+ Jurídico', path: '/images/courses/derecho.jpg' },
                { name: '+ Convivencia', path: '/images/courses/gestion.jpg' },
              ].map(p => (
                <button
                  key={p.path}
                  type="button"
                  onClick={() => {
                    if (!lessonImages.includes(p.path)) {
                      const updated = [...lessonImages, p.path];
                      onUpdate({ images: updated, imageUrl: updated[0] || '' });
                    }
                  }}
                  style={{
                    fontSize: 10,
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    color: '#334155',
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={imageUrlInput}
                onChange={e => setImageUrlInput(e.target.value)}
                placeholder="O añade imagen por enlace web (https://...)"
                style={{ fontSize: 12, padding: '7px 10px', flex: 1 }}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddImageUrl())}
              />
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleAddImageUrl}
                style={{ fontSize: 11, whiteSpace: 'nowrap' }}
              >
                <Icon name="plus" size={13} /> Añadir enlace
              </button>
            </div>
          </div>

          {/* Miniaturas de imágenes configuradas */}
          {lessonImages.length > 0 && (
            <div style={{ marginTop: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#334155' }}>
                  Imágenes asociadas a esta lección ({lessonImages.length}):
                </span>
                <button
                  type="button"
                  onClick={() => onUpdate({ images: [], imageUrl: '' })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Eliminar todas
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 10 }}>
                {lessonImages.map((src, i) => (
                  <div
                    key={`${src}-${i}`}
                    style={{
                      position: 'relative',
                      height: 80,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #cbd5e1',
                      background: '#fff',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Recurso ${i + 1}`}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      title="Eliminar imagen"
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: 'rgba(220, 38, 38, 0.85)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                      }}
                    >
                      <Icon name="close" size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
