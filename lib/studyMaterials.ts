import type { StudyMaterial } from '@/lib/types';

export const STUDY_MATERIALS_BUCKET = 'course-materials';
export const MAX_MATERIAL_SIZE_BYTES = 50 * 1024 * 1024;

export const ALLOWED_MATERIAL_TYPES: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'Word',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'application/vnd.ms-powerpoint': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/vnd.ms-excel': 'Excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel',
  'text/plain': 'Texto',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP',
  'image/jpeg': 'Imagen',
  'image/png': 'Imagen',
  'image/webp': 'Imagen',
  'audio/mpeg': 'Audio',
};

export const MATERIAL_ACCEPT_ATTRIBUTE = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.jpg,.jpeg,.png,.webp,.mp3';

export function describeMaterial(material: StudyMaterial): string {
  if (material.kind === 'link') return 'Enlace externo';
  const type = (material.mimeType && ALLOWED_MATERIAL_TYPES[material.mimeType]) || 'Archivo';
  return material.size ? `${type} · ${formatFileSize(material.size)}` : type;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function sanitizeFileName(name: string): string {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase()
    .slice(0, 80);
  const ext = dot > 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : '';
  return ext ? `${base || 'material'}.${ext}` : base || 'material';
}
