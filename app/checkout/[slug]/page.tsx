'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { useDemo } from '@/app/providers';
import { money } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { adminService } from '@/lib/supabase/adminService';

type PaymentMethod = 'pse' | 'card' | 'wallet';

export default function Checkout() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { courses, purchase, login, user, updateProfile } = useDemo();
  const course = courses.find(c => c.slug === slug);

  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pse');
  const [selectedBank, setSelectedBank] = useState('bancolombia');
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponMsg, setCouponMsg] = useState<{ text: string; error: boolean } | null>(null);

  // Datos del formulario
  const [formData, setFormData] = useState({
    name: user.name || '',
    documentId: user.documentId || '',
    email: user.email || '',
    phone: user.phone || '',
    city: user.city || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!course) {
    return (
      <>
        <SiteHeader />
        <main className="section container" style={{ textAlign: 'center', padding: '100px 20px', minHeight: '65vh' }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: '#fff1f2',
              color: '#dc2626',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Icon name="close" size={32} />
          </div>
          <h1 style={{ fontSize: 28, marginBottom: 12, color: '#071F49' }}>Programa no encontrado</h1>
          <p style={{ color: '#64748b', maxWidth: 460, margin: '0 auto 24px', lineHeight: 1.6 }}>
            El curso solicitado no se encuentra disponible o ha sido actualizado en la oferta académica de EDDIP.
          </p>
          <Link className="btn btn-primary" href="/cursos">
            <Icon name="book" /> Explorar catálogo de cursos
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (clean === 'EDDIP10' || clean === 'OFICIAL' || clean === 'BECA2026') {
      setDiscountPercent(15);
      setCouponMsg({ text: '¡Beca institucional del 15% aplicada exitosamente!', error: false });
    } else if (clean.length > 0) {
      setDiscountPercent(0);
      setCouponMsg({ text: 'Código no válido o expirado para esta convocatoria.', error: true });
    }
  };

  const discountAmount = Math.round((course.price * discountPercent) / 100);
  const finalPrice = Math.max(0, course.price - discountAmount);

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio para expedir el diploma.';
    if (!formData.documentId.trim()) errs.documentId = 'La cédula o documento es requerido para registro legal.';
    if (!formData.email.trim() || !formData.email.includes('@')) errs.email = 'Ingresa un correo electrónico válido.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setStage('processing');

    try {
      // Guardar datos en el perfil del usuario
      await updateProfile({
        fullName: formData.name,
        documentId: formData.documentId,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
      });

      // Registrar venta en el sistema comercial
      const methodLabel = paymentMethod === 'pse' ? 'PSE' : paymentMethod === 'card' ? 'Tarjeta de Crédito' : 'Billetera Digital';
      adminService.recordSale({
        id: `VEN-${Math.floor(1020 + Math.random() * 8900)}`,
        student: formData.name,
        course: course.title,
        value: finalPrice,
        method: methodLabel,
        date: new Date().toISOString().slice(0, 10),
        status: 'Aprobado',
      });

      // Matricular al estudiante en el directorio académico
      adminService.enrollStudentInCourse(formData.name, formData.email, course.slug, course.title);
    } catch {
      // Continuar con la matrícula
    }

    setTimeout(() => {
      purchase(course.slug);
      login('student');
      setStage('success');
    }, 1200);
  };

  return (
    <>
      <SiteHeader />
      <main style={{ background: '#f8fafc', minHeight: '85vh', padding: '36px 0 80px' }}>
        <div className="container" style={{ maxWidth: 1140 }}>
          {/* Breadcrumb de navegación */}
          <nav
            aria-label="Ruta de navegación"
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 26,
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 13,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
              <Link href="/" style={{ color: '#0b62dd', textDecoration: 'none' }}>
                Inicio
              </Link>
              <span>/</span>
              <Link href="/cursos" style={{ color: '#0b62dd', textDecoration: 'none' }}>
                Catálogo
              </Link>
              <span>/</span>
              <span style={{ color: '#071F49', fontWeight: 600 }}>Matrícula</span>
            </div>

            <Link
              href={`/cursos/${course.slug}`}
              style={{
                color: '#0b62dd',
                textDecoration: 'none',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              ← Volver al curso
            </Link>
          </nav>

          {/* Banner de Cabecera del Checkout */}
          <div
            style={{
              background: 'linear-gradient(135deg, #071f48 0%, #0b50bc 60%, #1771e8 100%)',
              borderRadius: 20,
              padding: '28px 32px',
              color: '#ffffff',
              marginBottom: 32,
              boxShadow: '0 12px 35px rgba(7, 31, 73, 0.12)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ position: 'relative', zIndex: 2 }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  padding: '4px 12px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginBottom: 10,
                  color: '#bfdbfe',
                }}
              >
                <Icon name="shield" size={14} /> Matrícula Académica Oficial · EDDIP
              </span>
              <h1 style={{ fontSize: 30, color: '#ffffff', margin: '0 0 8px', fontWeight: 800, lineHeight: 1.2 }}>
                Inscripción y Acreditación del Programa
              </h1>
              <p style={{ margin: 0, color: '#e2e8f0', fontSize: 14, maxWidth: 650, lineHeight: 1.6 }}>
                Diligencia tus datos para la expedición de tu certificado con código QR criptográfico y activación inmediata en el campus virtual.
              </p>
            </div>
          </div>

          {stage === 'success' ? (
            <div
              style={{
                maxWidth: 640,
                margin: '30px auto',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 24,
                padding: '48px 36px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(7, 31, 73, 0.08)',
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 22,
                  background: '#ecfdf5',
                  color: '#059669',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 20px',
                  boxShadow: '0 8px 20px rgba(5, 150, 105, 0.15)',
                }}
              >
                <Icon name="check" size={38} />
              </div>
              <span className="eyebrow" style={{ color: '#059669' }}>
                Matrícula Confirmada
              </span>
              <h2 style={{ fontSize: 26, color: '#071F49', margin: '8px 0 12px', fontWeight: 800 }}>
                ¡Bienvenido a tu programa de formación!
              </h2>
              <p style={{ color: '#52637a', fontSize: 15, margin: '0 auto 28px', maxWidth: 480, lineHeight: 1.65 }}>
                Tu matrícula en <strong>{course.title}</strong> ha sido activada en tu aula virtual de EDDIP. Ya puedes comenzar tus lecciones interactivas.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: 16,
                  padding: '16px 20px',
                  marginBottom: 28,
                  textAlign: 'left',
                  fontSize: 13,
                  color: '#334155',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Estudiante registrado:</span>
                  <strong>{formData.name || user.name}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ color: '#64748b' }}>Documento de identidad:</span>
                  <strong>{formData.documentId || user.documentId}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Acceso al aula:</span>
                  <span style={{ color: '#059669', fontWeight: 700 }}>Habilitado 24/7 Inmediato</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={() => router.push(`/aprender/${course.slug}`)}
                  style={{ padding: '13px 30px' }}
                >
                  <Icon name="cap" /> Ingresar al aula virtual
                </button>
                <Link className="btn btn-outline" href="/dashboard/cursos" style={{ padding: '13px 24px' }}>
                  Ir a Mis Cursos
                </Link>
              </div>
            </div>
          ) : stage === 'processing' ? (
            <div
              style={{
                maxWidth: 580,
                margin: '40px auto',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 24,
                padding: '60px 32px',
                textAlign: 'center',
                boxShadow: '0 20px 50px rgba(7, 31, 73, 0.08)',
              }}
            >
              <div className="spinner" style={{ margin: '0 auto 24px' }}></div>
              <span className="eyebrow">Validación Criptográfica</span>
              <h2 style={{ fontSize: 24, color: '#071F49', margin: '10px 0 10px', fontWeight: 800 }}>
                Procesando matrícula académica...
              </h2>
              <p style={{ color: '#64748b', fontSize: 14, margin: '0 auto', maxWidth: 400, lineHeight: 1.6 }}>
                Confirmando transacción con cifrado seguro y habilitando el temario en tu cuenta de estudiante.
              </p>
            </div>
          ) : (
            <form onSubmit={pay} style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32, alignItems: 'start' }}>
              {/* Columna Izquierda: Datos y Pago */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* TARJETA 1: DATOS DEL ESTUDIANTE */}
                <section
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 22,
                    padding: '30px 28px',
                    boxShadow: '0 4px 20px rgba(7, 31, 73, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: '#eef4ff',
                        color: '#0b62dd',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon name="user" size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, color: '#071F49', margin: 0, fontWeight: 700 }}>
                        1. Información para la Acreditación Oficial
                      </h2>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        Estos datos se imprimirán en tu diploma y código QR verificable.
                      </p>
                    </div>
                  </div>

                  {/* Fila 1: Nombre y Documento */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Nombre y apellidos completos <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: `1px solid ${errors.name ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: 14,
                          color: '#0f172a',
                          outline: 'none',
                          background: '#fff',
                        }}
                        placeholder="ej. Carlos Alberto Rodríguez"
                        value={formData.name}
                        onChange={e => {
                          setFormData({ ...formData, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                      />
                      {errors.name && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block' }}>{errors.name}</span>}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Cédula o Documento de Identidad <span style={{ color: '#dc2626' }}>*</span>
                      </label>
                      <input
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: `1px solid ${errors.documentId ? '#ef4444' : '#cbd5e1'}`,
                          fontSize: 14,
                          color: '#0f172a',
                          outline: 'none',
                          background: '#fff',
                        }}
                        placeholder="ej. 1.032.456.789"
                        value={formData.documentId}
                        onChange={e => {
                          setFormData({ ...formData, documentId: e.target.value });
                          if (errors.documentId) setErrors({ ...errors, documentId: '' });
                        }}
                      />
                      {errors.documentId && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block' }}>{errors.documentId}</span>}
                    </div>
                  </div>

                  {/* Fila 2: Correo */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                      Correo electrónico de acceso <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="email"
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: `1px solid ${errors.email ? '#ef4444' : '#cbd5e1'}`,
                        fontSize: 14,
                        color: '#0f172a',
                        outline: 'none',
                        background: '#fff',
                      }}
                      placeholder="ej. estudiante@correo.com"
                      value={formData.email}
                      onChange={e => {
                        setFormData({ ...formData, email: e.target.value });
                        if (errors.email) setErrors({ ...errors, email: '' });
                      }}
                    />
                    {errors.email && <span style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'block' }}>{errors.email}</span>}
                  </div>

                  {/* Fila 3: Teléfono y Ciudad */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Teléfono / WhatsApp de contacto
                      </label>
                      <input
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: '1px solid #cbd5e1',
                          fontSize: 14,
                          color: '#0f172a',
                          outline: 'none',
                          background: '#fff',
                        }}
                        placeholder="ej. 300 555 0182"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                        Ciudad de residencia
                      </label>
                      <input
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          borderRadius: 12,
                          border: '1px solid #cbd5e1',
                          fontSize: 14,
                          color: '#0f172a',
                          outline: 'none',
                          background: '#fff',
                        }}
                        placeholder="ej. Bogotá D.C."
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

                {/* TARJETA 2: MÉTODO DE PAGO */}
                <section
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 22,
                    padding: '30px 28px',
                    boxShadow: '0 4px 20px rgba(7, 31, 73, 0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: '#f0fdf4',
                        color: '#16a34a',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon name="shield" size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, color: '#071F49', margin: 0, fontWeight: 700 }}>
                        2. Selección de Medio de Pago Seguro
                      </h2>
                      <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                        Pasarela bancaria cifrada con validación y expedición automática.
                      </p>
                    </div>
                  </div>

                  {/* Selector de Métodos */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                    {/* Opción 1: PSE */}
                    <div
                      onClick={() => setPaymentMethod('pse')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        borderRadius: 16,
                        border: `2px solid ${paymentMethod === 'pse' ? '#0b62dd' : '#e2e8f0'}`,
                        background: paymentMethod === 'pse' ? '#f0f7ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: `2px solid ${paymentMethod === 'pse' ? '#0b62dd' : '#cbd5e1'}`,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {paymentMethod === 'pse' && (
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0b62dd' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <strong style={{ fontSize: 14, color: '#071F49' }}>PSE — Transferencia Bancaria</strong>
                            <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>
                              Recomendado
                            </span>
                          </div>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 2 }}>
                            Bancolombia, Davivienda, Banco de Bogotá, Nequi y todas las entidades bancarias
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#059669', fontWeight: 700, background: '#ecfdf5', padding: '4px 10px', borderRadius: 8 }}>
                        Inmediato
                      </span>
                    </div>

                    {/* Sub-formulario PSE si está activo */}
                    {paymentMethod === 'pse' && (
                      <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, marginTop: -4 }}>
                        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                          Selecciona tu institución financiera:
                        </label>
                        <select
                          className="select"
                          style={{ width: '100%', fontSize: 13, background: '#fff' }}
                          value={selectedBank}
                          onChange={e => setSelectedBank(e.target.value)}
                        >
                          <option value="bancolombia">Bancolombia (Personas / Empresas)</option>
                          <option value="davivienda">Banco Davivienda</option>
                          <option value="bogota">Banco de Bogotá</option>
                          <option value="bbva">BBVA Colombia</option>
                          <option value="occidente">Banco de Occidente</option>
                          <option value="popular">Banco Popular</option>
                          <option value="nequi">Nequi</option>
                          <option value="daviplata">Daviplata</option>
                        </select>
                      </div>
                    )}

                    {/* Opción 2: Tarjeta */}
                    <div
                      onClick={() => setPaymentMethod('card')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        borderRadius: 16,
                        border: `2px solid ${paymentMethod === 'card' ? '#0b62dd' : '#e2e8f0'}`,
                        background: paymentMethod === 'card' ? '#f0f7ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: `2px solid ${paymentMethod === 'card' ? '#0b62dd' : '#cbd5e1'}`,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {paymentMethod === 'card' && (
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0b62dd' }} />
                          )}
                        </div>
                        <div>
                          <strong style={{ fontSize: 14, color: '#071F49' }}>Tarjeta de Crédito o Débito</strong>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 2 }}>
                            Visa, Mastercard, American Express, Diners
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#475569', background: '#f1f5f9', padding: '4px 10px', borderRadius: 8, fontWeight: 600 }}>
                        Hasta 12 cuotas
                      </span>
                    </div>

                    {/* Opción 3: Billeteras */}
                    <div
                      onClick={() => setPaymentMethod('wallet')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '16px 18px',
                        borderRadius: 16,
                        border: `2px solid ${paymentMethod === 'wallet' ? '#0b62dd' : '#e2e8f0'}`,
                        background: paymentMethod === 'wallet' ? '#f0f7ff' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: `2px solid ${paymentMethod === 'wallet' ? '#0b62dd' : '#cbd5e1'}`,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          {paymentMethod === 'wallet' && (
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#0b62dd' }} />
                          )}
                        </div>
                        <div>
                          <strong style={{ fontSize: 14, color: '#071F49' }}>Billeteras Digitales Directas</strong>
                          <span style={{ fontSize: 12, color: '#64748b', display: 'block', marginTop: 2 }}>
                            Pago con notificación push a tu aplicación Nequi o Daviplata
                          </span>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#059669', background: '#ecfdf5', padding: '4px 10px', borderRadius: 8, fontWeight: 700 }}>
                        Sin comisiones
                      </span>
                    </div>
                  </div>

                  {/* Aviso de seguridad */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      background: '#f8fafc',
                      borderRadius: 12,
                      border: '1px solid #e2e8f0',
                      fontSize: 12,
                      color: '#475569',
                    }}
                  >
                    <Icon name="shield" size={18} />
                    <span>
                      Tus datos personales y bancarios viajan protegidos con cifrado SSL de 256 bits y certificación de seguridad bancaria.
                    </span>
                  </div>
                </section>
              </div>

              {/* Columna Derecha: Resumen de Matrícula (Sticky) */}
              <aside
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 24,
                  padding: '28px 24px',
                  boxShadow: '0 12px 40px rgba(7, 31, 73, 0.06)',
                  position: 'sticky',
                  top: 90,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                  <h2 style={{ fontSize: 18, color: '#071F49', margin: 0, fontWeight: 800 }}>
                    Resumen de matrícula
                  </h2>
                  <span
                    style={{
                      fontSize: 11,
                      background: '#ecfdf5',
                      color: '#059669',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 6,
                    }}
                  >
                    Cupo Disponible
                  </span>
                </div>

                {/* Tarjeta del curso elegido */}
                <div
                  style={{
                    padding: 14,
                    borderRadius: 16,
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    gap: 14,
                    alignItems: 'center',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      width: 54,
                      height: 54,
                      borderRadius: 14,
                      background: course.gradient,
                      color: '#fff',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                      boxShadow: '0 4px 12px rgba(11, 98, 221, 0.2)',
                    }}
                  >
                    <Icon name="book" size={24} />
                  </div>
                  <div>
                    <span style={{ fontSize: 11, color: '#0b62dd', fontWeight: 700, textTransform: 'uppercase' }}>
                      {course.category}
                    </span>
                    <strong style={{ fontSize: 13.5, color: '#071F49', display: 'block', lineHeight: 1.3, marginTop: 2 }}>
                      {course.title}
                    </strong>
                    <span style={{ fontSize: 11, color: '#64748b' }}>
                      {course.durationHours} horas académicas · {course.level}
                    </span>
                  </div>
                </div>

                {/* Cupón Institucional */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      style={{
                        flex: 1,
                        padding: '9px 12px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        fontSize: 12,
                        textTransform: 'uppercase',
                        outline: 'none',
                      }}
                      placeholder="Cupón de beca (ej. EDDIP10)"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="btn btn-outline"
                      style={{ padding: '9px 14px', fontSize: 12 }}
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponMsg && (
                    <span
                      style={{
                        fontSize: 11,
                        color: couponMsg.error ? '#dc2626' : '#059669',
                        marginTop: 6,
                        display: 'block',
                        fontWeight: 600,
                      }}
                    >
                      {couponMsg.text}
                    </span>
                  )}
                </div>

                {/* Desglose de Precios */}
                <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#475569', marginBottom: 8 }}>
                    <span>Inversión del programa</span>
                    <span style={{ color: '#0f172a', fontWeight: 600 }}>{money(course.price)}</span>
                  </div>

                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669', marginBottom: 8 }}>
                      <span>Beca institucional ({discountPercent}%)</span>
                      <span>-{money(discountAmount)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    <span>Impuestos (Educación formal)</span>
                    <span style={{ color: '#059669', fontWeight: 600 }}>Exento</span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      paddingTop: 12,
                      borderTop: '2px dashed #cbd5e1',
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: 14, color: '#071F49', display: 'block' }}>Total a Pagar</strong>
                      <span style={{ fontSize: 10, color: '#64748b' }}>Moneda local (COP)</span>
                    </div>
                    <strong style={{ fontSize: 24, color: '#0b62dd', fontWeight: 800 }}>
                      {money(finalPrice)}
                    </strong>
                  </div>
                </div>

                {/* Beneficios Incluidos */}
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginBottom: 22,
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#071F49', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Tu matrícula incluye:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#475569' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="check" size={14} /> Acceso vitalicio al temario 24/7
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="check" size={14} /> Diploma con código QR verificable
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="check" size={14} /> Evaluación de certificación y soporte
                    </span>
                  </div>
                </div>

                {/* Botón de Acción Principal */}
                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  style={{
                    padding: '15px 20px',
                    fontSize: 15,
                    fontWeight: 700,
                    borderRadius: 14,
                    boxShadow: '0 10px 25px rgba(11, 98, 221, 0.28)',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <Icon name="shield" size={18} /> Confirmar e Inscribirme
                </button>

                {/* Sellos de Confianza */}
                <div style={{ marginTop: 18, textAlign: 'center' }}>
                  <span style={{ fontSize: 11, color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Icon name="check" size={13} /> Activación instantánea en tu cuenta
                  </span>
                </div>
              </aside>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
