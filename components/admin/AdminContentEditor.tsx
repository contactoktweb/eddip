'use client';
import { useState, useEffect } from 'react';
import { Icon } from '@/lib/icons';
import {
  contentService,
  defaultSiteContent,
  type SiteContent,
  type HomeHeroContent,
  type HomeStatsContent,
} from '@/lib/supabase/contentService';

type TabKey = 'inicio' | 'estadisticas' | 'nosotros';

export function AdminContentEditor() {
  const [activeTab, setActiveTab] = useState<TabKey>('inicio');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' }>({
    show: false,
    msg: '',
    type: 'success',
  });

  // Estado del contenido completo
  const [content, setContent] = useState<SiteContent>(defaultSiteContent);

  // Cargar desde Supabase al montar
  useEffect(() => {
    let mounted = true;
    contentService
      .getSiteContent()
      .then(res => {
        if (mounted) {
          setContent(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const showNotification = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3500);
  };

  // Manejo de cambios en Home Hero
  const updateHomeHero = (field: keyof HomeHeroContent, val: string) => {
    setContent(prev => ({
      ...prev,
      homeHero: {
        ...prev.homeHero,
        [field]: val,
      },
    }));
  };

  // Manejo de cambios en Home Stats
  const updateHomeStats = (field: keyof HomeStatsContent, val: string) => {
    setContent(prev => ({
      ...prev,
      homeStats: {
        ...prev.homeStats,
        [field]: val,
      },
      stats: {
        ...prev.stats,
        ...(field in prev.stats ? { [field]: val } : {}),
      },
    }));
  };

  // Manejo de cambios en Nosotros
  const updateAboutHero = (field: keyof SiteContent['aboutHero'], val: string) => {
    setContent(prev => ({
      ...prev,
      aboutHero: {
        ...prev.aboutHero,
        [field]: val,
      },
    }));
  };

  const updateMission = (field: 'title' | 'description', val: string) => {
    setContent(prev => ({
      ...prev,
      mission: {
        ...prev.mission,
        [field]: val,
      },
    }));
  };

  const updateVision = (field: 'title' | 'description', val: string) => {
    setContent(prev => ({
      ...prev,
      vision: {
        ...prev.vision,
        [field]: val,
      },
    }));
  };

  const updatePillar = (idx: number, val: string) => {
    setContent(prev => {
      const nextPillars = [...prev.mission.pillars];
      nextPillars[idx] = val;
      return {
        ...prev,
        mission: {
          ...prev.mission,
          pillars: nextPillars,
        },
      };
    });
  };

  const addPillar = () => {
    setContent(prev => ({
      ...prev,
      mission: {
        ...prev.mission,
        pillars: [...prev.mission.pillars, 'Nuevo pilar doctrinario'],
      },
    }));
  };

  const removePillar = (idx: number) => {
    if (content.mission.pillars.length <= 1) return;
    setContent(prev => ({
      ...prev,
      mission: {
        ...prev.mission,
        pillars: prev.mission.pillars.filter((_, i) => i !== idx),
      },
    }));
  };

  // Guardar en Supabase
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await contentService.saveAllSiteContent(content);
      if (res.success) {
        showNotification('¡Contenido web sincronizado con la base de datos de Supabase en tiempo real!', 'success');
      } else {
        showNotification('Se guardaron los cambios localmente con avisos en base de datos.', 'error');
      }
    } catch {
      showNotification('Error al conectar con la base de datos.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Restaurar valores iniciales
  const handleRestoreDefaults = () => {
    if (confirm('¿Deseas restaurar los textos institucionales a los valores recomendados por defecto?')) {
      setContent(defaultSiteContent);
      showNotification('Valores predeterminados cargados en el editor. Haz clic en "Guardar cambios" para aplicarlos en Supabase.');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: '#64748b' }}>
        <div style={{ display: 'inline-block', marginBottom: 12 }}>
          <Icon name="refresh" size={24} />
        </div>
        <p style={{ margin: 0, fontSize: 14 }}>Cargando contenidos desde Supabase...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Toast Feedback */}
      {toast.show && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '14px 20px',
            borderRadius: 12,
            background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: toast.type === 'success' ? '#065f46' : '#991b1b',
            boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
            border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 14,
            fontWeight: 600,
            maxWidth: 420,
          }}
        >
          <Icon name={toast.type === 'success' ? 'check' : 'alert'} size={20} />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Barra superior de control y guardado */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#fff',
          padding: '16px 22px',
          borderRadius: 16,
          border: '1px solid var(--line)',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{ fontSize: 16, margin: 0, color: '#071F49' }}>
              Gestión de Contenido Dinámico
            </h2>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 20,
                background: '#ecfdf5',
                color: '#059669',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#10b981',
                }}
              />
              Supabase en vivo
            </span>
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: '3px 0 0' }}>
            Los cambios guardados se reflejan inmediatamente en la web pública para todos los usuarios.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            className="btn btn-outline"
            onClick={handleRestoreDefaults}
            style={{ fontSize: 13, padding: '9px 14px' }}
          >
            <Icon name="refresh" size={14} /> Restaurar base
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving}
            style={{ fontSize: 13, padding: '9px 18px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Icon name="check" size={15} />
            {saving ? 'Sincronizando...' : 'Guardar y sincronizar'}
          </button>
        </div>
      </div>

      {/* Pestañas de secciones */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          borderBottom: '1px solid var(--line)',
          paddingBottom: 0,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('inicio')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'inicio' ? '3px solid #0F59DF' : '3px solid transparent',
            color: activeTab === 'inicio' ? '#0F59DF' : '#64748b',
            fontWeight: activeTab === 'inicio' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="grid" size={16} /> Página de Inicio (Hero)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('estadisticas')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'estadisticas' ? '3px solid #0F59DF' : '3px solid transparent',
            color: activeTab === 'estadisticas' ? '#0F59DF' : '#64748b',
            fontWeight: activeTab === 'estadisticas' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="chart" size={16} /> Cifras y Estadísticas
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('nosotros')}
          style={{
            padding: '10px 18px',
            border: 'none',
            background: 'none',
            borderBottom: activeTab === 'nosotros' ? '3px solid #0F59DF' : '3px solid transparent',
            color: activeTab === 'nosotros' ? '#0F59DF' : '#64748b',
            fontWeight: activeTab === 'nosotros' ? 700 : 500,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="shield" size={16} /> Institucional (Nosotros)
        </button>
      </div>

      <div className="editor-grid">
        {/* Formulario según pestaña activa */}
        <section
          className="panel"
          style={{
            background: '#fff',
            borderRadius: 18,
            border: '1px solid var(--line)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          {/* TAB 1: HERO DE INICIO */}
          {activeTab === 'inicio' && (
            <>
              <div>
                <h3 style={{ fontSize: 17, margin: '0 0 4px', color: '#071F49' }}>
                  Hero Principal de Inicio (Home)
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Ajusta los mensajes principales que ven los visitantes al ingresar a la plataforma.
                </p>
              </div>

              <div className="field">
                <label htmlFor="hEyebrow">Etiqueta / Badge superior</label>
                <input
                  id="hEyebrow"
                  value={content.homeHero.eyebrow}
                  onChange={e => updateHomeHero('eyebrow', e.target.value)}
                  placeholder="Ej: Bienvenido a EDDIP"
                />
              </div>

              <div className="field">
                <label htmlFor="hHeadline">Titular principal de impacto</label>
                <input
                  id="hHeadline"
                  value={content.homeHero.headline}
                  onChange={e => updateHomeHero('headline', e.target.value)}
                  placeholder="Educación online para profesionales..."
                />
              </div>

              <div className="field">
                <label htmlFor="hHighlight">
                  Frase con énfasis visual en degradado (debe coincidir con parte del titular)
                </label>
                <input
                  id="hHighlight"
                  value={content.homeHero.headlineHighlight}
                  onChange={e => updateHomeHero('headlineHighlight', e.target.value)}
                  placeholder="Ej: transforman el mundo"
                />
              </div>

              <div className="field">
                <label htmlFor="hLead">Descripción o subtítulo explicativo</label>
                <textarea
                  id="hLead"
                  value={content.homeHero.lead}
                  onChange={e => updateHomeHero('lead', e.target.value)}
                  rows={3}
                  placeholder="Capacítate con cursos especializados diseñados por expertos..."
                />
              </div>

              <h4 style={{ fontSize: 15, margin: '14px 0 2px', color: '#071F49' }}>
                Botones de Llamado a la Acción (CTA)
              </h4>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="pBtnText">Texto botón primario</label>
                  <input
                    id="pBtnText"
                    value={content.homeHero.primaryBtnText}
                    onChange={e => updateHomeHero('primaryBtnText', e.target.value)}
                    placeholder="Explorar cursos"
                  />
                </div>
                <div className="field">
                  <label htmlFor="pBtnLink">Enlace botón primario</label>
                  <input
                    id="pBtnLink"
                    value={content.homeHero.primaryBtnLink}
                    onChange={e => updateHomeHero('primaryBtnLink', e.target.value)}
                    placeholder="/cursos"
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="sBtnText">Texto botón secundario</label>
                  <input
                    id="sBtnText"
                    value={content.homeHero.secondaryBtnText}
                    onChange={e => updateHomeHero('secondaryBtnText', e.target.value)}
                    placeholder="Conoce más"
                  />
                </div>
                <div className="field">
                  <label htmlFor="sBtnLink">Enlace botón secundario</label>
                  <input
                    id="sBtnLink"
                    value={content.homeHero.secondaryBtnLink}
                    onChange={e => updateHomeHero('secondaryBtnLink', e.target.value)}
                    placeholder="/nosotros"
                  />
                </div>
              </div>
            </>
          )}

          {/* TAB 2: ESTADÍSTICAS Y MÉTRICAS */}
          {activeTab === 'estadisticas' && (
            <>
              <div>
                <h3 style={{ fontSize: 17, margin: '0 0 4px', color: '#071F49' }}>
                  Indicadores y Métricas Institucionales
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Estas cifras se muestran en el banner de confianza inferior del Inicio y en la página Nosotros.
                </p>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="stStudents">Estudiantes formados / Egresados</label>
                  <input
                    id="stStudents"
                    value={content.homeStats.students}
                    onChange={e => updateHomeStats('students', e.target.value)}
                    placeholder="12.500+"
                  />
                </div>

                <div className="field">
                  <label htmlFor="stCourses">Cursos y programas disponibles</label>
                  <input
                    id="stCourses"
                    value={content.homeStats.courses}
                    onChange={e => updateHomeStats('courses', e.target.value)}
                    placeholder="250+"
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="stCerts">Certificados emitidos</label>
                  <input
                    id="stCerts"
                    value={content.homeStats.certificates}
                    onChange={e => updateHomeStats('certificates', e.target.value)}
                    placeholder="8.900+"
                  />
                </div>

                <div className="field">
                  <label htmlFor="stCountries">Países con presencia / cobertura</label>
                  <input
                    id="stCountries"
                    value={content.homeStats.countries}
                    onChange={e => updateHomeStats('countries', e.target.value)}
                    placeholder="15+"
                  />
                </div>
              </div>

              <div className="field" style={{ maxWidth: 300 }}>
                <label htmlFor="stRating">Calificación promedio de satisfacción</label>
                <input
                  id="stRating"
                  value={content.homeStats.rating}
                  onChange={e => updateHomeStats('rating', e.target.value)}
                  placeholder="4.9 / 5"
                />
              </div>
            </>
          )}

          {/* TAB 3: NOSOTROS (INSTITUCIONAL) */}
          {activeTab === 'nosotros' && (
            <>
              <div>
                <h3 style={{ fontSize: 17, margin: '0 0 4px', color: '#071F49' }}>
                  Sección Institucional (Página Nosotros)
                </h3>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
                  Edita la misión, visión, pilares doctrinarios y reseña académica de la Escuela EDDIP.
                </p>
              </div>

              <div className="field">
                <label htmlFor="abEyebrow">Etiqueta institucional superior</label>
                <input
                  id="abEyebrow"
                  value={content.aboutHero.eyebrow}
                  onChange={e => updateAboutHero('eyebrow', e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="abTitle">Título de Nosotros</label>
                <input
                  id="abTitle"
                  value={content.aboutHero.title}
                  onChange={e => updateAboutHero('title', e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="abDesc">Reseña institucional descriptiva</label>
                <textarea
                  id="abDesc"
                  value={content.aboutHero.description}
                  onChange={e => updateAboutHero('description', e.target.value)}
                  rows={3}
                />
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="mTitle">Título de Misión</label>
                  <input
                    id="mTitle"
                    value={content.mission.title}
                    onChange={e => updateMission('title', e.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="vTitle">Título de Visión</label>
                  <input
                    id="vTitle"
                    value={content.vision.title}
                    onChange={e => updateVision('title', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="mDesc">Descripción de la Misión</label>
                  <textarea
                    id="mDesc"
                    value={content.mission.description}
                    onChange={e => updateMission('description', e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="field">
                  <label htmlFor="vDesc">Descripción de la Visión</label>
                  <textarea
                    id="vDesc"
                    value={content.vision.description}
                    onChange={e => updateVision('description', e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <label style={{ margin: 0, fontWeight: 600 }}>Pilares Doctrinales y Pedagógicos</label>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={addPillar}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    + Agregar pilar
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {content.mission.pillars.map((pillar, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        value={pillar}
                        onChange={e => updatePillar(idx, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {content.mission.pillars.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePillar(idx)}
                          style={{
                            border: '1px solid #fecaca',
                            background: '#fff1f2',
                            color: '#dc2626',
                            borderRadius: 8,
                            padding: '8px 10px',
                            cursor: 'pointer',
                          }}
                          title="Eliminar pilar"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Vista previa en vivo interactiva */}
        <aside
          className="panel sticky-card"
          style={{
            background: activeTab === 'inicio' ? '#071F49' : activeTab === 'estadisticas' ? '#0b50bc' : '#ffffff',
            color: activeTab === 'nosotros' ? '#071F49' : '#ffffff',
            borderRadius: 18,
            padding: 24,
            border: '1px solid var(--line)',
            boxShadow: '0 8px 30px rgba(7, 31, 73, 0.08)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <span
              className="eyebrow"
              style={{
                color: activeTab === 'nosotros' ? '#0F59DF' : '#93c5fd',
                margin: 0,
                fontSize: 11,
              }}
            >
              VISTA PREVIA EN VIVO
            </span>
            <span
              style={{
                fontSize: 10,
                padding: '2px 8px',
                borderRadius: 12,
                background: activeTab === 'nosotros' ? '#f1f5f9' : 'rgba(255,255,255,0.15)',
                color: activeTab === 'nosotros' ? '#64748b' : '#fff',
                fontWeight: 600,
              }}
            >
              {activeTab === 'inicio' ? 'Home Hero' : activeTab === 'estadisticas' ? 'Cifras Clave' : 'Nosotros'}
            </span>
          </div>

          {/* Vista previa de Hero */}
          {activeTab === 'inicio' && (
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255,255,255,0.1)',
                  padding: '4px 10px',
                  borderRadius: 16,
                  fontSize: 11,
                  color: '#93c5fd',
                  marginBottom: 12,
                }}
              >
                <Icon name="cap" size={12} />
                <span>{content.homeHero.eyebrow || 'Bienvenido a EDDIP'}</span>
              </div>

              <h4 style={{ fontSize: 18, color: '#fff', lineHeight: 1.3, margin: '0 0 10px' }}>
                {content.homeHero.headline}{' '}
                {content.homeHero.headlineHighlight && (
                  <span style={{ color: '#60a5fa', textDecoration: 'underline' }}>
                    {content.homeHero.headlineHighlight}
                  </span>
                )}
              </h4>

              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5, margin: '0 0 16px' }}>
                {content.homeHero.lead}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 18 }}>
                <div
                  style={{
                    background: '#0F59DF',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    textAlign: 'center',
                  }}
                >
                  {content.homeHero.primaryBtnText || 'Explorar cursos'}
                </div>
                <div
                  style={{
                    border: '1px solid rgba(255,255,255,0.25)',
                    color: '#fff',
                    padding: '7px 14px',
                    borderRadius: 8,
                    fontSize: 11,
                    textAlign: 'center',
                  }}
                >
                  {content.homeHero.secondaryBtnText || 'Conoce más'}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  paddingTop: 12,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 6,
                  textAlign: 'center',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: 13 }}>{content.homeStats.students}</strong>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Alumnos</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 13 }}>{content.homeStats.courses}</strong>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Cursos</span>
                </div>
                <div>
                  <strong style={{ display: 'block', fontSize: 13 }}>{content.homeStats.rating}</strong>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)' }}>Opinión</span>
                </div>
              </div>
            </div>
          )}

          {/* Vista previa de Estadísticas */}
          {activeTab === 'estadisticas' && (
            <div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '0 0 16px' }}>
                Banner de confianza institucional en la parte inferior del portal:
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <strong style={{ fontSize: 18, display: 'block' }}>{content.homeStats.students}</strong>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Estudiantes</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <strong style={{ fontSize: 18, display: 'block' }}>{content.homeStats.courses}</strong>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Cursos</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <strong style={{ fontSize: 18, display: 'block', color: '#86efac' }}>{content.homeStats.certificates}</strong>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Certificados</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '12px 10px', textAlign: 'center' }}>
                  <strong style={{ fontSize: 18, display: 'block' }}>{content.homeStats.countries}</strong>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>Países</span>
                </div>
              </div>
            </div>
          )}

          {/* Vista previa de Nosotros */}
          {activeTab === 'nosotros' && (
            <div style={{ fontSize: 12 }}>
              <span className="eyebrow" style={{ fontSize: 10, color: '#0F59DF', display: 'block', marginBottom: 4 }}>
                {content.aboutHero.eyebrow}
              </span>
              <h4 style={{ fontSize: 15, margin: '0 0 8px', color: '#071F49' }}>
                {content.aboutHero.title}
              </h4>
              <p style={{ color: '#64748b', margin: '0 0 12px', lineHeight: 1.4 }}>
                {content.aboutHero.description}
              </p>

              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 10, marginTop: 10 }}>
                <strong style={{ fontSize: 12, color: '#071F49', display: 'block', marginBottom: 4 }}>
                  {content.mission.title}
                </strong>
                <p style={{ color: '#475569', fontSize: 11, margin: '0 0 8px' }}>
                  {content.mission.description}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {content.mission.pillars.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: '#334155' }}>
                      <span style={{ color: '#0F59DF' }}>✓</span>
                      <span>{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
