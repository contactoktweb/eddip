'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Course, Exam, ExamQuestion } from '@/lib/types';
import { adminService } from '@/lib/supabase/adminService';
import { Icon } from '@/lib/icons';

type Props = {
  courses: Course[];
  exams: Exam[];
};

export function AdminExamManager({ courses, exams: initialExams }: Props) {
  const searchParams = useSearchParams();
  const queryCourse = searchParams ? searchParams.get('course') : null;

  const [allExams, setAllExams] = useState<Exam[]>(initialExams);
  const [selectedSlug, setSelectedSlug] = useState<string>(() => {
    if (queryCourse && courses.some(c => c.slug === queryCourse)) {
      return queryCourse;
    }
    return courses[0]?.slug || 'derecho-de-policia';
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sincronizar exámenes desde base de datos / storage
  useEffect(() => {
    adminService.getExams().then(loaded => {
      if (loaded && loaded.length > 0) {
        setAllExams(loaded);
      }
    });
  }, []);

  // Si cambia el query param en la URL
  useEffect(() => {
    if (queryCourse && courses.some(c => c.slug === queryCourse)) {
      setSelectedSlug(queryCourse);
    }
  }, [queryCourse, courses]);

  // Examen actual seleccionado
  const currentExam = useMemo(() => {
    const existing = allExams.find(e => e.courseSlug === selectedSlug);
    if (existing && existing.questions && existing.questions.length > 0) {
      return existing;
    }

    const c = courses.find(x => x.slug === selectedSlug);
    return {
      courseSlug: selectedSlug,
      title: `Evaluación de Certificación — ${c?.title || 'Curso'}`,
      passingScore: 75,
      questions: c && c.modules && c.modules.length > 0
        ? c.modules.flatMap((m, mIdx) => [
            {
              id: `q_${selectedSlug}_${mIdx}_1`,
              text: `En el marco de ${m.title}, ¿cuál es el principio orientador prioritario para la correcta actuación del servidor o profesional?`,
              options: [
                'Garantizar el estricto apego al orden legal, la proporcionalidad y la debida fundamentación',
                'Proceder sin registro documental ni motivación jurídica',
                'Omitir el debido proceso en favor de la inmediatez',
                'Delegar las facultades normativas a particulares sin competencia',
              ],
              correct: 0,
            },
            {
              id: `q_${selectedSlug}_${mIdx}_2`,
              text: `¿Qué garantía institucional asegura la correcta ejecución de los protocolos revisados en ${m.title}?`,
              options: [
                'Reducir la transparencia en la rendición de cuentas',
                'Asegurar trazabilidad institucional, legalidad formal y validez probatoria',
                'Eximir de responsabilidad disciplinaria a los intervinientes',
                'Limitar el acceso a la defensa de las partes interesadas',
              ],
              correct: 1,
            },
          ])
        : [
            {
              id: `q_${selectedSlug}_1`,
              text: '¿Cuál es el principio orientador en este programa de formación institucional?',
              options: [
                'Asegurar el cumplimiento estricto del orden legal, constitucional y los derechos ciudadanos',
                'Proceder discrecionalmente sin fundamentación legal',
                'Omitir la trazabilidad documental de los procedimientos',
                'Actuar al margen de los protocolos institucionales vigentes',
              ],
              correct: 0,
            },
            {
              id: `q_${selectedSlug}_2`,
              text: '¿Qué finalidad primordial persigue la correcta fundamentación de las decisiones operativas y jurídicas?',
              options: [
                'Eliminar la supervisión de las autoridades de control',
                'Brindar certeza, apego a derecho y legitimidad pública a la actuación institucional',
                'Acelerar trámites suprimiendo los términos legales del procedimiento',
                'Restringir la publicidad de los actos oficiales',
              ],
              correct: 1,
            },
          ],
    };
  }, [allExams, selectedSlug, courses]);

  const [passingScore, setPassingScore] = useState<number>(currentExam.passingScore);
  const [questions, setQuestions] = useState<ExamQuestion[]>(currentExam.questions);

  // Actualizar estado local cuando cambia el examen seleccionado
  useEffect(() => {
    setPassingScore(currentExam.passingScore);
    setQuestions(currentExam.questions);
    setHasPendingChanges(false);
    setSaveStatus('saved');
  }, [currentExam]);

  const handleCourseChange = (slug: string) => {
    setSelectedSlug(slug);
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', `/admin/evaluaciones?course=${slug}`);
    }
  };

  // Función ejecutora del guardado
  const executeSave = useCallback(async (qsToSave: ExamQuestion[], minScore: number) => {
    setSaveStatus('saving');
    const c = courses.find(x => x.slug === selectedSlug);
    const payload: Exam = {
      courseSlug: selectedSlug,
      title: `Evaluación de Certificación — ${c?.title || 'Curso'}`,
      passingScore: Number(minScore),
      questions: qsToSave,
    };

    await adminService.saveExam(payload);

    setAllExams(prev => {
      const idx = prev.findIndex(e => e.courseSlug === selectedSlug);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = payload;
        return next;
      }
      return [payload, ...prev];
    });

    setSaveStatus('saved');
    setHasPendingChanges(false);
  }, [selectedSlug, courses]);

  // Disparador de auto-guardado con debounce de 700ms
  const triggerAutoSave = useCallback((qsToSave: ExamQuestion[], minScore: number) => {
    setSaveStatus('unsaved');
    setHasPendingChanges(true);
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      executeSave(qsToSave, minScore);
    }, 700);
  }, [executeSave]);

  const addQuestion = () => {
    const c = courses.find(x => x.slug === selectedSlug);
    const newIdx = questions.length + 1;
    const newQ: ExamQuestion = {
      id: `q_${selectedSlug}_${Date.now()}`,
      text: `Pregunta #${newIdx}: ¿Cuál es el criterio orientador prioritario para la correcta aplicación práctica de los conocimientos en ${c?.title || 'este curso'}?`,
      options: [
        'Asegurar el apego estricto al marco normativo, la fundamentación legal y la debida diligencia',
        'Proceder de manera discrecional sin justificación jurídica ni soporte documental',
        'Omitir los términos y procedimientos legales en favor de la inmediatez',
        'Delegar competencias regladas sin control ni trazabilidad institucional',
      ],
      correct: 0,
    };
    const updated = [...questions, newQ];
    setQuestions(updated);
    triggerAutoSave(updated, passingScore);
    setToast(`¡Pregunta #${newIdx} añadida! Evaluación actualizada a ${updated.length} preguntas.`);
    setTimeout(() => setToast(null), 3000);
  };

  const duplicateQuestion = (qId: string) => {
    const target = questions.find(q => q.id === qId);
    if (!target) return;
    const copy: ExamQuestion = {
      ...target,
      id: `q_${selectedSlug}_${Date.now()}`,
      text: `${target.text} (Copia)`,
      options: [...target.options],
    };
    const targetIdx = questions.findIndex(q => q.id === qId);
    const updated = [...questions];
    updated.splice(targetIdx + 1, 0, copy);
    setQuestions(updated);
    triggerAutoSave(updated, passingScore);
    setToast(`Pregunta duplicada. Evaluación actualizada a ${updated.length} preguntas.`);
    setTimeout(() => setToast(null), 3000);
  };

  const removeQuestion = (qId: string) => {
    if (questions.length <= 1) {
      alert('La evaluación debe contener al menos una pregunta para poder emitir el certificado.');
      return;
    }
    const updated = questions.filter(q => q.id !== qId);
    setQuestions(updated);
    triggerAutoSave(updated, passingScore);
    setToast(`Pregunta eliminada. Evaluación actualizada a ${updated.length} preguntas.`);
    setTimeout(() => setToast(null), 3000);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;
    const updated = [...questions];
    const [removed] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, removed);
    setQuestions(updated);
    triggerAutoSave(updated, passingScore);
  };

  const updateQuestionText = (qId: string, text: string) => {
    const updated = questions.map(q => (q.id === qId ? { ...q, text } : q));
    setQuestions(updated);
    triggerAutoSave(updated, passingScore);
  };

  const updateQuestionOption = (qId: string, optionIndex: number, text: string) => {
    const updated = questions.map(q => {
      if (q.id !== qId) return q;
      const newOpts = [...q.options];
      newOpts[optionIndex] = text;
      return { ...q, options: newOpts };
    });
    setQuestions(updated);
    triggerAutoSave(updated, passingScore);
  };

  const updateQuestionCorrect = (qId: string, correct: number) => {
    const updated = questions.map(q => (q.id === qId ? { ...q, correct } : q));
    setQuestions(updated);
    triggerAutoSave(updated, passingScore);
  };

  const handlePassingScoreChange = (newScore: number) => {
    setPassingScore(newScore);
    triggerAutoSave(questions, newScore);
  };

  const handleManualSave = async () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    await executeSave(questions, passingScore);
    setToast(`¡Evaluación guardada y sincronizada! Consta de ${questions.length} preguntas.`);
    setIsModalOpen(false);
    setTimeout(() => setToast(null), 3500);
  };

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
            padding: '14px 20px',
            borderRadius: 14,
            background: '#ecfdf5',
            color: '#059669',
            boxShadow: '0 12px 30px rgba(5, 150, 105, 0.2)',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Icon name="check" size={20} />
          <span>{toast}</span>
        </div>
      )}

      {/* Barra de control superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '18px 22px',
          borderRadius: 18,
          border: '1px solid var(--line)',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: '0 2px 10px rgba(7, 31, 73, 0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#071F49' }}>
              Seleccionar curso:
            </label>
            <select
              value={selectedSlug}
              onChange={e => handleCourseChange(e.target.value)}
              style={{
                padding: '9px 16px',
                borderRadius: 12,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontWeight: 600,
                color: '#071F49',
                background: '#fff',
                outline: 'none',
                cursor: 'pointer',
                minWidth: 260,
              }}
            >
              {courses.map(c => (
                <option key={c.id} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>
              Puntaje mínimo:
            </label>
            <select
              value={passingScore}
              onChange={e => handlePassingScoreChange(Number(e.target.value))}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                fontSize: 13,
                fontWeight: 700,
                color: '#0b62dd',
                background: '#eff6ff',
                cursor: 'pointer',
              }}
            >
              <option value={60}>60%</option>
              <option value={70}>70%</option>
              <option value={75}>75% (Estándar)</option>
              <option value={80}>80%</option>
              <option value={85}>85%</option>
              <option value={90}>90%</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Indicador de estado de sincronización */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '6px 12px',
              borderRadius: 20,
              background: saveStatus === 'saving' ? '#eff6ff' : saveStatus === 'unsaved' ? '#fffbeb' : '#f0fdf4',
              color: saveStatus === 'saving' ? '#1d4ed8' : saveStatus === 'unsaved' ? '#b45309' : '#15803d',
              border: `1px solid ${saveStatus === 'saving' ? '#bfdbfe' : saveStatus === 'unsaved' ? '#fde68a' : '#bbf7d0'}`,
            }}
          >
            {saveStatus === 'saving' ? (
              <>
                <span className="spinner-sm" /> Guardando...
              </>
            ) : saveStatus === 'unsaved' ? (
              <>● Cambios pendientes</>
            ) : (
              <>
                <Icon name="check" size={14} /> Sincronizado en tiempo real
              </>
            )}
          </span>

          <button
            type="button"
            className="btn btn-primary"
            onClick={addQuestion}
            style={{
              padding: '9px 18px',
              fontSize: 13,
              fontWeight: 700,
              borderRadius: 12,
              gap: 6,
              boxShadow: '0 4px 12px rgba(11, 98, 221, 0.2)',
            }}
          >
            <Icon name="plus" size={16} /> Añadir pregunta
          </button>

          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, borderRadius: 12 }}
            title="Abrir editor en ventana modal"
          >
            <Icon name="edit" size={15} /> Editor modal
          </button>
        </div>
      </div>

      {/* Resumen y lista interactiva del examen activo */}
      <div className="panel" style={{ background: '#fff', borderRadius: 22, border: '1px solid var(--line)', padding: 28, boxShadow: '0 4px 20px rgba(7, 31, 73, 0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="cover-chip" style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                Puntaje mínimo aprobatorio: {passingScore}%
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#0b62dd',
                  background: '#eef4ff',
                  padding: '3px 10px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {questions.length} {questions.length === 1 ? 'Pregunta' : 'Preguntas'} configuradas
              </span>
            </div>
            <h2 style={{ fontSize: 22, color: '#071F49', margin: '0 0 6px', fontWeight: 800 }}>
              {currentExam.title}
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Consta de <strong style={{ color: '#0b62dd' }}>{questions.length} {questions.length === 1 ? 'pregunta' : 'preguntas'}</strong> de selección múltiple. Al aprobar con {passingScore}% o superior, se expide automáticamente el diploma oficial verificable.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="badge status-ok" style={{ fontSize: 12, padding: '6px 12px' }}>
              Evaluación Activa
            </span>
          </div>
        </div>

        {/* Lista interactiva de preguntas desplegada directamente en pantalla */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18, marginTop: 20 }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: 16,
                padding: '20px 22px',
                background: '#ffffff',
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              {/* Encabezado de la pregunta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 14,
                  flexWrap: 'wrap',
                  gap: 10,
                  paddingBottom: 12,
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 800,
                      color: '#ffffff',
                      background: '#0b62dd',
                      padding: '4px 12px',
                      borderRadius: 10,
                    }}
                  >
                    Pregunta #{idx + 1}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#047857',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      padding: '3px 10px',
                      borderRadius: 8,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Icon name="check" size={13} />
                    Respuesta correcta: Opción {String.fromCharCode(65 + q.correct)}
                  </span>
                </div>

                {/* Acciones de reordenamiento y gestión */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => moveQuestion(idx, 'up')}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: idx === 0 ? 'not-allowed' : 'pointer',
                      opacity: idx === 0 ? 0.4 : 1,
                      color: '#334155',
                      fontSize: 13,
                    }}
                    title="Mover arriba"
                  >
                    ↑
                  </button>

                  <button
                    type="button"
                    disabled={idx === questions.length - 1}
                    onClick={() => moveQuestion(idx, 'down')}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      width: 32,
                      height: 32,
                      display: 'grid',
                      placeItems: 'center',
                      cursor: idx === questions.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: idx === questions.length - 1 ? 0.4 : 1,
                      color: '#334155',
                      fontSize: 13,
                    }}
                    title="Mover abajo"
                  >
                    ↓
                  </button>

                  <button
                    type="button"
                    onClick={() => duplicateQuestion(q.id)}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 8,
                      padding: '6px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#475569',
                    }}
                    title="Duplicar esta pregunta"
                  >
                    ⧉ Duplicar
                  </button>

                  <button
                    type="button"
                    disabled={questions.length <= 1}
                    onClick={() => removeQuestion(q.id)}
                    style={{
                      background: '#fff1f2',
                      border: '1px solid #fecaca',
                      borderRadius: 8,
                      padding: '6px 10px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      cursor: questions.length <= 1 ? 'not-allowed' : 'pointer',
                      opacity: questions.length <= 1 ? 0.5 : 1,
                      color: '#dc2626',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                    title="Eliminar pregunta"
                  >
                    <Icon name="trash" size={14} /> Eliminar
                  </button>
                </div>
              </div>

              {/* Enunciado de la pregunta editable */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                  Enunciado de la pregunta:
                </label>
                <textarea
                  rows={2}
                  value={q.text}
                  onChange={e => updateQuestionText(q.id, e.target.value)}
                  placeholder="Escribe el enunciado de la pregunta..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#071F49',
                    outline: 'none',
                    background: '#fbfcfd',
                    resize: 'vertical',
                    lineHeight: 1.45,
                  }}
                />
              </div>

              {/* Opciones de respuesta interactivas (A, B, C, D) */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 8 }}>
                  Opciones de respuesta (Marca el botón circular en la opción correcta):
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                    gap: 10,
                  }}
                >
                  {q.options.map((opt, oIdx) => {
                    const isCorrect = q.correct === oIdx;
                    return (
                      <div
                        key={oIdx}
                        onClick={() => updateQuestionCorrect(q.id, oIdx)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 12,
                          fontSize: 13,
                          background: isCorrect ? '#f0fdf4' : '#ffffff',
                          border: isCorrect ? '2px solid #10b981' : '1px solid #cbd5e1',
                          color: isCorrect ? '#065f46' : '#334155',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          cursor: 'pointer',
                          transition: 'all 0.15s ease-in-out',
                          boxShadow: isCorrect ? '0 2px 8px rgba(16, 185, 129, 0.12)' : 'none',
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct_${q.id}`}
                          checked={isCorrect}
                          onChange={() => updateQuestionCorrect(q.id, oIdx)}
                          style={{ cursor: 'pointer', accentColor: '#10b981' }}
                          title="Marcar como respuesta correcta"
                        />
                        <span
                          style={{
                            fontWeight: 800,
                            fontSize: 13,
                            color: isCorrect ? '#047857' : '#0b62dd',
                            minWidth: 20,
                          }}
                        >
                          {String.fromCharCode(65 + oIdx)})
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateQuestionOption(q.id, oIdx, e.target.value)}
                          placeholder={`Escribe la opción ${String.fromCharCode(65 + oIdx)}...`}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: 'transparent',
                            outline: 'none',
                            fontSize: 13,
                            color: isCorrect ? '#065f46' : '#1e293b',
                            fontWeight: isCorrect ? 600 : 400,
                          }}
                        />
                        {isCorrect && (
                          <span
                            style={{
                              fontSize: 11,
                              fontWeight: 700,
                              color: '#059669',
                              background: '#dcfce7',
                              padding: '2px 8px',
                              borderRadius: 10,
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Icon name="check" size={12} /> Correcta
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barra inferior: Botón para añadir más preguntas y botón para guardar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 26,
            paddingTop: 20,
            borderTop: '1px solid #e2e8f0',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <button
            type="button"
            className="btn btn-outline"
            onClick={addQuestion}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 700,
              borderRadius: 12,
              gap: 8,
              border: '2px dashed #0b62dd',
              color: '#0b62dd',
              background: '#eff6ff',
            }}
          >
            <Icon name="plus" size={18} /> + Añadir otra pregunta a esta evaluación
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={handleManualSave}
              style={{
                padding: '12px 28px',
                fontSize: 14,
                fontWeight: 700,
                borderRadius: 12,
                gap: 8,
                boxShadow: '0 6px 18px rgba(11, 98, 221, 0.25)',
              }}
            >
              <Icon name="check" size={18} /> Guardar cuestionario ({questions.length} preguntas)
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Editor Alternativo de Cuestionario */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 21, 43, 0.5)',
            backdropFilter: 'blur(4px)',
            zIndex: 999,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            className="panel"
            style={{
              width: 'min(800px, 100%)',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 24,
              padding: 32,
              boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 20, margin: '0 0 4px', color: '#071F49', fontWeight: 800 }}>
                  Editor Rápido de Evaluación
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                  {courses.find(c => c.slug === selectedSlug)?.title}
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsModalOpen(false)}
                style={{ borderRadius: 10, padding: 8 }}
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="field" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 12 }}>
              <label htmlFor="passingScoreModal" style={{ fontSize: 13, fontWeight: 700, color: '#071F49' }}>
                Puntaje mínimo de aprobación (%):
              </label>
              <input
                id="passingScoreModal"
                type="number"
                value={passingScore}
                onChange={e => handlePassingScoreChange(Number(e.target.value))}
                min={50}
                max={100}
                style={{ width: 100, padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontWeight: 700 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: 14,
                    padding: 16,
                    background: '#f8fafc',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#0b62dd' }}>
                      Pregunta #{qIdx + 1}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => removeQuestion(q.id)}
                      title="Eliminar pregunta"
                      style={{ color: '#dc2626' }}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>

                  <div className="field" style={{ marginBottom: 12 }}>
                    <input
                      value={q.text}
                      onChange={e => updateQuestionText(q.id, e.target.value)}
                      placeholder="Escribe el enunciado de la pregunta..."
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          background: q.correct === oIdx ? '#f0fdf4' : '#fff',
                          border: q.correct === oIdx ? '1px solid #10b981' : '1px solid #e2e8f0',
                          padding: '6px 10px',
                          borderRadius: 8,
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct_modal_${q.id}`}
                          checked={q.correct === oIdx}
                          onChange={() => updateQuestionCorrect(q.id, oIdx)}
                          title="Marcar como respuesta correcta"
                          style={{ accentColor: '#10b981' }}
                        />
                        <span style={{ fontSize: 13, fontWeight: 700, width: 22, color: q.correct === oIdx ? '#047857' : '#0b62dd' }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <input
                          value={opt}
                          onChange={e => updateQuestionOption(q.id, oIdx, e.target.value)}
                          placeholder={`Opción ${String.fromCharCode(65 + oIdx)}...`}
                          style={{ flex: 1, padding: '6px 10px', fontSize: 13, border: 'none', background: 'transparent', outline: 'none' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
              <button type="button" className="btn btn-soft" onClick={addQuestion}>
                <Icon name="plus" /> Añadir pregunta
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cerrar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleManualSave}>
                  Guardar cuestionario
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
