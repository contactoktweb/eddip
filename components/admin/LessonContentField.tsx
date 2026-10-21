'use client';
import { useState } from 'react';

type Props = {
  id: string;
  paragraphs: string[];
  onChange: (paragraphs: string[]) => void;
};

const toParagraphs = (text: string) => text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

/**
 * Conserva el texto tal como se escribe o pega (incluidas las líneas en blanco entre párrafos)
 * y entrega al curso la lista de párrafos ya separada.
 */
export function LessonContentField({ id, paragraphs, onChange }: Props) {
  const [text, setText] = useState(() => paragraphs.join('\n\n'));

  return (
    <textarea
      id={id}
      value={text}
      onChange={e => {
        setText(e.target.value);
        onChange(toParagraphs(e.target.value));
      }}
      rows={5}
      placeholder="Escribe o pega aquí el contenido de la lección. Deja una línea en blanco entre párrafos."
    />
  );
}
