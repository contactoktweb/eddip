'use client';
import { useEffect, useMemo, useState } from 'react';
import type { Certificate, Course } from '@/lib/types';
import { Icon } from '@/lib/icons';
import CustomSelect from '@/components/CustomSelect';
import { COLOMBIA_DEPARTMENTS } from '@/lib/colombiaPlaces';
import { adminService } from '@/lib/supabase/adminService';
import { isValidEmail } from '@/lib/siteSettings';

type Props = {
  courses: Course[];
  onClose: () => void;
  onIssued: (certificate: Certificate) => void;
};

type FormState = {
  fullName: string;
  documentId: string;
  email: string;
  phone: string;
  department: string;
  city: string;
  courseSlug: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const MIN_DOCUMENT_DIGITS = 5;
const MIN_PHONE_DIGITS = 10;

const emptyForm = (courseSlug: string): FormState => ({
  fullName: '',
  documentId: '',
  email: '',
  phone: '',
  department: '',
  city: '',
  courseSlug,
});

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (form.fullName.trim().split(/\s+/).length < 2) errors.fullName = 'Escribe nombres y apellidos completos.';
  if (form.documentId.replace(/\D/g, '').length < MIN_DOCUMENT_DIGITS) errors.documentId = 'Ingresa un número de cédula válido.';
  if (!isValidEmail(form.email)) errors.email = 'Ingresa un correo electrónico válido.';
  if (form.phone.replace(/\D/g, '').length < MIN_PHONE_DIGITS) errors.phone = 'Ingresa un número de celular de 10 dígitos.';
  if (!form.department) errors.department = 'Selecciona el departamento.';
  if (!form.city) errors.city = 'Selecciona la ciudad o municipio.';
  if (!form.courseSlug) errors.courseSlug = 'Selecciona el programa a certificar.';
  return errors;
}

export function ManualCertificateForm({ courses, onClose, onIssued }: Props) {
  const [form, setForm] = useState<FormState>(() => emptyForm(courses[0]?.slug || ''));
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === 'Escape' && !saving && onClose();
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, saving]);

  const departmentOptions = useMemo(() => COLOMBIA_DEPARTMENTS.map(d => d.name), []);
  const cityOptions = useMemo(
    () => COLOMBIA_DEPARTMENTS.find(d => d.name === form.department)?.cities || [],
    [form.department]
  );
  const selectedCourse = courses.find(c => c.slug === form.courseSlug);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value, ...(field === 'department' ? { city: '' } : {}) }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0 || !selectedCourse) return;

    setSaving(true);
    setSubmitError(null);
    const result = await adminService.registerManualCertificate({
      fullName: form.fullName,
      documentId: form.documentId,
      email: form.email,
      phone: form.phone,
      department: form.department,
      city: form.city,
      courseSlug: selectedCourse.slug,
      courseTitle: selectedCourse.title,
      hours: selectedCourse.durationHours,
    });
    setSaving(false);

    if (result.success && result.certificate) {
      onIssued(result.certificate);
    } else {
      setSubmitError(result.error || 'No fue posible emitir el certificado.');
    }
  };

  const fieldError = (field: keyof FormState) =>
    errors[field] ? (
      <span className="field-error" id={`manual-${field}-error`}>
        {errors[field]}
      </span>
    ) : null;

  return (
    <div className="admin-modal-backdrop" onClick={() => !saving && onClose()}>
      <div
        className="admin-modal ui-fade-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manual-cert-title"
        onClick={e => e.stopPropagation()}
      >
        <div className="admin-modal-head">
          <div>
            <span className="eyebrow" style={{ margin: 0 }}>Expedición manual</span>
            <h2 id="manual-cert-title">Inscripción para certificado</h2>
            <p>El nombre y la cédula aparecerán en el diploma. Los demás datos quedan registrados en la base de datos.</p>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar formulario" disabled={saving}>
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className="admin-fieldset" disabled={saving}>
            <legend>Datos que aparecen en el certificado</legend>
            <div className="form-row">
              <div className="field">
                <label htmlFor="manual-fullName">Nombre completo *</label>
                <input
                  id="manual-fullName"
                  value={form.fullName}
                  onChange={e => update('fullName', e.target.value)}
                  placeholder="Ej. Andrés Felipe Gómez Rodríguez"
                  autoComplete="name"
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'manual-fullName-error' : undefined}
                />
                {fieldError('fullName')}
              </div>
              <div className="field">
                <label htmlFor="manual-documentId">Número de cédula *</label>
                <input
                  id="manual-documentId"
                  inputMode="numeric"
                  value={form.documentId}
                  onChange={e => update('documentId', e.target.value)}
                  placeholder="Ej. 1032456789"
                  aria-invalid={Boolean(errors.documentId)}
                  aria-describedby={errors.documentId ? 'manual-documentId-error' : undefined}
                />
                {fieldError('documentId')}
              </div>
            </div>

            <div className="field">
              <label htmlFor="manual-course">Programa a certificar *</label>
              <select
                id="manual-course"
                value={form.courseSlug}
                onChange={e => update('courseSlug', e.target.value)}
                aria-invalid={Boolean(errors.courseSlug)}
              >
                {courses.map(c => (
                  <option key={c.id} value={c.slug}>
                    {c.title} ({c.durationHours} h)
                  </option>
                ))}
              </select>
              {fieldError('courseSlug')}
            </div>
          </fieldset>

          <fieldset className="admin-fieldset" disabled={saving}>
            <legend>Datos generales de contacto</legend>
            <div className="form-row">
              <div className="field">
                <label htmlFor="manual-email">Correo electrónico *</label>
                <input
                  id="manual-email"
                  type="email"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'manual-email-error' : undefined}
                />
                {fieldError('email')}
              </div>
              <div className="field">
                <label htmlFor="manual-phone">Celular *</label>
                <input
                  id="manual-phone"
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                  placeholder="Ej. 3001234567"
                  autoComplete="tel"
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'manual-phone-error' : undefined}
                />
                {fieldError('phone')}
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <CustomSelect
                  id="manual-department"
                  label="Departamento *"
                  value={form.department}
                  onChange={value => update('department', value)}
                  options={departmentOptions}
                  placeholder="Seleccionar departamento..."
                  error={errors.department}
                />
              </div>
              <div className="field">
                <CustomSelect
                  id="manual-city"
                  label="Ciudad o municipio *"
                  value={form.city}
                  onChange={value => update('city', value)}
                  options={cityOptions}
                  placeholder={form.department ? 'Seleccionar ciudad...' : 'Primero selecciona un departamento'}
                  disabled={!form.department}
                  disabledMessage="Primero selecciona un departamento"
                  error={errors.city}
                />
              </div>
            </div>
          </fieldset>

          {submitError && (
            <p className="form-submit-error" role="alert">
              <Icon name="alert" size={16} /> {submitError}
            </p>
          )}

          <div className="admin-modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <Icon name="award" size={16} />
              {saving ? 'Registrando y emitiendo…' : 'Registrar y emitir certificado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
