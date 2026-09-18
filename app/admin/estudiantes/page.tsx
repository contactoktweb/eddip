'use client';
import { useState, useEffect } from 'react';
import { adminService, type EnrichedStudent } from '@/lib/supabase/adminService';
import { StudentDirectory } from '@/components/admin/StudentDirectory';

export default function AdminStudentsPage() {
  const [studentList, setStudentList] = useState<EnrichedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudents() {
      try {
        const list = await adminService.getAllStudents();
        setStudentList(list);
      } catch (err) {
        console.warn('Error loading students:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  return (
    <div className="dash-page">
      <header className="dash-head">
        <div>
          <span className="eyebrow">Control de Usuarios</span>
          <h1 style={{ fontSize: 30, marginBottom: 6 }}>Directorio de estudiantes</h1>
          <p style={{ color: '#5b6c81', margin: 0 }}>
            Consulta la lista consolidada de participantes, supervisa su avance por curso y revisa diplomas.
          </p>
        </div>
      </header>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
          Cargando registro de estudiantes...
        </div>
      ) : (
        <StudentDirectory students={studentList} />
      )}
    </div>
  );
}
