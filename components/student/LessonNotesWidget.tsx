'use client';
import { useState, useEffect } from 'react';
import { useDemo } from '@/app/providers';
import { Icon } from '@/lib/icons';

type Props = {
  courseSlug: string;
  lessonId: string;
  lessonTitle: string;
};

export function LessonNotesWidget({ courseSlug, lessonId, lessonTitle }: Props) {
  const { notes, saveNote } = useDemo();
  const noteKey = `${courseSlug}_${lessonId}`;

  const [text, setText] = useState(notes[noteKey] || '');
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setText(notes[noteKey] || '');
    setSaved(false);
  }, [noteKey, notes]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveNote(courseSlug, lessonId, text);
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '20px',
        marginTop: 24,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#f0f5ff',
              color: '#0F59DF',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="edit" size={16} />
          </div>
          <h3 style={{ fontSize: 15, margin: 0, fontWeight: 600 }}>Mis apuntes de estudio</h3>
        </div>

        {saved && (
          <span
            style={{
              fontSize: 12,
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 500,
            }}
          >
            <Icon name="check" size={14} /> Guardado en tu cuenta
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, color: '#7a8b9e', marginBottom: 12 }}>
        Escribe tus notas y conceptos clave para: <strong>{lessonTitle}</strong>. Quedarán almacenadas en tu cuenta para repasar antes de la evaluación.
      </p>

      <textarea
        value={text}
        onChange={e => {
          setText(e.target.value);
          setSaved(false);
        }}
        placeholder="Anota aquí citas normativas, artículos relevantes, procedimientos o dudas..."
        rows={4}
        style={{
          width: '100%',
          padding: '12px 14px',
          borderRadius: 10,
          border: '1px solid var(--line)',
          fontSize: 13,
          fontFamily: 'inherit',
          resize: 'vertical',
          boxSizing: 'border-box',
          lineHeight: 1.5,
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSave}
          disabled={isSaving}
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          {isSaving ? 'Guardando...' : 'Guardar apunte'}
        </button>
      </div>
    </div>
  );
}
