'use client';
import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { adminService, type EnrichedStudent } from '@/lib/supabase/adminService';

type Props = {
  student: EnrichedStudent;
  onSaved: (changes: Pick<EnrichedStudent, 'name' | 'documentId' | 'phone' | 'city'>) => void;
  onCancel: () => void;
};

export function StudentProfileEditor({ student, onSaved, onCancel }: Props) {
  const [form, setForm] = useState({
    fullName: student.name,
    documentId: student.documentId || '',
    phone: student.phone || '',
    city: student.city || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: keyof typeof form, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      setError('El nombre completo es obligatorio.');
      return;
    }
    setSaving(true);
    setError(null);
    const result = await adminService.updateStudentProfile(student.id, form);
    setSaving(false);
    if (!result.success) {
      setError(result.error || 'No fue posible actualizar la ficha.');
      return;
    }
    onSaved({ name: form.fullName.trim(), documentId: form.documentId.trim(), phone: form.phone.trim(), city: form.city.trim() });
  };

  return (
    <form className="student-panel-form ui-fade-up" onSubmit={handleSubmit} noValidate>
      <fieldset className="admin-fieldset" disabled={saving}>
        <legend>Datos del estudiante</legend>
        <div className="form-row">
          <div className="field">
            <label htmlFor="edit-fullName">Nombre completo *</label>
            <input id="edit-fullName" value={form.fullName} onChange={e => update('fullName', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-documentId">Cédula</label>
            <input
              id="edit-documentId"
              inputMode="numeric"
              value={form.documentId}
              onChange={e => update('documentId', e.target.value)}
            />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label htmlFor="edit-phone">Celular</label>
            <input id="edit-phone" type="tel" value={form.phone} onChange={e => update('phone', e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-city">Ciudad</label>
            <input id="edit-city" value={form.city} onChange={e => update('city', e.target.value)} />
          </div>
        </div>
        <p className="field-hint" style={{ marginTop: -6 }}>
          El correo ({student.email}) identifica la cuenta y no se puede cambiar desde aquí.
        </p>
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
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Icon name="check" size={16} />
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}
