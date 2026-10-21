'use client';
import { useRef, useState } from 'react';
import type { StudyMaterial } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { supabase } from '@/lib/supabase/client';
import {
  ALLOWED_MATERIAL_TYPES,
  MATERIAL_ACCEPT_ATTRIBUTE,
  MAX_MATERIAL_SIZE_BYTES,
  STUDY_MATERIALS_BUCKET,
  describeMaterial,
  formatFileSize,
} from '@/lib/studyMaterials';
import { isValidHttpUrl } from '@/lib/siteSettings';

type Props = {
  courseSlug: string;
  materials: StudyMaterial[];
  onChange: (materials: StudyMaterial[]) => void;
};

type UploadUrlResponse = { path: string; token: string; publicUrl: string; error?: string };

const newMaterialId = () => `mat-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function LessonMaterialsEditor({ courseSlug, materials, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [linkName, setLinkName] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    if (!ALLOWED_MATERIAL_TYPES[file.type]) {
      setError(`"${file.name}" no es un tipo de archivo permitido.`);
      return;
    }
    if (file.size > MAX_MATERIAL_SIZE_BYTES) {
      setError(`"${file.name}" pesa ${formatFileSize(file.size)} y supera el máximo de 50 MB.`);
      return;
    }
    if (!courseSlug) {
      setError('Escribe primero el nombre del curso para poder adjuntar archivos.');
      return;
    }

    setError(null);
    setUploading(file.name);
    try {
      const res = await fetch('/api/materials/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size, courseSlug }),
      });
      const data = (await res.json()) as UploadUrlResponse;
      if (!res.ok) throw new Error(data.error || 'No fue posible iniciar la carga.');

      const { error: uploadError } = await supabase.storage
        .from(STUDY_MATERIALS_BUCKET)
        .uploadToSignedUrl(data.path, data.token, file, { contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      onChange([
        ...materials,
        { id: newMaterialId(), name: file.name, url: data.publicUrl, kind: 'file', mimeType: file.type, size: file.size },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible subir el archivo.');
    } finally {
      setUploading(null);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      await uploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url || !isValidHttpUrl(url)) {
      setError('Ingresa un enlace completo que empiece por https://');
      return;
    }
    setError(null);
    onChange([...materials, { id: newMaterialId(), name: linkName.trim() || url, url, kind: 'link' }]);
    setLinkName('');
    setLinkUrl('');
  };

  const removeMaterial = (id: string) => {
    onChange(materials.filter(m => m.id !== id));
  };

  return (
    <div className="materials-editor">
      <div className="materials-editor-head">
        <Icon name="folder" size={16} />
        <strong>Material de estudio</strong>
        <span>{materials.length > 0 ? `${materials.length} adjunto(s)` : 'Opcional'}</span>
      </div>

      {materials.length > 0 && (
        <ul className="materials-list">
          {materials.map(material => (
            <li key={material.id} className="ui-fade-up">
              <Icon name={material.kind === 'link' ? 'link' : 'file'} size={16} />
              <a href={material.url} target="_blank" rel="noopener noreferrer">
                {material.name}
              </a>
              <small>{describeMaterial(material)}</small>
              <button
                type="button"
                className="icon-btn icon-btn-danger"
                onClick={() => removeMaterial(material.id)}
                aria-label={`Quitar ${material.name}`}
              >
                <Icon name="trash" size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="materials-actions">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={MATERIAL_ACCEPT_ATTRIBUTE}
          className="sr-only"
          id={`materials-file-${courseSlug}-${materials.length}`}
          onChange={e => handleFiles(e.target.files)}
        />
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => fileInputRef.current?.click()}
          disabled={Boolean(uploading)}
        >
          <Icon name="upload" size={15} />
          {uploading ? `Subiendo ${uploading}…` : 'Subir archivo (PDF, Word, PPT…)'}
        </button>

        <div className="materials-link-form">
          <input
            value={linkName}
            onChange={e => setLinkName(e.target.value)}
            placeholder="Nombre del recurso (opcional)"
            aria-label="Nombre del enlace de material"
          />
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())}
            placeholder="https://drive.google.com/…"
            aria-label="Enlace del material"
          />
          <button type="button" className="btn btn-outline" onClick={addLink}>
            <Icon name="link" size={15} /> Agregar enlace
          </button>
        </div>
      </div>

      {error && (
        <p className="materials-error" role="alert">
          <Icon name="alert" size={14} /> {error}
        </p>
      )}
    </div>
  );
}
