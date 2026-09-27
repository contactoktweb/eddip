'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@/lib/icons';
import { adminService, type EnrichedStudent } from '@/lib/supabase/adminService';
import { contentService } from '@/lib/supabase/contentService';
import type { Course } from '@/lib/types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onStudentAdded?: (student: EnrichedStudent) => void;
};

export function AddStudentModal({ isOpen, onClose, onStudentAdded }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [selectedCourseSlug, setSelectedCourseSlug] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      contentService.getCourses().then(setCourses).catch(() => {});
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDoc = documentId.trim();

    if (!cleanName) {
      setErrorMsg('Por favor ingresa los nombres y apellidos del estudiante.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (!cleanDoc) {
      setErrorMsg('El número de documento de identidad (cédula) es obligatorio.');
      return;
    }

    setLoading(true);

    try {
      // 1. Validar duplicidad antes de registrar
      const dupCheck = await adminService.isStudentDuplicate(cleanEmail, cleanDoc);
      if (dupCheck.isDuplicate) {
        setErrorMsg(dupCheck.message || 'Ya existe un estudiante registrado con este correo o documento.');
        setLoading(false);
        return;
      }

      // 2. Preparar curso inicial si fue seleccionado
      const enrolledCourses: EnrichedStudent['enrolledCourses'] = [];
      if (selectedCourseSlug) {
        const foundCourse = courses.find(c => c.slug === selectedCourseSlug);
        if (foundCourse) {
          enrolledCourses.push({
            slug: foundCourse.slug,
            title: foundCourse.title,
            progress: 0,
            completedLessons: [],
            totalLessons: foundCourse.modules.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 1,
          });
        }
      }

      // 3. Guardar en la base de datos Supabase
      const res = await adminService.saveStudent({
        name: cleanName,
        email: cleanEmail,
        documentId: cleanDoc,
        phone: phone.trim() || undefined,
        city: city.trim() || 'Colombia',
        coursesCount: enrolledCourses.length,
        progressAvg: 0,
        certificatesCount: 0,
        registeredAt: new Date().toISOString().slice(0, 10),
        status: 'Activo',
        enrolledCourses,
        examScores: [],
      });

      if (!res.success) {
        setErrorMsg(res.error || 'No se pudo guardar el estudiante en la base de datos.');
        setLoading(false);
        return;
      }

      setSuccessMsg('¡Estudiante registrado correctamente en la base de datos de EDDIP!');

      if (res.student && onStudentAdded) {
        onStudentAdded(res.student);
      }

      setTimeout(() => {
        // Limpiar campos
        setFullName('');
        setDocumentId('');
        setEmail('');
        setPhone('');
        setCity('');
        setSelectedCourseSlug('');
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al registrar estudiante';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(7, 21, 43, 0.55)',
        backdropFilter: 'blur(4px)',
        zIndex: 110,
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
          width: 'min(580px, 100%)',
          maxHeight: '92vh',
          overflowY: 'auto',
          background: '#ffffff',
          borderRadius: 20,
          border: '1px solid var(--line)',
          padding: 28,
          boxShadow: '0 20px 45px -12px rgba(11, 44, 87, 0.25)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Cabecera */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>
              Gestión de Estudiantes
            </span>
            <h2 style={{ fontSize: 20, margin: '4px 0 0', color: '#071F49' }}>Registrar Nuevo Estudiante</h2>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              Almacena el registro oficial en la base de datos de Supabase sin duplicidades.
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Cerrar modal"
            style={{ width: 36, height: 36 }}
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {/* Mensajes de Alerta */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
            role="alert"
          >
            <Icon name="close" size={16} />
            <div style={{ flex: 1 }}>{errorMsg}</div>
          </div>
        )}

        {successMsg && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: 12,
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              color: '#059669',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
            role="status"
          >
            <Icon name="check" size={16} />
            <div style={{ flex: 1, fontWeight: 500 }}>{successMsg}</div>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Nombre */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Nombres y Apellidos Completos *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Ej. Andrés Camilo Morales Ruiz"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          {/* Cédula y Teléfono en dos columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Cédula o Documento de Identidad *
              </label>
              <input
                type="text"
                required
                value={documentId}
                onChange={e => setDocumentId(e.target.value)}
                placeholder="Ej. 1.098.765.432"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Teléfono / WhatsApp
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="Ej. 310 456 7890"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Correo y Ciudad */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Correo Electrónico *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="estudiante@correo.com"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
                Ciudad / Municipio
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ej. Bogotá D.C."
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Curso a matricular */}
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 6 }}>
              Matrícula Inicial en Programa (Opcional)
            </label>
            <select
              value={selectedCourseSlug}
              onChange={e => setSelectedCourseSlug(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid var(--line)',
                fontSize: 13,
                outline: 'none',
                background: '#fff',
              }}
            >
              <option value="">-- Sin matrícula inicial (0 cursos) --</option>
              {courses.map(c => (
                <option key={c.slug} value={c.slug}>
                  {c.title}
                </option>
              ))}
            </select>
            <small style={{ color: '#64748b', fontSize: 11, marginTop: 4, display: 'block' }}>
              Puedes inscribir al estudiante en un curso desde el momento de su registro.
            </small>
          </div>

          {/* Acciones */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '9px 18px', fontSize: 13 }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                padding: '9px 20px',
                fontSize: 13,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {loading ? (
                <>Guardando en base de datos...</>
              ) : (
                <>
                  <Icon name="check" size={16} /> Registrar estudiante
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
