'use client';
import Link from 'next/link';
import type { Student } from '@/lib/types';
import { Icon } from '@/lib/icons';

type Props = {
  students: Student[];
  onSelectStudent?: (student: Student) => void;
};

export function AdminRecentStudents({ students, onSelectStudent }: Props) {
  return (
    <section className="dash-card" style={{ marginTop: 20 }} aria-label="Estudiantes recientes">
      <div className="dash-card-head">
        <h2>Últimos estudiantes inscritos</h2>
        <Link className="text-link" href="/admin/estudiantes">
          Ver directorio completo ({students.length})
        </Link>
      </div>

      <div className="table-wrap" style={{ border: 0 }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Estudiante</th>
              <th>Correo institucional</th>
              <th>Cursos</th>
              <th>Progreso</th>
              <th>Fecha de registro</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {students.slice(0, 5).map(s => (
              <tr key={s.id}>
                <td className="table-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      className="avatar"
                      style={{ width: 28, height: 28, fontSize: 11, borderRadius: 8 }}
                    >
                      {s.name.split(' ').map(x => x[0]).slice(0, 2).join('')}
                    </div>
                    <span>{s.name}</span>
                  </div>
                </td>
                <td>{s.email}</td>
                <td>
                  <span className="badge">{s.courses} cursos</span>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="progress" style={{ width: 80 }}>
                      <span style={{ width: `${s.progress}%` }}></span>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600 }}>{s.progress}%</span>
                  </div>
                </td>
                <td>{s.registeredAt}</td>
                <td>
                  {onSelectStudent ? (
                    <button
                      type="button"
                      className="btn btn-soft"
                      onClick={() => onSelectStudent(s)}
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      Ficha
                    </button>
                  ) : (
                    <Link
                      href="/admin/estudiantes"
                      className="btn btn-soft"
                      style={{ fontSize: 12, padding: '4px 10px' }}
                    >
                      <Icon name="search" size={12} /> Ver
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
