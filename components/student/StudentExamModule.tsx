'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { Icon } from '@/lib/icons';
import type { Exam, Course } from '@/lib/types';
import { useDemo } from '@/app/providers';

type Props = {
  exam: Exam;
  course: Course;
};

export function StudentExamModule({ exam, course }: Props) {
  const { saveResult } = useDemo();

  const [hasStarted, setHasStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    correct: number;
    total: number;
    code?: string;
  } | null>(null);

  const currentQ = exam.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  const handleStart = () => {
    setHasStarted(true);
    setCurrentIndex(0);
    setAnswers({});
    setResult(null);
  };

  const handleFinish = async () => {
    const total = exam.questions.length;
    const correct = exam.questions.filter(q => answers[q.id] === q.correct).length;
    const score = Math.round((correct / total) * 100);
    const passed = score >= exam.passingScore;

    const certCode = passed ? `EDDIP-2026-${Math.floor(100000 + Math.random() * 900000)}` : undefined;

    const r = { score, passed, correct, total, code: certCode };
    setResult(r);

    await saveResult(course.slug, {
      score,
      passed,
      correct,
      total,
      code: certCode,
    });
  };

  // 1. Pantalla previa al examen
  if (!hasStarted && !result) {
    return (
      <div className="exam-shell">
        <div className="exam-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <Link className="text-link" href={`/dashboard/cursos`}>
            ← Volver a mis cursos
          </Link>
        </div>

        <div className="exam-card" style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', padding: '36px 28px' }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: 16,
              background: '#eef4ff',
              color: '#0F59DF',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 18px',
            }}
          >
            <Icon name="award" size={32} />
          </div>

          <span className="eyebrow">Evaluación de certificación</span>
          <h1 style={{ fontSize: 26, marginBottom: 10 }}>{exam.title}</h1>
          <p style={{ color: '#5b6c81', fontSize: 14, maxWidth: 480, margin: '0 auto 24px', lineHeight: 1.5 }}>
            Curso: <strong>{course.title}</strong>. Esta prueba evalúa los conocimientos normativos, doctrinarios y prácticos vistos en el programa.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 12,
              background: '#f8fafc',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 28,
              textAlign: 'center',
            }}
          >
            <div>
              <strong style={{ display: 'block', fontSize: 18, color: '#071F49' }}>
                {exam.questions.length}
              </strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>Preguntas</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 18, color: '#0F59DF' }}>
                {exam.passingScore}%
              </strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>Aprobatorio</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: 18, color: '#059669' }}>
                Inmediato
              </strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>Certificado</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Link className="btn btn-outline" href={`/aprender/${course.slug}/${course.modules[0]?.lessons[0]?.id}`}>
              Repasar lecciones
            </Link>
            <button type="button" className="btn btn-primary" onClick={handleStart} style={{ padding: '12px 24px' }}>
              Iniciar evaluación ahora <Icon name="arrow" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Pantalla de resultado final
  if (result) {
    return (
      <div className="exam-shell">
        <div className="exam-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Logo />
          <Link className="text-link" href="/dashboard">
            Ir a mi dashboard
          </Link>
        </div>

        <div className="exam-card result-card" style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: '36px 28px' }}>
          <div
            className="success-icon"
            style={{
              background: result.passed ? '#ecfdf5' : '#fff1f2',
              color: result.passed ? '#059669' : '#dc2626',
              margin: '0 auto 16px',
            }}
          >
            <Icon name={result.passed ? 'check' : 'close'} size={36} />
          </div>

          <span className="eyebrow">{result.passed ? '¡Felicitaciones!' : 'Resultado de evaluación'}</span>
          <h1 style={{ fontSize: 28, marginBottom: 8 }}>
            {result.passed ? 'Has aprobado la evaluación' : 'No alcanzaste el puntaje mínimo'}
          </h1>

          <div className="result-score" style={{ color: result.passed ? '#0F59DF' : '#dc2626' }}>
            {result.score}%
          </div>

          <div
            className={result.passed ? 'result-pass' : 'result-fail'}
            style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}
          >
            {result.passed ? 'APROBADO' : 'NO APROBADO'}
          </div>

          <p style={{ color: '#5b6c81', fontSize: 14, margin: '18px auto 24px', maxWidth: 440 }}>
            {result.passed
              ? `Has superado con éxito el examen de ${course.title}. Tu certificado oficial con validación criptográfica ya ha sido generado y registrado.`
              : `Se requiere un mínimo de ${exam.passingScore}% para certificar este programa. Puedes revisar las lecciones e intentarlo nuevamente sin costo.`}
          </p>

          <div className="result-stats" style={{ marginBottom: 28 }}>
            <div>
              <strong>{result.correct}</strong>
              <span>Correctas</span>
            </div>
            <div>
              <strong>{result.total - result.correct}</strong>
              <span>Incorrectas</span>
            </div>
            <div>
              <strong>{exam.passingScore}%</strong>
              <span>Requerido</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            {result.passed ? (
              <>
                <Link
                  className="btn btn-primary"
                  href={result.code ? `/certificados/${result.code}` : '/dashboard/certificados'}
                  style={{ padding: '12px 24px' }}
                >
                  <Icon name="award" /> Ver mi certificado oficial
                </Link>
                <Link className="btn btn-outline" href="/dashboard/cursos">
                  Volver a mis cursos
                </Link>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStart}
                  style={{ padding: '12px 24px' }}
                >
                  Reintentar evaluación
                </button>
                <Link className="btn btn-outline" href={`/aprender/${course.slug}/${course.modules[0]?.lessons[0]?.id}`}>
                  Repasar curso
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Pantalla de preguntas paso a paso
  const progressPct = Math.round(((currentIndex + 1) / exam.questions.length) * 100);
  const isSelected = answers[currentQ.id] !== undefined;

  return (
    <div className="exam-shell">
      <div className="exam-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <Link className="text-link" href="/dashboard/cursos">
          Salir de la prueba
        </Link>
      </div>

      <div className="exam-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span className="question-number" style={{ fontSize: 13, fontWeight: 600, color: '#0F59DF' }}>
            Pregunta {currentIndex + 1} de {exam.questions.length}
          </span>
          <span style={{ fontSize: 12, color: '#7a8b9e' }}>
            Respondidas: {answeredCount}/{exam.questions.length}
          </span>
        </div>

        <div className="exam-progress" style={{ marginBottom: 24 }}>
          <span style={{ width: `${progressPct}%` }}></span>
        </div>

        <h1 style={{ fontSize: 20, lineHeight: 1.4, marginBottom: 24 }}>{currentQ.text}</h1>

        <div className="options" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {currentQ.options.map((optionText, idx) => {
            const selected = answers[currentQ.id] === idx;
            return (
              <button
                type="button"
                key={idx}
                className={`option ${selected ? 'selected' : ''}`}
                onClick={() => setAnswers(prev => ({ ...prev, [currentQ.id]: idx }))}
                style={{
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderRadius: 12,
                }}
              >
                <span className="option-letter" style={{ flexShrink: 0 }}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span style={{ fontSize: 14, lineHeight: 1.4, flex: 1 }}>{optionText}</span>
              </button>
            );
          })}
        </div>

        {/* Barra de navegación de preguntas */}
        <div className="exam-nav" style={{ marginTop: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex(v => Math.max(0, v - 1))}
          >
            ← Anterior
          </button>

          {currentIndex < exam.questions.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              disabled={!isSelected}
              onClick={() => setCurrentIndex(v => v + 1)}
            >
              Siguiente <Icon name="arrow" />
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary"
              disabled={answeredCount < exam.questions.length}
              onClick={handleFinish}
              style={{
                background: 'linear-gradient(135deg, #059669, #047857)',
                borderColor: '#047857',
              }}
            >
              Finalizar evaluación <Icon name="check" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
