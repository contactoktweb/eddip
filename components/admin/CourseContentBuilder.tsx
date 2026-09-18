'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Course, Module, Lesson } from '@/lib/types';
import { useDemo } from '@/app/providers';
import { adminService } from '@/lib/supabase/adminService';
import { Icon } from '@/lib/icons';

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const GRADIENT_PRESETS = [
  { name: 'Azul Eléctrico', value: 'linear-gradient(135deg,#0F59DF,#2F86FF)' },
  { name: 'Azul Marino', value: 'linear-gradient(135deg,#071F49,#073B9D)' },
  { name: 'Azul Cobalto', value: 'linear-gradient(135deg,#2050c9,#0c7af0 60%,#79c8ff)' },
  { name: 'Esmeralda Seguridad', value: 'linear-gradient(135deg,#059669,#0F59DF)' },
  { name: 'Púrpura Institucional', value: 'linear-gradient(135deg,#4f46e5,#0F59DF)' },
];

type Props = {
  initialCourse?: Course;
  isEditing?: boolean;
};

export function CourseContentBuilder({ initialCourse, isEditing = false }: Props) {
  const router = useRouter();
  const { addCourse, updateCourse } = useDemo();

  // 1. Datos Generales
  const [title, setTitle] = useState(initialCourse?.title || '');
  const [slug, setSlug] = useState(initialCourse?.slug || '');
  const [category, setCategory] = useState(initialCourse?.category || 'Seguridad y Policía');
  const [shortDescription, setShortDescription] = useState(initialCourse?.shortDescription || '');
  const [description, setDescription] = useState(initialCourse?.description || '');
  const [price, setPrice] = useState(initialCourse?.price || 45000);
  const [durationHours, setDurationHours] = useState(initialCourse?.durationHours || 40);
  const [level, setLevel] = useState(initialCourse?.level || 'Intermedio');
  const [gradient, setGradient] = useState(
    initialCourse?.gradient || 'linear-gradient(135deg,#0F59DF,#2F86FF)'
  );

  // 2. Instructor
  const [instructorName, setInstructorName] = useState(
    initialCourse?.instructor.name || 'Docente Especialista EDDIP'
  );
  const [instructorRole, setInstructorRole] = useState(
    initialCourse?.instructor.role || 'Experto en Derecho y Seguridad'
  );
  const [instructorBio, setInstructorBio] = useState(
    initialCourse?.instructor.bio ||
      'Docente con más de 12 años de trayectoria en formación policial, gestión pública y doctrina jurídica.'
  );

  // 3. Resultados de Aprendizaje
  const [outcomes, setOutcomes] = useState<string[]>(
    initialCourse?.outcomes || [
      'Comprender el marco legal y normativo aplicable al ejercicio profesional.',
      'Identificar los principios de razonabilidad, necesidad y proporcionalidad.',
      'Elaborar informes y actuaciones con estricto apego al debido proceso.',
    ]
  );
  const [newOutcome, setNewOutcome] = useState('');

  // 4. Módulos y Lecciones
  const [modules, setModules] = useState<Module[]>(
    initialCourse?.modules || [
      {
        id: 'mod-1',
        title: 'Módulo 1: Fundamentos y Marco Jurídico',
        lessons: [
          {
            id: 'l-1',
            title: 'Lección 1: Principios Constitucionales y Legales',
            minutes: 20,
            keyPoint: 'Toda actuación debe fundamentarse en la legalidad y el debido proceso.',
            content: [
              'En esta lección se establecen las bases normativas fundamentales que regulan el ejercicio de la función.',
              'Es indispensable verificar la competencia territorial y material antes de emitir cualquier decisión o procedimiento.',
            ],
          },
        ],
      },
    ]
  );

  // Estados de feedback
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!isEditing || !slug) {
      setSlug(slugify(val));
    }
  };

  // Manejo de Outcomes
  const addOutcome = () => {
    if (newOutcome.trim()) {
      setOutcomes(prev => [...prev, newOutcome.trim()]);
      setNewOutcome('');
    }
  };

  const removeOutcome = (index: number) => {
    setOutcomes(prev => prev.filter((_, i) => i !== index));
  };

  // Manejo de Módulos
  const addModule = () => {
    const newModId = `mod-${Date.now()}`;
    setModules(prev => [
      ...prev,
      {
        id: newModId,
        title: `Módulo ${prev.length + 1}: Nuevo Módulo Temático`,
        lessons: [
          {
            id: `les-${Date.now()}-1`,
            title: 'Lección 1: Introducción a la temática',
            minutes: 15,
            keyPoint: 'Identificar los conceptos clave de este módulo.',
            content: ['Escribe aquí el contenido pedagógico de la lección.'],
          },
        ],
      },
    ]);
  };

  const removeModule = (modIndex: number) => {
    if (modules.length <= 1) {
      alert('El curso debe contener al menos un módulo temático.');
      return;
    }
    setModules(prev => prev.filter((_, i) => i !== modIndex));
  };

  const updateModuleTitle = (modIndex: number, newTitle: string) => {
    setModules(prev =>
      prev.map((m, i) => (i === modIndex ? { ...m, title: newTitle } : m))
    );
  };

  // Manejo de Lecciones
  const addLesson = (modIndex: number) => {
    setModules(prev =>
      prev.map((m, i) => {
        if (i !== modIndex) return m;
        const newLessonId = `les-${Date.now()}`;
        return {
          ...m,
          lessons: [
            ...m.lessons,
            {
              id: newLessonId,
              title: `Lección ${m.lessons.length + 1}: Título de la lección`,
              minutes: 15,
              keyPoint: 'Punto clave para la práctica.',
              content: ['Contenido descriptivo de la nueva lección.'],
            },
          ],
        };
      })
    );
  };

  const removeLesson = (modIndex: number, lessonIndex: number) => {
    setModules(prev =>
      prev.map((m, i) => {
        if (i !== modIndex) return m;
        if (m.lessons.length <= 1) {
          alert('Cada módulo debe tener al menos una lección.');
          return m;
        }
        return {
          ...m,
          lessons: m.lessons.filter((_, j) => j !== lessonIndex),
        };
      })
    );
  };

  const updateLesson = (
    modIndex: number,
    lessonIndex: number,
    field: keyof Lesson,
    value: string | number | string[]
  ) => {
    setModules(prev =>
      prev.map((m, i) => {
        if (i !== modIndex) return m;
        return {
          ...m,
          lessons: m.lessons.map((l, j) => {
            if (j !== lessonIndex) return l;
            return { ...l, [field]: value };
          }),
        };
      })
    );
  };

  // Guardar Curso Completo
  const handleSave = async () => {
    if (!title.trim()) {
      showToast('error', 'Por favor ingresa el nombre del curso.');
      return;
    }

    const courseSlug = slug || slugify(title) || `curso-${Date.now()}`;

    const totalLessonsCount = modules.reduce((acc, m) => acc + m.lessons.length, 0);
    if (totalLessonsCount === 0) {
      showToast('error', 'Debes incluir al menos una lección en el curso.');
      return;
    }

    setIsSaving(true);

    const coursePayload: Course = {
      id: initialCourse?.id || `course-${Date.now()}`,
      slug: courseSlug,
      title: title.trim(),
      category,
      shortDescription: shortDescription.trim() || title,
      description: description.trim() || shortDescription || title,
      price: Number(price) || 0,
      durationHours: Number(durationHours) || 40,
      level,
      rating: initialCourse?.rating || 4.9,
      students: initialCourse?.students || 0,
      featured: initialCourse?.featured ?? false,
      gradient,
      instructor: {
        name: instructorName.trim(),
        role: instructorRole.trim(),
        bio: instructorBio.trim(),
      },
      outcomes: outcomes.length > 0 ? outcomes : ['Aprender los conceptos fundamentales.'],
      modules,
    };

    try {
      await adminService.saveCourse(coursePayload);

      if (isEditing) {
        updateCourse(coursePayload);
        showToast('success', '¡Curso y contenido actualizados con éxito!');
      } else {
        addCourse(coursePayload);
        showToast('success', '¡Nuevo curso publicado con éxito en la plataforma!');
      }

      setTimeout(() => {
        router.push('/admin/cursos');
      }, 1200);
    } catch {
      showToast('error', 'Ocurrió un problema al guardar el curso.');
    } finally {
      setIsSaving(false);
    }
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 12,
            background: toast.type === 'success' ? '#ecfdf5' : '#fff1f2',
            color: toast.type === 'success' ? '#059669' : '#dc2626',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Icon name={toast.type === 'success' ? 'check' : 'close'} size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Barra superior de acciones */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '16px 22px',
          borderRadius: 16,
          border: '1px solid var(--line)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Link className="btn btn-outline" href="/admin/cursos" style={{ fontSize: 13 }}>
            ← Volver a cursos
          </Link>
          <span style={{ fontSize: 13, color: '#64748b' }}>
            {modules.length} módulos · {totalLessons} lecciones creadas
          </span>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '10px 22px' }}
          >
            {isSaving ? 'Guardando en la plataforma...' : isEditing ? 'Guardar cambios' : 'Publicar curso'}
          </button>
        </div>
      </div>

      <div className="editor-grid">
        {/* Columna Principal: Formularios y Constructor */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Panel 1: Información General */}
          <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>1. Información General del Programa</h2>

            <div className="field">
              <label htmlFor="courseTitle">Nombre o título del curso *</label>
              <input
                id="courseTitle"
                value={title}
                onChange={e => handleTitleChange(e.target.value)}
                placeholder="Ej. Diplomado en Derecho de Policía y Seguridad"
                required
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label htmlFor="courseSlug">Identificador de URL (Slug)</label>
                <input
                  id="courseSlug"
                  value={slug}
                  onChange={e => setSlug(slugify(e.target.value))}
                  placeholder="ej-derecho-de-policia"
                />
              </div>

              <div className="field">
                <label htmlFor="courseCategory">Categoría académica *</label>
                <select
                  id="courseCategory"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  <option value="Seguridad y Policía">Seguridad y Policía</option>
                  <option value="Gestión Pública">Gestión Pública</option>
                  <option value="Área Jurídica">Área Jurídica</option>
                  <option value="Desarrollo Profesional">Desarrollo Profesional</option>
                  <option value="Movilidad y Seguridad Vial">Movilidad y Seguridad Vial</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="shortDesc">Descripción corta (para tarjetas y catálogo)</label>
              <input
                id="shortDesc"
                value={shortDescription}
                onChange={e => setShortDescription(e.target.value)}
                placeholder="Resumen de 1 a 2 oraciones sobre el propósito del programa..."
              />
            </div>

            <div className="field">
              <label htmlFor="fullDesc">Descripción completa del curso</label>
              <textarea
                id="fullDesc"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                placeholder="Detalla los antecedentes, la justificación y el alcance del programa..."
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              <div className="field">
                <label htmlFor="price">Precio (COP) *</label>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="hours">Duración certificada (horas) *</label>
                <input
                  id="hours"
                  type="number"
                  value={durationHours}
                  onChange={e => setDurationHours(Number(e.target.value))}
                />
              </div>

              <div className="field">
                <label htmlFor="level">Nivel de formación</label>
                <select id="level" value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="Básico">Básico</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Avanzado">Avanzado</option>
                </select>
              </div>
            </div>

            {/* Selector de Portada / Gradiente */}
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#43536a', marginBottom: 8 }}>
                Estilo visual y color de portada
              </label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {GRADIENT_PRESETS.map(preset => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => setGradient(preset.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 12px',
                      borderRadius: 8,
                      border: gradient === preset.value ? '2px solid #0F59DF' : '1px solid var(--line)',
                      background: '#fff',
                      cursor: 'pointer',
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: 4,
                        background: preset.value,
                        display: 'inline-block',
                      }}
                    />
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Panel 2: Constructor de Módulos y Lecciones */}
          <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div>
                <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>2. Contenido de Módulos y Lecciones</h2>
                <p style={{ fontSize: 13, color: '#68788d', margin: 0 }}>
                  Estructura el plan de estudios, los minutos de lectura y los puntos clave de cada lección.
                </p>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={addModule}
                style={{ fontSize: 13, padding: '8px 16px' }}
              >
                <Icon name="plus" /> Añadir módulo
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {modules.map((m, mIdx) => (
                <div
                  key={m.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 18,
                    background: '#fcfdfe',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
                      <span className="cover-chip" style={{ fontSize: 11 }}>
                        Módulo {mIdx + 1}
                      </span>
                      <input
                        value={m.title}
                        onChange={e => updateModuleTitle(mIdx, e.target.value)}
                        placeholder="Título del módulo..."
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          padding: '6px 10px',
                          borderRadius: 8,
                          border: '1px solid var(--line)',
                          flex: 1,
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeModule(mIdx)}
                      title="Eliminar módulo"
                      style={{ color: '#dc2626', marginLeft: 12 }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>

                  {/* Lecciones del módulo */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                    {m.lessons.map((l, lIdx) => (
                      <div
                        key={l.id}
                        style={{
                          background: '#fff',
                          border: '1px solid var(--line)',
                          borderRadius: 12,
                          padding: 16,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 12,
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0F59DF' }}>
                              Lección {lIdx + 1}:
                            </span>
                            <input
                              value={l.title}
                              onChange={e => updateLesson(mIdx, lIdx, 'title', e.target.value)}
                              placeholder="Título de la lección..."
                              style={{
                                fontSize: 14,
                                fontWeight: 600,
                                padding: '6px 10px',
                                borderRadius: 8,
                                border: '1px solid var(--line)',
                                flex: 1,
                              }}
                            />
                          </div>

                          <button
                            type="button"
                            className="icon-btn"
                            onClick={() => removeLesson(mIdx, lIdx)}
                            title="Eliminar lección"
                            style={{ color: '#dc2626', marginLeft: 8 }}
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>

                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12 }}>
                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontSize: 11 }}>Duración (min)</label>
                            <input
                              type="number"
                              value={l.minutes}
                              onChange={e => updateLesson(mIdx, lIdx, 'minutes', Number(e.target.value))}
                            />
                          </div>

                          <div className="field" style={{ margin: 0 }}>
                            <label style={{ fontSize: 11 }}>Punto clave pedagógico o normativo</label>
                            <input
                              value={l.keyPoint || ''}
                              onChange={e => updateLesson(mIdx, lIdx, 'keyPoint', e.target.value)}
                              placeholder="Ej. La proporcionalidad exige adecuación entre la medida y la finalidad..."
                            />
                          </div>
                        </div>

                        <div className="field" style={{ margin: 0 }}>
                          <label style={{ fontSize: 11 }}>
                            Contenido de lectura de la lección (separa los párrafos con saltos de línea dobles)
                          </label>
                          <textarea
                            value={l.content.join('\n\n')}
                            onChange={e =>
                              updateLesson(
                                mIdx,
                                lIdx,
                                'content',
                                e.target.value.split(/\n\s*\n/).filter(Boolean)
                              )
                            }
                            rows={3}
                            placeholder="Escribe o pega aquí el contenido de la lección..."
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => addLesson(mIdx)}
                      style={{ fontSize: 12, padding: '7px 14px', alignSelf: 'flex-start' }}
                    >
                      <Icon name="plus" /> Añadir lección a este módulo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Panel 3: Instructor y Resultados */}
          <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 16 }}>3. Docente y Objetivos de Aprendizaje</h2>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="field">
                <label htmlFor="instName">Nombre del docente / instructor</label>
                <input
                  id="instName"
                  value={instructorName}
                  onChange={e => setInstructorName(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="instRole">Especialidad o cargo</label>
                <input
                  id="instRole"
                  value={instructorRole}
                  onChange={e => setInstructorRole(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="instBio">Perfil profesional del docente</label>
              <textarea
                id="instBio"
                value={instructorBio}
                onChange={e => setInstructorBio(e.target.value)}
                rows={2}
              />
            </div>

            <div style={{ marginTop: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#43536a', marginBottom: 8 }}>
                Competencias que adquirirá el estudiante
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                {outcomes.map((out, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#f8fafc',
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icon name="check" size={14} /> {out}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeOutcome(idx)}
                      title="Eliminar competencia"
                    >
                      <Icon name="close" size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newOutcome}
                  onChange={e => setNewOutcome(e.target.value)}
                  placeholder="Añadir nuevo resultado de aprendizaje..."
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addOutcome())}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={addOutcome}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <Icon name="plus" /> Añadir
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Columna Lateral: Vista Previa en Vivo */}
        <aside className="panel sticky-card" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 22 }}>
          <span className="eyebrow">Vista previa interactiva</span>

          <div
            className="preview-cover"
            style={{
              background: gradient,
              borderRadius: 14,
              padding: 24,
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
              marginTop: 14,
              minHeight: 140,
            }}
          >
            <Icon name="book" size={48} />
          </div>

          <div style={{ marginTop: 14 }}>
            <span className="cover-chip" style={{ fontSize: 10, marginBottom: 6, display: 'inline-block' }}>
              {category}
            </span>
            <h3 style={{ fontSize: 16, lineHeight: 1.3, margin: '4px 0 8px' }}>
              {title || 'Título del programa formativo'}
            </h3>
            <p style={{ fontSize: 12, color: '#68788d', lineHeight: 1.5, margin: '0 0 12px' }}>
              {shortDescription || 'Breve descripción que resume los propósitos del curso.'}
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                background: '#f8fafc',
                padding: 10,
                borderRadius: 10,
                textAlign: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#071F49' }}>{durationHours}h</strong>
                <span style={{ fontSize: 10, color: '#64748b' }}>Duración</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#071F49' }}>{modules.length}</strong>
                <span style={{ fontSize: 10, color: '#64748b' }}>Módulos</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#071F49' }}>{totalLessons}</strong>
                <span style={{ fontSize: 10, color: '#64748b' }}>Lecciones</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>Inversión</span>
              <strong style={{ fontSize: 18, color: '#0F59DF' }}>
                ${Number(price).toLocaleString('es-CO')} COP
              </strong>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
              <span style={{ fontSize: 11, color: '#8b9bb4', display: 'block', marginBottom: 4 }}>
                Docente responsable
              </span>
              <strong style={{ fontSize: 13, display: 'block' }}>{instructorName}</strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>{instructorRole}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
