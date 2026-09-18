'use client';
import { useState } from 'react';
import { Icon } from '@/lib/icons';

export function AdminContentEditor() {
  const [heroTitle, setHeroTitle] = useState('Formación que impulsa tu desarrollo profesional');
  const [heroDesc, setHeroDesc] = useState(
    'Accede a programas especializados en seguridad ciudadana, derecho de policía y gestión pública con certificación verificable.'
  );
  const [primaryBtn, setPrimaryBtn] = useState('Explorar catálogo de cursos');
  const [secondaryBtn, setSecondaryBtn] = useState('¿Cómo funciona?');
  const [statStudents, setStatStudents] = useState('+700');
  const [statCourses, setStatCourses] = useState('+35');
  const [statRating, setStatRating] = useState('4.9 / 5');

  const [toast, setToast] = useState(false);

  const handleSave = () => {
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
          <span>¡Contenidos del portal actualizados con éxito!</span>
        </div>
      )}

      {/* Barra superior */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '16px 20px',
          borderRadius: 16,
          border: '1px solid var(--line)',
        }}
      >
        <div>
          <h2 style={{ fontSize: 16, margin: '0 0 2px' }}>Editor de Experiencia Pública</h2>
          <p style={{ fontSize: 13, color: '#68788d', margin: 0 }}>
            Configura los textos destacados de la página principal y propuesta de valor.
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={handleSave}>
          <Icon name="check" /> Guardar cambios
        </button>
      </div>

      <div className="editor-grid">
        {/* Formulario */}
        <section className="panel" style={{ background: '#fff', borderRadius: 18, border: '1px solid var(--line)', padding: 24 }}>
          <h3 style={{ fontSize: 17, marginBottom: 16 }}>Hero Principal (Inicio)</h3>

          <div className="field">
            <label htmlFor="heroTitle">Título de impacto principal</label>
            <input
              id="heroTitle"
              value={heroTitle}
              onChange={e => setHeroTitle(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="heroDesc">Descripción o subtítulo</label>
            <textarea
              id="heroDesc"
              value={heroDesc}
              onChange={e => setHeroDesc(e.target.value)}
              rows={3}
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="field">
              <label htmlFor="pBtn">Texto botón primario</label>
              <input
                id="pBtn"
                value={primaryBtn}
                onChange={e => setPrimaryBtn(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="sBtn">Texto botón secundario</label>
              <input
                id="sBtn"
                value={secondaryBtn}
                onChange={e => setSecondaryBtn(e.target.value)}
              />
            </div>
          </div>

          <h3 style={{ fontSize: 17, margin: '28px 0 16px' }}>Indicadores y Métricas Institucionales</h3>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            <div className="field">
              <label htmlFor="stStud">Estudiantes formados</label>
              <input
                id="stStud"
                value={statStudents}
                onChange={e => setStatStudents(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="stCour">Programas activos</label>
              <input
                id="stCour"
                value={statCourses}
                onChange={e => setStatCourses(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="stRat">Calificación promedio</label>
              <input
                id="stRat"
                value={statRating}
                onChange={e => setStatRating(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Vista Previa en Vivo */}
        <aside className="panel sticky-card" style={{ background: '#071F49', color: '#fff', borderRadius: 18, padding: 24 }}>
          <span className="eyebrow" style={{ color: '#60a5fa' }}>Vista previa en tiempo real</span>

          <div style={{ marginTop: 20 }}>
            <h3 style={{ fontSize: 20, color: '#fff', lineHeight: 1.3, marginBottom: 12 }}>
              {heroTitle}
            </h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, marginBottom: 20 }}>
              {heroDesc}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
              <div
                style={{
                  background: '#0F59DF',
                  color: '#fff',
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  textAlign: 'center',
                }}
              >
                {primaryBtn}
              </div>
              <div
                style={{
                  border: '1px solid rgba(255,255,255,0.25)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  textAlign: 'center',
                }}
              >
                {secondaryBtn}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 8,
                borderTop: '1px solid rgba(255,255,255,0.15)',
                paddingTop: 16,
                textAlign: 'center',
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>{statStudents}</strong>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Estudiantes</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>{statCourses}</strong>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Cursos</span>
              </div>
              <div>
                <strong style={{ display: 'block', fontSize: 14 }}>{statRating}</strong>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>Satisfacción</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
