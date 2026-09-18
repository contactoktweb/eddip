'use client';
import { useState } from 'react';
import { useDemo } from '@/app/providers';
import { Icon } from '@/lib/icons';

export function AdminSettingsPanel() {
  const { resetDemo } = useDemo();

  const [toggles, setToggles] = useState([
    {
      title: 'Notificaciones automáticas de nuevas inscripciones',
      desc: 'Enviar avisos al equipo administrativo cada vez que un estudiante adquiere un curso.',
      enabled: true,
    },
    {
      title: 'Emisión y registro automático de certificados',
      desc: 'Generar inmediatamente el diploma con código QR criptográfico al superar el examen con puntaje aprobatorio.',
      enabled: true,
    },
    {
      title: 'Validador público de certificados activo',
      desc: 'Permitir a empresas e instituciones externas validar la autenticidad de diplomas mediante la URL pública.',
      enabled: true,
    },
    {
      title: 'Modo de mantenimiento del catálogo',
      desc: 'Pausar temporalmente las compras de nuevos cursos mientras se actualizan los contenidos.',
      enabled: false,
    },
  ]);

  const [toast, setToast] = useState(false);

  const handleToggle = (index: number) => {
    setToggles(prev =>
      prev.map((t, i) => (i === index ? { ...t, enabled: !t.enabled } : t))
    );
    setToast(true);
    setTimeout(() => setToast(false), 2000);
  };

  const handleReset = () => {
    if (
      confirm(
        '¿Deseas restablecer la memoria local del navegador? Esto restaurará la vista inicial y sincronizará de nuevo con el servidor central.'
      )
    ) {
      resetDemo();
      window.location.href = '/login';
    }
  };

  return (
    <div style={{ maxWidth: 840, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 18px',
            borderRadius: 12,
            background: '#ecfdf5',
            color: '#059669',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <Icon name="check" size={18} />
          <span>Configuración actualizada</span>
        </div>
      )}

      {/* Switches del sistema */}
      <div className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 26 }}>
        <h2 style={{ fontSize: 18, marginBottom: 6 }}>Parámetros Operativos de la Plataforma</h2>
        <p style={{ fontSize: 13, color: '#68788d', marginBottom: 20 }}>
          Ajusta las políticas de certificación, validación y alertas del entorno educativo.
        </p>

        <div className="settings-list" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {toggles.map((item, idx) => (
            <div
              className="setting-row"
              key={item.title}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                borderRadius: 12,
                background: '#fbfcfd',
                border: '1px solid #f1f5f9',
              }}
            >
              <div style={{ paddingRight: 20 }}>
                <strong style={{ display: 'block', fontSize: 14, marginBottom: 2 }}>
                  {item.title}
                </strong>
                <span style={{ fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>
                  {item.desc}
                </span>
              </div>

              <button
                type="button"
                className={`toggle ${item.enabled ? 'on' : ''}`}
                onClick={() => handleToggle(idx)}
                aria-label={`Alternar ${item.title}`}
              ></button>
            </div>
          ))}
        </div>
      </div>

      {/* Zona de Peligro: Restablecimiento */}
      <div
        className="panel"
        style={{
          background: '#fff',
          borderRadius: 18,
          border: '1px solid #fecaca',
          padding: 26,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#fff1f2',
              color: '#dc2626',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="trash" size={16} />
          </div>
          <h2 style={{ fontSize: 17, margin: 0, color: '#991b1b' }}>Zona de Mantenimiento y Datos</h2>
        </div>

        <p style={{ fontSize: 13, color: '#68788d', marginBottom: 18, lineHeight: 1.5 }}>
          Restaura los datos iniciales de la plataforma en este equipo. Esta acción eliminará modificaciones locales no sincronizadas y recargará la estructura oficial desde el servidor.
        </p>

        <button
          type="button"
          className="btn btn-danger"
          onClick={handleReset}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
        >
          <Icon name="trash" /> Restablecer datos locales del sistema
        </button>
      </div>
    </div>
  );
}
