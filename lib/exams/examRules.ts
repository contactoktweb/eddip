import type { Exam, ExamQuestion, Module } from '@/lib/types';

/** Pregunta tal como la recibe el estudiante: sin la respuesta correcta. */
export type PublicExamQuestion = Omit<ExamQuestion, 'correct'>;
export type PublicExam = Omit<Exam, 'questions'> & { questions: PublicExamQuestion[] };

export type ExamAnswers = Record<string, number>;

export type ExamGrade = { correct: number; total: number; score: number; passed: boolean };

export const DEFAULT_PASSING_SCORE = 75;

export function toPublicExam(exam: Exam): PublicExam {
  return {
    courseSlug: exam.courseSlug,
    title: exam.title,
    passingScore: exam.passingScore,
    questions: exam.questions.map(({ id, text, options }) => ({ id, text, options })),
  };
}

export function gradeExam(exam: Exam, answers: ExamAnswers): ExamGrade {
  const total = Math.max(1, exam.questions.length);
  const correct = exam.questions.filter(q => answers[q.id] === q.correct).length;
  const score = Math.round((correct / total) * 100);
  return { correct, total, score, passed: score >= exam.passingScore };
}

export function isUsableExam(value: unknown): value is Exam {
  if (!value || typeof value !== 'object') return false;
  const exam = value as Partial<Exam>;
  return (
    typeof exam.courseSlug === 'string' &&
    Array.isArray(exam.questions) &&
    exam.questions.length > 0 &&
    exam.questions.every(
      q => q && typeof q.id === 'string' && Array.isArray(q.options) && Number.isInteger(q.correct)
    )
  );
}

/** Evaluación doctrinal por defecto para cursos que aún no tienen una configurada en administración. */
export function buildDefaultExam(course: { slug: string; title: string; modules?: Module[] }): Exam {
  const { slug } = course;
  const modules = course.modules || [];
  const questions: ExamQuestion[] =
    modules.length > 0
      ? modules.flatMap((m, mIdx) => [
          {
            id: `q_${slug}_${mIdx}_1`,
            text: `En el marco de ${m.title}, ¿cuál es el principio orientador prioritario para la correcta actuación del servidor o profesional?`,
            options: [
              `Garantizar el estricto apego al orden legal, la proporcionalidad y la debida fundamentación`,
              `Proceder sin registro documental ni motivación jurídica`,
              `Omitir el debido proceso en favor de la inmediatez`,
              `Delegar las facultades normativas a particulares sin competencia`,
            ],
            correct: 0,
          },
          {
            id: `q_${slug}_${mIdx}_2`,
            text: `¿Qué garantía institucional asegura la correcta ejecución de los protocolos revisados en ${m.title}?`,
            options: [
              `Reducir la transparencia en la rendición de cuentas`,
              `Asegurar trazabilidad institucional, legalidad formal y validez probatoria`,
              `Eximir de responsabilidad disciplinaria a los intervinientes`,
              `Limitar el acceso a la defensa de las partes interesadas`,
            ],
            correct: 1,
          },
        ])
      : [
          {
            id: `q_${slug}_1`,
            text: `¿Cuál es el principio orientador en este programa de formación institucional?`,
            options: [
              'Asegurar el cumplimiento estricto del orden legal, constitucional y los derechos ciudadanos',
              'Proceder discrecionalmente sin fundamentación legal',
              'Omitir la trazabilidad documental de los procedimientos',
              'Actuar al margen de los protocolos institucionales vigentes',
            ],
            correct: 0,
          },
          {
            id: `q_${slug}_2`,
            text: `¿Qué finalidad primordial persigue la correcta fundamentación de las decisiones operativas y jurídicas?`,
            options: [
              'Eliminar la supervisión de las autoridades de control',
              'Brindar certeza, apego a derecho y legitimidad pública a la actuación institucional',
              'Acelerar trámites suprimiendo los términos legales del procedimiento',
              'Restringir la publicidad de los actos oficiales',
            ],
            correct: 1,
          },
        ];

  return {
    courseSlug: slug,
    title: `Evaluación de Certificación — ${course.title}`,
    passingScore: DEFAULT_PASSING_SCORE,
    questions,
  };
}
