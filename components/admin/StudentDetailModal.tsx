'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import { adminService, type EnrichedStudent } from '@/lib/supabase/adminService';
import { StudentProfileEditor } from './StudentProfileEditor';
import { StudentCourseAssigner } from './StudentCourseAssigner';

type Props = {
  student: EnrichedStudent;
  onClose: () => void;
};

type PanelMode = 'view' | 'edit' | 'assign';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function StudentDetailModal({ student: initialStudent, onClose }: Props) {
  const [student, setStudent] = useState<EnrichedStudent>(initialStudent);
  const [mode, setMode] = useState<PanelMode>('view');
  const [notice, setNotice] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  // Registrado solo en el directorio del panel: tiene cursos asignados pero aún no puede iniciar sesión
  const hasAccount = UUID_PATTERN.test(student.id);

  const handleActivateAccount = async () => {
    setActivating(true);
    setActivationError(null);
    const result = await adminService.enrollStudentInCourses({
      email: student.email,
      fullName: student.name,
      documentId: student.documentId,
      phone: student.phone,
      city: student.city,
      courseSlugs: student.enrolledCourses.map(c => c.slug),
    });
    setActivating(false);
    if (!result.success) {
      setActivationError(result.error || 'No fue posible crear la cuenta.');
      return;
    }
    setNotice('Cuenta creada y cursos activados. Le enviamos un correo para crear su contraseña.');
  };

  const handleProfileSaved = (changes: Pick<EnrichedStudent, 'name' | 'documentId' | 'phone' | 'city'>) => {
    setStudent(prev => ({ ...prev, ...changes }));
    setMode('view');
    setNotice('Ficha actualizada correctamente.');
  };

  const handleCoursesAssigned = (courses: { slug: string; title: string }[]) => {
    setStudent(prev => {
      const enrolledCourses = [
        ...prev.enrolledCourses,
        ...courses.map(c => ({ slug: c.slug, title: c.title, progress: 0, completedLessons: [], totalLessons: 1 })),
      ];
      return { ...prev, enrolledCourses, coursesCount: enrolledCourses.length, status: 'Activo' };
    });
    setMode('view');
    setNotice(
      courses.length > 1
        ? `${courses.length} cursos asignados. El estudiante ya puede verlos en su panel.`
        : 'Curso asignado. El estudiante ya puede verlo en su panel.'
    );
  };

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
              <span
                className="cover-chip"
                style={{
                  fontSize: 10,
                  background:
                    student.role === 'admin'
                      ? '#ede9fe'
                      : student.role === 'designer'
                      ? '#fef3c7'
                      : '#e0f2fe',
                  color:
                    student.role === 'admin'
                      ? '#6d28d9'
                      : student.role === 'designer'
                      ? '#b45309'
                      : '#0369a1',
                  fontWeight: 700,
                }}
              >
                {student.role === 'admin'
                  ? 'Administrador'
                  : student.role === 'designer'
                  ? 'Diseñador'
                  : 'Estudiante'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 14px', marginTop: 6, fontSize: 12, color: '#64748b' }}>
              <span className="student-meta-item"><Icon name="mail" size={13} /> {student.email}</span>
              <span className="student-meta-item"><Icon name="card" size={13} /> Doc: {student.documentId || 'No registrado'}</span>
              <span className="student-meta-item"><Icon name="phone" size={13} /> Tel: {student.phone || 'No registrado'}</span>
              <span className="student-meta-item"><Icon name="mapPin" size={13} /> {student.city || 'Colombia'}</span>
            </div>
          </div>
        </div>

        {!hasAccount && student.enrolledCourses.length > 0 && !notice && (
          <div className="student-account-alert" role="alert">
            <Icon name="alert" size={18} />
            <div>
              <strong>Esta persona aún no tiene cuenta para ingresar.</strong>
              <p>Sus cursos están registrados en el panel, pero no puede verlos hasta que se cree su cuenta.</p>
              {activationError && <p className="field-error">{activationError}</p>}
              <button type="button" className="btn btn-primary" onClick={handleActivateAccount} disabled={activating}>
                <Icon name="user" size={15} /> {activating ? 'Creando cuenta…' : 'Crear cuenta y activar cursos'}
              </button>
            </div>
          </div>
        )}

        {/* Acciones de la ficha */}
        {mode === 'view' && (
          <div className="student-panel-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setNotice(null); setMode('edit'); }}>
              <Icon name="edit" size={15} /> Editar datos
            </button>
            <button type="button" className="btn btn-primary" onClick={() => { setNotice(null); setMode('assign'); }}>
              <Icon name="plus" size={15} /> Asignar cursos
            </button>
          </div>
        )}

        {notice && (
          <p className="student-panel-notice" role="status">
            <Icon name="check" size={16} /> {notice}
          </p>
        )}

        {mode === 'edit' && (
          <StudentProfileEditor student={student} onSaved={handleProfileSaved} onCancel={() => setMode('view')} />
        )}
        {mode === 'assign' && (
          <StudentCourseAssigner student={student} onAssigned={handleCoursesAssigned} onCancel={() => setMode('view')} />
        )}

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
            <strong style={{ fontSize: 20, color: '#071F49' }}>{student.enrolledCourses.length}</strong>
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
            {student.enrolledCourses.length === 0 && (
              <p style={{ fontSize: 12, color: '#8899aa', margin: 0 }}>
                Aún no tiene cursos asignados. Usa «Asignar cursos» para matricularlo.
              </p>
            )}
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
                    {course.totalLessons > 1
                      ? `Lecciones concluidas: ${course.completedLessons.length} de ${course.totalLessons}`
                      : 'Matrícula activa'}
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
