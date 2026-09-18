'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { Icon } from '@/lib/icons';

export function StudentAuth() {
  const router = useRouter();
  const { signInStudent, signUpStudent, login } = useDemo();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Campos de formulario
  const [email, setEmail] = useState('sebastian@demo.eddip.com');
  const [password, setPassword] = useState('demo123');
  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await signInStudent(email, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Error al iniciar sesión. Verifica tus datos.');
        } else {
          if (res.role === 'admin' || email.toLowerCase().includes('admin')) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      } else {
        if (!fullName.trim() || !email.trim() || !password.trim()) {
          setErrorMsg('Por favor completa todos los campos obligatorios.');
          setLoading(false);
          return;
        }

        const res = await signUpStudent({
          email,
          password,
          fullName,
          documentId,
          phone,
          city,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Error al registrar la cuenta.');
        } else {
          setSuccessMsg('¡Cuenta creada exitosamente en Supabase! Ingresando al aula...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1200);
        }
      }
    } catch {
      setErrorMsg('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = (role: 'student' | 'admin') => {
    login(role);
    router.push(role === 'admin' ? '/admin' : '/dashboard');
  };

  return (
    <div className="auth-form-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Link href="/" className="text-link" style={{ fontSize: 13 }}>
          ← Volver al inicio
        </Link>
        <span className="cover-chip" style={{ background: '#eef4ff', color: '#0F59DF' }}>
          Conectado a Supabase
        </span>
      </div>

      <span className="eyebrow">Portal de Estudiantes</span>
      <h2 style={{ fontSize: 28, marginBottom: 8 }}>
        {mode === 'login' ? 'Inicia sesión en EDDIP' : 'Crea tu cuenta de estudiante'}
      </h2>
      <p style={{ color: '#5b6c81', fontSize: 14, marginBottom: 22 }}>
        {mode === 'login'
          ? 'Accede a tus cursos activos, evaluaciones y certificaciones oficiales.'
          : 'Regístrate para comenzar tu formación en seguridad, derecho y gestión pública.'}
      </p>

      {/* Tabs de modo */}
      <div className="auth-tabs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 22 }}>
        <button
          type="button"
          className={`btn ${mode === 'login' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => {
            setMode('login');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          style={{ padding: '10px 14px', fontSize: 13 }}
        >
          Ya tengo cuenta
        </button>
        <button
          type="button"
          className={`btn ${mode === 'register' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => {
            setMode('register');
            setErrorMsg(null);
            setSuccessMsg(null);
          }}
          style={{ padding: '10px 14px', fontSize: 13 }}
        >
          Nuevo estudiante
        </button>
      </div>

      {errorMsg && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: '#fff1f2',
            color: '#dc2626',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="close" size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            padding: '12px 14px',
            borderRadius: 10,
            background: '#ecfdf5',
            color: '#059669',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="check" size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {mode === 'register' && (
          <>
            <div className="field">
              <label htmlFor="fullName">Nombre y apellidos completos *</label>
              <input
                id="fullName"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Ej. Juan Carlos Rodríguez"
                required
              />
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="field">
                <label htmlFor="documentId">Cédula o Documento</label>
                <input
                  id="documentId"
                  value={documentId}
                  onChange={e => setDocumentId(e.target.value)}
                  placeholder="Ej. 1.032.456.789"
                />
              </div>
              <div className="field">
                <label htmlFor="phone">Teléfono / Móvil</label>
                <input
                  id="phone"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. 300 123 4567"
                  type="tel"
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="city">Ciudad / Municipio</label>
              <input
                id="city"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Ej. Bogotá D.C."
              />
            </div>
          </>
        )}

        <div className="field">
          <label htmlFor="email">Correo electrónico *</label>
          <input
            id="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="estudiante@correo.com"
            type="email"
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Contraseña *</label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              type={showPassword ? 'text' : 'password'}
              style={{ width: '100%', paddingRight: 40 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              style={{
                position: 'absolute',
                right: 12,
                background: 'transparent',
                border: 0,
                color: '#8b9bb4',
                cursor: 'pointer',
              }}
            >
              <Icon name={showPassword ? 'close' : 'eye'} size={18} />
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={loading}
          style={{ marginTop: 6, padding: '13px' }}
        >
          {loading ? (
            <span>Conectando con Supabase...</span>
          ) : mode === 'login' ? (
            <>
              Iniciar sesión <Icon name="arrow" />
            </>
          ) : (
            <>
              Registrar cuenta <Icon name="check" />
            </>
          )}
        </button>
      </form>

      {/* Acceso demo rápido */}
      <div className="demo-separator" style={{ margin: '24px 0 16px', textAlign: 'center' }}>
        ACCESOS RÁPIDOS DE DEMOSTRACIÓN
      </div>

      <div className="demo-buttons" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          type="button"
          className="btn btn-soft"
          onClick={() => handleDemoAccess('student')}
        >
          <Icon name="user" /> Estudiante Demo
        </button>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => handleDemoAccess('admin')}
        >
          <Icon name="settings" /> Administrador Demo
        </button>
      </div>

      <p className="form-note" style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#8899aa' }}>
        Autenticación conectada a Supabase Auth. También puedes usar los accesos demo inmediatos para navegar todas las áreas.
      </p>
    </div>
  );
}
