'use client';
import { useState } from 'react';
import { useDemo } from '@/app/providers';
import { studentService } from '@/lib/supabase/studentService';
import { Icon } from '@/lib/icons';

export function StudentProfileManager() {
  const { user, updateProfile, certs, courses, purchased } = useDemo();

  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'history'>('info');

  // Form states
  const [fullName, setFullName] = useState(user.name || '');
  const [documentId, setDocumentId] = useState(user.documentId || '1.032.456.789');
  const [phone, setPhone] = useState(user.phone || '300 555 0182');
  const [city, setCity] = useState(user.city || 'Bogotá D.C.');

  // Password states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status feedback
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await updateProfile({
        fullName,
        documentId,
        phone,
        city,
      });

      if (success) {
        showToast('success', '¡Perfil actualizado con éxito!');
      } else {
        showToast('error', 'No se pudo actualizar el perfil.');
      }
    } catch {
      showToast('error', 'Error inesperado al guardar datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      const res = await studentService.updatePassword(newPassword);
      if (res.success) {
        showToast('success', '¡Contraseña actualizada con éxito!');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showToast('error', res.error || 'Error al actualizar contraseña.');
      }
    } catch {
      showToast('error', 'Error de conexión con el servicio de autenticación.');
    } finally {
      setLoading(false);
    }
  };

  const ownedCourses = courses.filter(c => purchased.includes(c.slug));
  const totalHours = ownedCourses.reduce((acc, c) => acc + c.durationHours, 0);

  return (
    <div style={{ maxWidth: 860 }}>
      {/* Toast notificador */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 12,
            background: toast.type === 'success' ? '#ecfdf5' : '#fff1f2',
            color: toast.type === 'success' ? '#059669' : '#dc2626',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            animation: 'fadeIn .25s ease',
          }}
        >
          <Icon name={toast.type === 'success' ? 'check' : 'close'} size={18} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Tabs superiores */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 24,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 12,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          className={`btn ${activeTab === 'info' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('info')}
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <Icon name="user" /> Datos personales
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('security')}
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <Icon name="lock" /> Seguridad y contraseña
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('history')}
          style={{ padding: '8px 16px', fontSize: 13 }}
        >
          <Icon name="award" /> Resumen académico
        </button>
      </div>

      {/* Tab 1: Datos personales */}
      {activeTab === 'info' && (
        <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div
              className="avatar"
              style={{ width: 54, height: 54, fontSize: 20, borderRadius: 16 }}
            >
              {fullName.slice(0, 2).toUpperCase() || 'ES'}
            </div>
            <div>
              <h2 style={{ fontSize: 18, margin: '0 0 2px' }}>{fullName || 'Estudiante'}</h2>
              <span style={{ fontSize: 13, color: '#68788d' }}>{user.email}</span>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label htmlFor="fullName">Nombre completo</label>
                <input
                  id="fullName"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="docId">Número de documento (Cédula)</label>
                <input
                  id="docId"
                  value={documentId}
                  onChange={e => setDocumentId(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  value={user.email}
                  disabled
                  style={{ background: '#f8fafc', cursor: 'not-allowed' }}
                />
                <span style={{ fontSize: 11, color: '#8b9bb4', marginTop: 4 }}>
                  El correo está vinculado a tu cuenta institucional y no puede modificarse.
                </span>
              </div>
              <div className="field">
                <label htmlFor="phone">Teléfono / WhatsApp</label>
                <input
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="city">Ciudad de residencia</label>
              <input
                id="city"
                value={city}
                onChange={e => setCity(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
                style={{ padding: '10px 22px' }}
              >
                {loading ? 'Guardando...' : 'Guardar cambios'}
              </button>

              <span style={{ fontSize: 12, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="check" size={14} /> Sincronización activa
              </span>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Seguridad y contraseña */}
      {activeTab === 'security' && (
        <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>Actualizar contraseña</h2>
          <p style={{ fontSize: 13, color: '#68788d', marginBottom: 20 }}>
            Cambia la contraseña de acceso a tu cuenta en la plataforma educativa EDDIP.
          </p>

          <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label htmlFor="newPass">Nueva contraseña (mínimo 6 caracteres)</label>
              <input
                id="newPass"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="confirmPass">Confirmar nueva contraseña</label>
              <input
                id="confirmPass"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ alignSelf: 'flex-start', padding: '10px 22px', marginTop: 6 }}
            >
              {loading ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </div>
      )}

      {/* Tab 3: Resumen académico */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
            }}
          >
            <div className="stat-card">
              <div className="stat-icon">
                <Icon name="book" size={22} />
              </div>
              <div>
                <span>Cursos matriculados</span>
                <strong>{ownedCourses.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Icon name="clock" size={22} />
              </div>
              <div>
                <span>Horas de formación</span>
                <strong>{totalHours} h</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <Icon name="award" size={22} />
              </div>
              <div>
                <span>Certificados activos</span>
                <strong>{certs.length}</strong>
              </div>
            </div>
          </div>

          <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 24 }}>
            <h2 style={{ fontSize: 17, marginBottom: 14 }}>Programas inscritos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {ownedCourses.map(c => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #f0f4f9',
                    background: '#fbfcfd',
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: 14 }}>{c.title}</strong>
                    <span style={{ fontSize: 12, color: '#68788d' }}>
                      {c.category} · {c.durationHours} horas
                    </span>
                  </div>
                  <span className="cover-chip" style={{ fontSize: 11 }}>
                    Habilitado
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
