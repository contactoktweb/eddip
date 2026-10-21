'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { settingsService } from '@/lib/supabase/settingsService';
import {
  LEGAL_DOCUMENT_ROUTES,
  defaultLegalDocuments,
  formatLegalDate,
  type LegalDocument,
  type LegalDocumentKey,
  type LegalSection,
} from '@/lib/legalDocuments';

type Props = {
  documentKey: LegalDocumentKey;
  onNotify: (type: 'success' | 'error', message: string) => void;
};

export function LegalDocumentEditor({ documentKey, onNotify }: Props) {
  const [doc, setDoc] = useState<LegalDocument>(defaultLegalDocuments[documentKey]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    settingsService.getLegalDocument(documentKey).then(value => {
      if (!mounted) return;
      setDoc(value);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, [documentKey]);

  const updateSection = (index: number, field: keyof LegalSection, value: string) => {
    setDoc(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
    }));
  };

  const addSection = () => {
    setDoc(prev => ({ ...prev, sections: [...prev.sections, { heading: '', body: '' }] }));
  };

  const removeSection = (index: number) => {
    if (!confirm('¿Eliminar esta sección del documento?')) return;
    setDoc(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== index) }));
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    setDoc(prev => {
      const target = index + direction;
      if (target < 0 || target >= prev.sections.length) return prev;
      const sections = [...prev.sections];
      [sections[index], sections[target]] = [sections[target], sections[index]];
      return { ...prev, sections };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const sections = doc.sections
      .map(s => ({ heading: s.heading.trim(), body: s.body.trim() }))
      .filter(s => s.heading || s.body);

    if (!doc.title.trim()) {
      onNotify('error', 'El documento debe tener un título.');
      return;
    }
    if (sections.some(s => !s.heading || !s.body)) {
      onNotify('error', 'Cada sección debe tener título y contenido.');
      return;
    }
    if (sections.length === 0) {
      onNotify('error', 'Agrega al menos una sección al documento.');
      return;
    }

    const payload: LegalDocument = {
      title: doc.title.trim(),
      intro: doc.intro.trim(),
      sections,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    setSaving(true);
    const result = await settingsService.saveLegalDocument(documentKey, payload);
    setSaving(false);

    if (result.success) {
      setDoc(payload);
      onNotify('success', `"${payload.title}" fue publicado en el sitio.`);
    } else {
      onNotify('error', `No fue posible guardar el documento. ${result.error ?? ''}`.trim());
    }
  };

  if (loading) {
    return (
      <div className="settings-card settings-loading" aria-busy="true">
        <span className="spinner" aria-hidden="true" />
        <p>Cargando documento…</p>
      </div>
    );
  }

  return (
    <form className="settings-card ui-fade-up" onSubmit={handleSubmit} noValidate>
      <div className="settings-card-head settings-card-head-split">
        <div>
          <h2>{doc.title}</h2>
          <p>Última actualización publicada: {formatLegalDate(doc.updatedAt)}</p>
        </div>
        <Link className="btn btn-outline" href={LEGAL_DOCUMENT_ROUTES[documentKey]} target="_blank">
          <Icon name="eye" size={15} /> Ver página pública
        </Link>
      </div>

      <div className="field">
        <label htmlFor={`${documentKey}-title`}>Título del documento *</label>
        <input
          id={`${documentKey}-title`}
          value={doc.title}
          onChange={e => setDoc(prev => ({ ...prev, title: e.target.value }))}
          required
        />
      </div>

      <div className="field">
        <label htmlFor={`${documentKey}-intro`}>Introducción</label>
        <textarea
          id={`${documentKey}-intro`}
          rows={3}
          value={doc.intro}
          onChange={e => setDoc(prev => ({ ...prev, intro: e.target.value }))}
          placeholder="Párrafo introductorio que explica el alcance del documento."
        />
      </div>

      <ol className="legal-section-list">
        {doc.sections.map((section, index) => (
          <li key={index} className="legal-section-item">
            <div className="legal-section-toolbar">
              <span className="badge">Sección {index + 1}</span>
              <div className="table-actions">
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveSection(index, -1)}
                  disabled={index === 0}
                  aria-label={`Subir sección ${index + 1}`}
                >
                  <Icon name="chevron-up" size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => moveSection(index, 1)}
                  disabled={index === doc.sections.length - 1}
                  aria-label={`Bajar sección ${index + 1}`}
                >
                  <Icon name="chevron-down" size={15} />
                </button>
                <button
                  type="button"
                  className="icon-btn icon-btn-danger"
                  onClick={() => removeSection(index)}
                  aria-label={`Eliminar sección ${index + 1}`}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>

            <div className="field">
              <label htmlFor={`${documentKey}-heading-${index}`}>Título de la sección *</label>
              <input
                id={`${documentKey}-heading-${index}`}
                value={section.heading}
                onChange={e => updateSection(index, 'heading', e.target.value)}
                placeholder="Ej. Derechos de los titulares"
              />
            </div>
            <div className="field">
              <label htmlFor={`${documentKey}-body-${index}`}>Contenido *</label>
              <textarea
                id={`${documentKey}-body-${index}`}
                rows={4}
                value={section.body}
                onChange={e => updateSection(index, 'body', e.target.value)}
                placeholder="Redacta el contenido. Separa los párrafos con una línea en blanco."
              />
            </div>
          </li>
        ))}
      </ol>

      <div className="settings-actions settings-actions-split">
        <button type="button" className="btn btn-outline" onClick={addSection}>
          <Icon name="plus" size={15} /> Añadir sección
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Icon name="check" size={16} />
          {saving ? 'Publicando…' : 'Guardar y publicar'}
        </button>
      </div>
    </form>
  );
}
