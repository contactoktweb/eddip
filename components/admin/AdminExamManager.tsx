'use client';
import { useState } from 'react';
import type { Course, Exam, ExamQuestion } from '@/lib/types';
import { adminService } from '@/lib/supabase/adminService';
import { Icon } from '@/lib/icons';

type Props = {
  courses: Course[];
  exams: Exam[];
};

export function AdminExamManager({ courses, exams }: Props) {
  const [selectedSlug, setSelectedSlug] = useState(courses[0]?.slug || 'derecho-de-policia');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Examen actual seleccionado
  const currentExam = exams.find(e => e.courseSlug === selectedSlug) || {
    courseSlug: selectedSlug,
    title: `Evaluación Final — ${courses.find(c => c.slug === selectedSlug)?.title || 'Curso'}`,
    passingScore: 70,
    questions: [
      {
        id: `q-${Date.now()}-1`,
        text: '¿Cuál es el principio orientador de este programa de formación?',
        options: [
          'Asegurar el cumplimiento estricto del orden legal y constitucional',
          'Proceder sin fundamentación técnica ni motivación',
          'Omitir los registros de control documental',
          'Delegar la función sin verificación previa',
        ],
        correct: 0,
      },
    ],
  };

  const [passingScore, setPassingScore] = useState(currentExam.passingScore);
  const [questions, setQuestions] = useState<ExamQuestion[]>(currentExam.questions);

  const handleCourseChange = (slug: string) => {
    setSelectedSlug(slug);
    const existing = exams.find(e => e.courseSlug === slug);
    if (existing) {
      setPassingScore(existing.passingScore);
      setQuestions(existing.questions);
    } else {
      const c = courses.find(x => x.slug === slug);
      setPassingScore(70);
      setQuestions([
        {
          id: `q-${Date.now()}-1`,
          text: `¿Cuál es el objetivo primordial en ${c?.title || 'este curso'}?`,
          options: [
            'Garantizar la correcta aplicación de los protocolos normativos',
            'Omitir la motivación en las decisiones',
            'Actuar al margen del debido proceso',
            'Evitar la trazabilidad institucional',
          ],
          correct: 0,
        },
      ]);
    }
  };

  const addQuestion = () => {
    const newQ: ExamQuestion = {
      id: `q-${Date.now()}`,
      text: 'Nueva pregunta de evaluación...',
      options: ['Opción correcta A', 'Opción distractora B', 'Opción distractora C', 'Opción distractora D'],
      correct: 0,
    };
    setQuestions(prev => [...prev, newQ]);
  };

  const removeQuestion = (qId: string) => {
    if (questions.length <= 1) {
      alert('La evaluación debe contener al menos una pregunta.');
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const updateQuestionText = (qId: string, text: string) => {
    setQuestions(prev => prev.map(q => (q.id === qId ? { ...q, text } : q)));
  };

  const updateQuestionOption = (qId: string, optionIndex: number, text: string) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id !== qId) return q;
        const newOpts = [...q.options];
        newOpts[optionIndex] = text;
        return { ...q, options: newOpts };
      })
    );
  };

  const updateQuestionCorrect = (qId: string, correct: number) => {
    setQuestions(prev => prev.map(q => (q.id === qId ? { ...q, correct } : q)));
  };

  const handleSaveExam = async () => {
    const c = courses.find(x => x.slug === selectedSlug);
    const payload: Exam = {
      courseSlug: selectedSlug,
      title: `Evaluación Final — ${c?.title || 'Curso'}`,
      passingScore: Number(passingScore),
      questions,
    };

    await adminService.saveExam(payload);
    setToast('¡Evaluación guardada y sincronizada correctamente!');
    setIsModalOpen(false);
    setTimeout(() => setToast(null), 3000);
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
            padding: '12px 18px',
            borderRadius: 12,
            background: '#ecfdf5',
            color: '#059669',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Icon name="check" size={18} />
          <span>{toast}</span>
        </div>
      )}

      {/* Barra de control */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--line)',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#43536a' }}>
            Seleccionar curso:
          </label>
          <select
            value={selectedSlug}
            onChange={e => handleCourseChange(e.target.value)}
            style={{
              padding: '8px 14px',
              borderRadius: 10,
              border: '1px solid var(--line)',
              fontSize: 13,
              background: '#fff',
            }}
          >
            {courses.map(c => (
              <option key={c.id} value={c.slug}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsModalOpen(true)}
          style={{ fontSize: 13 }}
        >
          <Icon name="edit" /> Configurar cuestionario
        </button>
      </div>

      {/* Resumen del examen activo */}
      <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <span className="cover-chip" style={{ fontSize: 11, marginBottom: 8, display: 'inline-block' }}>
              Puntaje mínimo aprobatorio: {passingScore}%
            </span>
            <h2 style={{ fontSize: 18, margin: 0 }}>{currentExam.title}</h2>
          </div>
          <span className="badge status-ok">Evaluación Activa</span>
        </div>

        <p style={{ fontSize: 13, color: '#68788d', marginBottom: 20 }}>
          Consta de <strong>{questions.length} preguntas</strong> de selección múltiple. Al aprobar con {passingScore}% o superior, se expide automáticamente el diploma oficial.
        </p>

        {/* Lista de preguntas desplegada */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {questions.map((q, idx) => (
            <div
              key={q.id}
              style={{
                border: '1px solid #eef2f6',
                borderRadius: 12,
                padding: '14px 16px',
                background: '#fbfcfd',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F59DF' }}>
                  {idx + 1}.
                </span>
                <strong style={{ fontSize: 14 }}>{q.text}</strong>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 10 }}>
                {q.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 8,
                      fontSize: 12,
                      background: q.correct === oIdx ? '#ecfdf5' : '#fff',
                      border: q.correct === oIdx ? '1px solid #10b981' : '1px solid #e2e8f0',
                      color: q.correct === oIdx ? '#047857' : '#475569',
                      fontWeight: q.correct === oIdx ? 600 : 400,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <span>{String.fromCharCode(65 + oIdx)})</span>
                    <span>{opt}</span>
                    {q.correct === oIdx && <Icon name="check" size={14} />}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal / Editor de Cuestionario */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(7, 21, 43, 0.45)',
            zIndex: 100,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            className="panel"
            style={{
              width: 'min(760px, 100%)',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#fff',
              borderRadius: 20,
              padding: 28,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, margin: 0 }}>Editor de Evaluación</h3>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="field" style={{ marginBottom: 20 }}>
              <label htmlFor="passingScore">Puntaje mínimo de aprobación (%)</label>
              <input
                id="passingScore"
                type="number"
                value={passingScore}
                onChange={e => setPassingScore(Number(e.target.value))}
                min={50}
                max={100}
                style={{ width: 140 }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {questions.map((q, qIdx) => (
                <div
                  key={q.id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 14,
                    padding: 16,
                    background: '#fcfdfe',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#0F59DF' }}>
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

                  <div className="field">
                    <input
                      value={q.text}
                      onChange={e => updateQuestionText(q.id, e.target.value)}
                      placeholder="Escribe el enunciado de la pregunta..."
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {q.options.map((opt, oIdx) => (
                      <div
                        key={oIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                        }}
                      >
                        <input
                          type="radio"
                          name={`correct_${q.id}`}
                          checked={q.correct === oIdx}
                          onChange={() => updateQuestionCorrect(q.id, oIdx)}
                          title="Marcar como respuesta correcta"
                        />
                        <span style={{ fontSize: 13, fontWeight: 600, width: 22 }}>
                          {String.fromCharCode(65 + oIdx)}
                        </span>
                        <input
                          value={opt}
                          onChange={e => updateQuestionOption(q.id, oIdx, e.target.value)}
                          placeholder={`Opción ${String.fromCharCode(65 + oIdx)}...`}
                          style={{ flex: 1, padding: '7px 10px', fontSize: 13 }}
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
                  Cancelar
                </button>
                <button type="button" className="btn btn-primary" onClick={handleSaveExam}>
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
