'use client';
import { Icon } from '@/lib/icons';

type Props = {
  certificatesCount: number;
  completedLessonsCount: number;
  activeCoursesCount?: number;
  latestCourseTitle?: string;
};

export function StudentRecentActivity({
  certificatesCount,
  completedLessonsCount,
  activeCoursesCount = 0,
  latestCourseTitle,
}: Props) {
  return (
    <aside className="dash-card" aria-label="Actividad reciente del estudiante">
      <div className="dash-card-head">
        <h2>Actividad reciente</h2>
        <div style={{ color: '#0F59DF' }}>
          <Icon name="bell" size={18} />
        </div>
      </div>

      <div className="activity-list">
        {completedLessonsCount > 0 && (
          <div className="activity">
            <span className="activity-dot" style={{ background: '#0F59DF' }}></span>
            <div>
              <strong>Lecciones completadas ({completedLessonsCount})</strong>
              <span>Progreso registrado en el aula virtual</span>
            </div>
          </div>
        )}

        <div className="activity">
          <span className="activity-dot" style={{ background: '#059669' }}></span>
          <div>
            <strong>Sesión activa y sincronizada</strong>
            <span>Conectado a la plataforma EDDIP</span>
          </div>
        </div>

        {certificatesCount > 0 && (
          <div className="activity">
            <span className="activity-dot" style={{ background: '#f59e0b' }}></span>
            <div>
              <strong>{certificatesCount} Certificado(s) disponible(s)</strong>
              <span>Con código QR y verificación pública</span>
            </div>
          </div>
        )}

        {activeCoursesCount > 0 ? (
          <div className="activity">
            <span className="activity-dot" style={{ background: '#6366f1' }}></span>
            <div>
              <strong>{activeCoursesCount === 1 ? 'Curso habilitado' : `Cursos activos (${activeCoursesCount})`}</strong>
              <span>{latestCourseTitle || 'Programas en progreso'}</span>
            </div>
          </div>
        ) : (
          <div className="activity">
            <span className="activity-dot" style={{ background: '#94a3b8' }}></span>
            <div>
              <strong>Sin cursos inscritos</strong>
              <span>Explora el catálogo para comenzar a estudiar</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
