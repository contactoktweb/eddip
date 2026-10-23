'use client';
import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { useDemo } from '@/app/providers';
import { adminService, type EnrichedStudent } from '@/lib/supabase/adminService';
import { MANUAL_PAYMENT_METHODS } from '@/lib/admin/paymentMethods';
import { CourseMultiSelect } from './CourseMultiSelect';

type Props = {
  student: EnrichedStudent;
  onAssigned: (courses: { slug: string; title: string }[]) => void;
  onCancel: () => void;
};

export function StudentCourseAssigner({ student, onAssigned, onCancel }: Props) {
  const { courses } = useDemo();
  const [selected, setSelected] = useState<string[]>([]);
  const [registerSale, setRegisterSale] = useState(true);
  const [method, setMethod] = useState<string>(MANUAL_PAYMENT_METHODS[3].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const owned = student.enrolledCourses.map(c => c.slug);
  const chosen = courses.filter(c => selected.includes(c.slug));
  const total = chosen.reduce((sum, c) => sum + (c.price || 0), 0);

  const handleSubmit = async () => {
    if (selected.length === 0) {
      setError('Selecciona al menos un curso.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await adminService.enrollStudentInCourses({
      email: student.email,
      fullName: student.name,
      documentId: student.documentId,
      phone: student.phone,
      city: student.city,
      courseSlugs: selected,
      sale: registerSale
        ? { method, values: Object.fromEntries(chosen.map(c => [c.slug, c.price || 0])) }
        : undefined,
    });
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'No fue posible asignar los cursos.');
      return;
    }
    onAssigned(chosen.map(c => ({ slug: c.slug, title: c.title })));
  };

  return (
    <div className="student-panel-form ui-fade-up">
      <fieldset className="admin-fieldset" disabled={saving}>
        <legend>Asignar cursos</legend>
        <CourseMultiSelect
          courses={courses}
          selected={selected}
          onChange={setSelected}
          disabledSlugs={owned}
          idPrefix={`assign-${student.id}`}
        />

        <label className="auth-checkbox-label" style={{ margin: '14px 0 10px' }}>
          <input
            type="checkbox"
            className="auth-checkbox"
            checked={registerSale}
            onChange={e => setRegisterSale(e.target.checked)}
          />
          <span>Registrar la venta y enviar el comprobante al estudiante</span>
        </label>

        {registerSale && (
          <div className="field">
            <label htmlFor={`assign-method-${student.id}`}>Medio de pago</label>
            <select id={`assign-method-${student.id}`} value={method} onChange={e => setMethod(e.target.value)}>
              {MANUAL_PAYMENT_METHODS.map(m => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
            {chosen.length > 0 && (
              <small className="field-hint">
                {chosen.length} {chosen.length === 1 ? 'venta' : 'ventas'} por un total de{' '}
                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(total)}.
              </small>
            )}
          </div>
        )}
      </fieldset>

      {error && (
        <p className="form-submit-error" role="alert">
          <Icon name="alert" size={16} /> {error}
        </p>
      )}

      <div className="admin-modal-actions">
        <button type="button" className="btn btn-outline" onClick={onCancel} disabled={saving}>
          Cancelar
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={saving || selected.length === 0}>
          <Icon name="plus" size={16} />
          {saving ? 'Asignando…' : selected.length > 1 ? `Asignar ${selected.length} cursos` : 'Asignar curso'}
        </button>
      </div>
    </div>
  );
}
