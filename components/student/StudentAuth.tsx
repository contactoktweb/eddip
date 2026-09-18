'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { studentService } from '@/lib/supabase/studentService';
import { Icon } from '@/lib/icons';

type AuthMode = 'login' | 'register' | 'reset';

export function StudentAuth() {
  const router = useRouter();
  const { signInStudent, signUpStudent, login } = useDemo();

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetSubmitted, setResetSubmitted] = useState(false);

  // Campos de formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(true);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
    setResetSubmitted(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const cleanEmail = email.trim();
        if (!cleanEmail || !password) {
          setErrorMsg('Por favor ingresa tu correo y contraseña.');
          setLoading(false);
          return;
        }

        const res = await signInStudent(cleanEmail, password);
        if (!res.success) {
          setErrorMsg(res.error || 'Credenciales no válidas. Por favor verifica tu correo y contraseña.');
        } else {
          if (res.role === 'admin' || cleanEmail.toLowerCase().includes('admin')) {
            router.push('/admin');
          } else {
            router.push('/dashboard');
          }
        }
      } else if (mode === 'register') {
        const cleanName = fullName.trim();
        const cleanEmail = email.trim();

        if (!cleanName || !cleanEmail || !password) {
          setErrorMsg('Por favor completa todos los campos obligatorios (*).');
          setLoading(false);
          return;
        }

        if (password.length < 6) {
          setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Las contraseñas no coinciden. Por favor verifícalas.');
          setLoading(false);
          return;
        }

        if (!acceptTerms) {
          setErrorMsg('Debes aceptar los términos y condiciones para registrarte.');
          setLoading(false);
          return;
        }

        const res = await signUpStudent({
          email: cleanEmail,
          password,
          fullName: cleanName,
          documentId: documentId.trim(),
          phone: phone.trim(),
          city: city.trim(),
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Error al registrar la cuenta. Inténtalo nuevamente.');
        } else {
          setSuccessMsg('¡Cuenta de estudiante creada con éxito! Redirigiendo a tu aula virtual...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 1200);
        }
      } else if (mode === 'reset') {
        const cleanEmail = email.trim();
        if (!cleanEmail) {
          setErrorMsg('Por favor ingresa el correo electrónico asociado a tu cuenta.');
          setLoading(false);
          return;
        }

        const res = await studentService.resetPasswordForEmail(cleanEmail);
        if (!res.success) {
          setErrorMsg(res.error || 'No se pudo enviar el correo de recuperación. Inténtalo más tarde.');
        } else {
          setResetSubmitted(true);
        }
      }
    } catch {
      setErrorMsg('Ocurrió un error inesperado al conectar con el servidor. Inténtalo de nuevo.');
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
      {/* Barra superior de navegación y sello de seguridad */}
      <div className="auth-top-bar">
        {mode === 'login' ? (
          <Link href="/" className="auth-back-link" title="Ir a la página de inicio">
            <span className="auth-back-arrow">←</span> Volver al inicio
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => switchMode('login')}
            className="auth-back-link auth-back-btn"
            title="Volver al inicio de sesión"
          >
            <span className="auth-back-arrow">←</span> Iniciar sesión
          </button>
        )}

        <div className="auth-badge-secure" title="Conexión encriptada con certificación institucional">
          <span className="auth-pulse-dot" />
          <span className="auth-badge-text">Campus Virtual Seguro</span>
        </div>
      </div>

      {/* Selector de modo Login / Registro */}
      {mode !== 'reset' && (
        <div className="auth-segmented-tabs" role="tablist" aria-label="Opciones de acceso">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            <Icon name="user" size={16} />
            <span>Iniciar sesión</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => switchMode('register')}
          >
            <Icon name="plus" size={16} />
            <span>Nuevo estudiante</span>
          </button>
        </div>
      )}

      {/* Encabezado dinámico */}
      <div className="auth-header-block">
        <span className="eyebrow">
          {mode === 'login'
            ? 'Portal de Estudiantes'
            : mode === 'register'
            ? 'Matrícula Virtual'
            : 'Recuperación de Cuenta'}
        </span>
        <h2 className="auth-heading">
          {mode === 'login'
            ? 'Inicia sesión en EDDIP'
            : mode === 'register'
            ? 'Crea tu cuenta de estudiante'
            : 'Restablecer contraseña'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Accede a tus asignaturas activas, evaluaciones y certificados oficiales.'
            : mode === 'register'
            ? 'Regístrate para comenzar tu formación en seguridad, derecho y gestión pública.'
            : 'Ingresa tu correo institucional o personal para recibir las instrucciones de acceso seguro.'}
        </p>
      </div>

      {/* Alerta de Error */}
      {errorMsg && (
        <div className="auth-alert auth-alert-error" role="alert">
          <div className="auth-alert-icon">
            <Icon name="close" size={16} />
          </div>
          <div className="auth-alert-text">{errorMsg}</div>
        </div>
      )}

      {/* Alerta de Éxito */}
      {successMsg && (
        <div className="auth-alert auth-alert-success" role="status">
          <div className="auth-alert-icon">
            <Icon name="check" size={16} />
          </div>
          <div className="auth-alert-text">{successMsg}</div>
        </div>
      )}

      {/* Vista de éxito tras enviar solicitud de restablecimiento */}
      {mode === 'reset' && resetSubmitted ? (
        <div className="auth-reset-success-card">
          <div className="auth-reset-icon-wrap">
            <Icon name="mail" size={32} />
          </div>
          <h3 className="auth-reset-title">Enlace de recuperación enviado</h3>
          <p className="auth-reset-desc">
            Hemos enviado un correo a <strong>{email}</strong> con el enlace y las instrucciones para definir una nueva contraseña segura.
          </p>
          <div className="auth-reset-note">
            <Icon name="shield" size={16} />
            <span>Por favor revisa también tu carpeta de correo no deseado o spam. El enlace es válido por 60 minutos.</span>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-full"
            onClick={() => switchMode('login')}
            style={{ marginTop: 20 }}
          >
            Volver a iniciar sesión
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form-fields" noValidate={false}>
          {/* MODO REGISTRO: Nombre completo */}
          {mode === 'register' && (
            <div className="field auth-field">
              <label htmlFor="reg-fullName">Nombre y apellidos completos *</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Icon name="user" size={17} />
                </span>
                <input
                  id="reg-fullName"
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ej. Juan Carlos Rodríguez Peña"
                  className="auth-input"
                  required
                />
              </div>
            </div>
          )}

          {/* MODO REGISTRO: Cédula y Teléfono */}
          {mode === 'register' && (
            <div className="form-row auth-form-row">
              <div className="field auth-field">
                <label htmlFor="reg-doc">Cédula o Documento</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Icon name="card" size={17} />
                  </span>
                  <input
                    id="reg-doc"
                    type="text"
                    value={documentId}
                    onChange={e => setDocumentId(e.target.value)}
                    placeholder="Ej. 1.032.456.789"
                    className="auth-input"
                  />
                </div>
              </div>
              <div className="field auth-field">
                <label htmlFor="reg-phone">Teléfono / WhatsApp</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Icon name="whatsapp" size={17} />
                  </span>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="Ej. 300 123 4567"
                    className="auth-input"
                  />
                </div>
              </div>
            </div>
          )}

          {/* MODO REGISTRO: Ciudad */}
          {mode === 'register' && (
            <div className="field auth-field">
              <label htmlFor="reg-city">Ciudad / Municipio</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Icon name="building" size={17} />
                </span>
                <input
                  id="reg-city"
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Ej. Bogotá D.C."
                  className="auth-input"
                />
              </div>
            </div>
          )}

          {/* CAMPO CORREO (Todos los modos) */}
          <div className="field auth-field">
            <label htmlFor="auth-email">
              {mode === 'reset' ? 'Correo de tu cuenta institucional *' : 'Correo electrónico *'}
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <Icon name="mail" size={17} />
              </span>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="estudiante@correo.com"
                className="auth-input"
                autoComplete="email"
                required
              />
            </div>
          </div>

          {/* CAMPO CONTRASEÑA (Login y Registro) */}
          {mode !== 'reset' && (
            <div className="field auth-field">
              <div className="auth-label-row">
                <label htmlFor="auth-password">
                  {mode === 'register' ? 'Contraseña (mínimo 6 caracteres) *' : 'Contraseña *'}
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => switchMode('reset')}
                    className="auth-forgot-trigger"
                    tabIndex={0}
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </div>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Icon name="lock" size={17} />
                </span>
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="auth-input"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="auth-eye-btn"
                  tabIndex={-1}
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>
          )}

          {/* MODO REGISTRO: Confirmar contraseña */}
          {mode === 'register' && (
            <div className="field auth-field">
              <label htmlFor="reg-confirm-password">Confirmar contraseña *</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon">
                  <Icon name="lock" size={17} />
                </span>
                <input
                  id="reg-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="auth-input"
                  autoComplete="new-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Ocultar confirmación de contraseña' : 'Ver confirmación de contraseña'}
                  className="auth-eye-btn"
                  tabIndex={-1}
                >
                  <Icon name={showConfirmPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </div>
          )}

          {/* CHECKBOXES ADICIONALES */}
          {mode === 'login' && (
            <div className="auth-checkbox-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="auth-checkbox"
                />
                <span>Recordar sesión en este dispositivo</span>
              </label>
            </div>
          )}

          {mode === 'register' && (
            <div className="auth-checkbox-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  className="auth-checkbox"
                  required
                />
                <span>Acepto las políticas de formación y tratamiento de datos de EDDIP.</span>
              </label>
            </div>
          )}

          {/* BOTÓN PRINCIPAL */}
          <button
            type="submit"
            className="btn btn-primary btn-full auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner-sm" />
                {mode === 'login'
                  ? 'Verificando credenciales...'
                  : mode === 'register'
                  ? 'Creando cuenta de estudiante...'
                  : 'Enviando enlace seguro...'}
              </span>
            ) : mode === 'login' ? (
              <>
                <span>Iniciar sesión</span>
                <Icon name="arrow" size={18} />
              </>
            ) : mode === 'register' ? (
              <>
                <span>Registrar cuenta oficial</span>
                <Icon name="check" size={18} />
              </>
            ) : (
              <>
                <span>Enviar enlace de recuperación</span>
                <Icon name="arrow" size={18} />
              </>
            )}
          </button>

          {mode === 'reset' && (
            <button
              type="button"
              className="btn btn-outline btn-full"
              onClick={() => switchMode('login')}
              style={{ marginTop: 4 }}
            >
              Cancelar y volver al inicio de sesión
            </button>
          )}
        </form>
      )}

      {/* ACCESO INSTITUCIONAL DIRECTO */}
      <div className="auth-divider">
        <span className="auth-divider-label">ACCESO INSTITUCIONAL DIRECTO</span>
      </div>

      <div className="auth-quick-access-grid">
        <button
          type="button"
          className="auth-role-card"
          onClick={() => handleDemoAccess('student')}
          title="Acceder como estudiante institucional"
        >
          <div className="auth-role-icon student-role-icon">
            <Icon name="user" size={18} />
          </div>
          <div className="auth-role-info">
            <strong className="auth-role-title">Portal Estudiante</strong>
            <span className="auth-role-desc">Acceso a cursos y certificados</span>
          </div>
          <span className="auth-role-arrow">→</span>
        </button>

        <button
          type="button"
          className="auth-role-card"
          onClick={() => handleDemoAccess('admin')}
          title="Acceder como administrador institucional"
        >
          <div className="auth-role-icon admin-role-icon">
            <Icon name="settings" size={18} />
          </div>
          <div className="auth-role-info">
            <strong className="auth-role-title">Portal Administrador</strong>
            <span className="auth-role-desc">Gestión académica y reportes</span>
          </div>
          <span className="auth-role-arrow">→</span>
        </button>
      </div>

      {/* NOTA INSTITUCIONAL DE SEGURIDAD */}
      <p className="auth-security-footer">
        Campus Virtual EDDIP — Conexión protegida con cifrado SSL de grado institucional. Tus datos personales y académicos se encuentran debidamente custodiados.
      </p>
    </div>
  );
}
