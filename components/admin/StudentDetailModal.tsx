'use client';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import type { EnrichedStudent } from '@/lib/supabase/adminService';

type Props = {
  student: EnrichedStudent;
  onClose: () => void;
};

export function StudentDetailModal({ student, onClose }: Props) {
  const initials = student.name
    .split(' ')
    .filter(Boolean)
    .map(x => x[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7, 21, 43, 0.48)',
        backdropFilter: 'blur(3px)',
        zIndex: 100,
        display: 'grid',
        placeItems: 'center',
        padding: 16,
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        className="panel"
        style={{
          width: 'min(680px, 100%)',
          maxHeight: '90vh',
          overflowY: 'auto',
          background: '#fff',
          borderRadius: 20,
          border: '1px solid var(--line)',
          padding: 28,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>
              Ficha académica del estudiante
            </span>
            <h2 style={{ fontSize: 20, margin: '4px 0 0' }}>Historial y Desempeño</h2>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Cerrar ficha"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Tarjeta de perfil del estudiante */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}
        >
          <div
            className="avatar"
            style={{ width: 56, height: 56, fontSize: 20, borderRadius: 16 }}
          >
            {initials}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 17, margin: 0, fontWeight: 700 }}>{student.name}</h3>
              <span
                className="cover-chip"
                style={{
                  fontSize: 10,
                  background: student.status === 'Completado' ? '#ecfdf5' : '#eef4ff',
                  color: student.status === 'Completado' ? '#059669' : '#0F59DF',
                }}
              >
                {student.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px', marginTop: 6, fontSize: 12, color: '#64748b' }}>
              <span>✉ {student.email}</span>
              <span>🪪 Doc: {student.documentId || 'No registrado'}</span>
              <span>📞 Tel: {student.phone || 'No registrado'}</span>
              <span>📍 {student.city || 'Colombia'}</span>
            </div>
          </div>
        </div>

        {/* Métricas del estudiante */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 24,
            textAlign: 'center',
          }}
        >
          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 12, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Cursos inscritos</span>
            <strong style={{ fontSize: 20, color: '#071F49' }}>{student.coursesCount}</strong>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 12, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Progreso global</span>
            <strong style={{ fontSize: 20, color: '#0F59DF' }}>{student.progressAvg}%</strong>
          </div>

          <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 12, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 11, color: '#64748b', display: 'block' }}>Certificados</span>
            <strong style={{ fontSize: 20, color: '#059669' }}>{student.certificatesCount}</strong>
          </div>
        </div>

        {/* Sección 1: Programas inscritos y avance lección a lección */}
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 12 }}>
            Programas y avance de lecciones
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {student.enrolledCourses.map(course => (
              <div
                key={course.slug}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: 12,
                  padding: '14px',
                  background: '#fff',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ fontSize: 14 }}>{course.title}</strong>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#0F59DF' }}>
                    {course.progress}%
                  </span>
                </div>

                <div className="progress-row" style={{ margin: '0 0 10px' }}>
                  <div className="progress">
                    <span style={{ width: `${course.progress}%` }}></span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#64748b' }}>
                  <span>
                    Lecciones concluidas: {course.completedLessons.length} de {course.totalLessons}
                  </span>

                  {course.certificateCode && (
                    <Link
                      href={`/certificados/${course.certificateCode}`}
                      className="text-link"
                      target="_blank"
                      style={{ fontSize: 12, fontWeight: 600 }}
                    >
                      Ver diploma ({course.certificateCode}) →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sección 2: Exámenes y calificaciones */}
        <div>
          <h4 style={{ fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, color: '#475569', marginBottom: 12 }}>
            Evaluaciones presentadas
          </h4>

          {student.examScores.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {student.examScores.map((exam, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    borderRadius: 10,
                    background: '#f8fafc',
                    border: '1px solid #eef2f6',
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: 13 }}>{exam.courseTitle}</strong>
                    <span style={{ fontSize: 11, color: '#7a8b9e' }}>Fecha: {exam.date}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong style={{ fontSize: 15, color: exam.passed ? '#059669' : '#dc2626' }}>
                      {exam.score}%
                    </strong>
                    <span
                      style={{
                        fontSize: 10,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: exam.passed ? '#ecfdf5' : '#fff1f2',
                        color: exam.passed ? '#059669' : '#dc2626',
                        fontWeight: 700,
                      }}
                    >
                      {exam.passed ? 'APROBADO' : 'REPROBADO'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: '#8899aa', margin: 0 }}>
              El estudiante aún no ha presentado evaluaciones finales.
            </p>
          )}
        </div>

        {/* Footer del modal */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cerrar ficha
          </button>
        </div>
      </div>
    </div>
  );
}
