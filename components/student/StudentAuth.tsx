'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useDemo } from '@/app/providers';
import { EMAIL_NOT_CONFIRMED_ERROR, studentService } from '@/lib/supabase/studentService';
import { Icon } from '@/lib/icons';
import { notifyStudent } from '@/lib/notifications';
import { LEGAL_DOCUMENT_ROUTES } from '@/lib/legalDocuments';
import { NewPasswordForm } from './NewPasswordForm';

type AuthMode = 'login' | 'register' | 'reset' | 'new-password';

export function StudentAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const modeParam = searchParams.get('mode');
  const resetToken = searchParams.get('token');
  const { signInStudent, signUpStudent } = useDemo();

  const [mode, setMode] = useState<AuthMode>(() => {
    if (modeParam === 'register') return 'register';
    if (modeParam === 'reset') return 'reset';
    if (modeParam === 'new-password' && resetToken) return 'new-password';
    return 'login';
  });

  useEffect(() => {
    if (modeParam === 'register' || modeParam === 'reset' || modeParam === 'login') {
      setMode(modeParam);
    } else if (modeParam === 'new-password' && resetToken) {
      setMode('new-password');
    }
  }, [modeParam, resetToken]);

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
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [resendingVerification, setResendingVerification] = useState(false);

  const handleResendVerification = async () => {
    setResendingVerification(true);
    const res = await studentService.resendVerificationEmail(email);
    setResendingVerification(false);
    if (res.success) {
      setErrorMsg(null);
      setSuccessMsg(`Te enviamos el correo de verificación a ${email.trim()}. Abre el enlace para activar tu cuenta; revisa también la carpeta de spam.`);
    } else {
      setErrorMsg(res.error);
    }
  };

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
          setSuccessMsg('¡Inicio de sesión exitoso! Redirigiendo a tu cuenta...');
          setTimeout(() => {
            if (res.role === 'admin') {
              router.push('/admin');
            } else if (res.role === 'designer') {
              router.push('/admin/cursos');
            } else if (redirectParam) {
              router.push(redirectParam);
            } else {
              router.push('/dashboard');
            }
          }, 400);
        }
      } else if (mode === 'register') {
        const cleanName = fullName.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanDoc = documentId.trim();

        if (!cleanName || !cleanEmail || !cleanDoc || !password) {
          setErrorMsg('Por favor completa todos los campos obligatorios (*).');
          setLoading(false);
          return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
          setErrorMsg('Por favor ingresa un correo electrónico válido (ejemplo: usuario@correo.com).');
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
          documentId: cleanDoc,
          phone: phone.trim(),
          city: city.trim(),
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Error al registrar la cuenta. Inténtalo nuevamente.');
        } else {
          const destination = redirectParam || '/dashboard';
          notifyStudent({ type: 'welcome', email: cleanEmail });

          setSuccessMsg(
            redirectParam
              ? '¡Cuenta creada con éxito! Redirigiendo a tu matrícula de curso...'
              : '¡Cuenta de estudiante creada con éxito! Redirigiendo a tu panel de acceso...'
          );
          setTimeout(() => {
            router.push(destination);
          }, 900);
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

  return (
    <div className="auth-form-wrapper">
      {/* Banner explicativo de requerimiento de registro para pago */}
      {redirectParam && (
        <div
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20,
            fontSize: 13,
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#dbeafe',
              color: '#1d4ed8',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name="lock" size={18} />
          </div>
          <div>
            <strong style={{ display: 'block', color: '#1e3a8a', fontSize: 13 }}>
              Registro Requerido para Pago de Curso
            </strong>
            <span style={{ fontSize: 12, color: '#2563eb' }}>
              Para matricularte oficialmente y habilitar el pago de tu curso, primero debes iniciar sesión o crear tu cuenta de estudiante.
            </span>
          </div>
        </div>
      )}

      {/* Barra superior de navegación */}
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
        <div className="auth-badge-secure">
          <span className="auth-pulse-dot" />
          <span>Acceso Seguro SSL</span>
        </div>
      </div>

      {/* Selector de modo Login / Registro */}
      {(mode === 'login' || mode === 'register') && (
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
            <span>Crear cuenta</span>
          </button>
        </div>
      )}

      {/* Encabezado dinámico */}
      <div className="auth-header-block">
        <span className="eyebrow">
          {mode === 'login'
            ? 'Portal Institucional'
            : mode === 'register'
            ? 'Registro en Plataforma'
            : 'Recuperación de Cuenta'}
        </span>
        <h2 className="auth-heading">
          {mode === 'login'
            ? 'Inicia sesión en EDDIP'
            : mode === 'register'
            ? 'Crea tu cuenta institucional'
            : mode === 'new-password'
            ? 'Crea tu nueva contraseña'
            : 'Restablecer contraseña'}
        </h2>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Accede a tus asignaturas activas, evaluaciones y certificados oficiales.'
            : mode === 'register'
            ? 'Completa tus datos para crear tu cuenta de estudiante y acceder a tus cursos.'
            : mode === 'new-password'
            ? 'Define una contraseña segura para volver a ingresar a tu cuenta.'
            : 'Ingresa el correo con el que te registraste y te enviaremos un enlace para crear una nueva contraseña.'}
        </p>
      </div>

      {/* Cuenta sin confirmar: ofrece reenviar el correo de verificación */}
      {errorMsg === EMAIL_NOT_CONFIRMED_ERROR ? (
        <div className="auth-verify-card" role="alert">
          <div className="auth-verify-head">
            <span className="auth-verify-icon" aria-hidden="true">
              <Icon name="mail" size={20} />
            </span>
            <div>
              <strong>Confirma tu correo para continuar</strong>
              <p>
                Tu cuenta ya está creada, pero falta verificar <span className="auth-verify-email">{email.trim()}</span>.
                Te enviaremos un enlace para activarla.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-full auth-verify-btn"
            onClick={handleResendVerification}
            disabled={resendingVerification}
          >
            {resendingVerification ? (
              <span className="auth-btn-loading">
                <span className="auth-spinner-sm" />
                Enviando correo...
              </span>
            ) : (
              <>
                <Icon name="mail" size={16} />
                <span>Reenviar correo de verificación</span>
              </>
            )}
          </button>
        </div>
      ) : (
        errorMsg && (
          <div className="auth-alert auth-alert-error" role="alert">
            <div className="auth-alert-icon">
              <Icon name="close" size={16} />
            </div>
            <div className="auth-alert-text">{errorMsg}</div>
          </div>
        )
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

      {/* Formulario de nueva contraseña desde el enlace del correo */}
      {mode === 'new-password' && resetToken ? (
        <NewPasswordForm
          token={resetToken}
          onDone={message => {
            switchMode('login');
            setSuccessMsg(message);
            router.replace('/login');
          }}
          onRequestNewLink={() => {
            switchMode('reset');
            router.replace('/login?mode=reset');
          }}
        />
      ) : /* Vista de éxito tras enviar solicitud de restablecimiento */
      mode === 'reset' && resetSubmitted ? (
        <div className="auth-reset-success-card">
          <div className="auth-reset-icon-wrap">
            <Icon name="mail" size={32} />
          </div>
          <h3 className="auth-reset-title">Enlace de recuperación enviado</h3>
          <p className="auth-reset-desc">
            Si <strong>{email}</strong> está registrado en EDDIP, recibirás en unos minutos un correo con el enlace para definir una nueva contraseña.
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
                <label htmlFor="reg-doc">Cédula o Documento de Identidad *</label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Icon name="card" size={17} />
                  </span>
                  <input
                    id="reg-doc"
                    type="text"
                    required
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
                  className="auth-input auth-input-password"
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
                  className="auth-input auth-input-password"
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
                <span>
                  Acepto los{' '}
                  <Link href={LEGAL_DOCUMENT_ROUTES.termsConditions} target="_blank">términos y condiciones</Link> y la{' '}
                  <Link href={LEGAL_DOCUMENT_ROUTES.privacyPolicy} target="_blank">política de tratamiento de datos</Link> de EDDIP.
                </span>
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
                  ? 'Registrando cuenta de estudiante...'
                  : 'Enviando enlace seguro...'}
              </span>
            ) : mode === 'login' ? (
              <>
                <span>Iniciar sesión</span>
                <Icon name="arrow" size={18} />
              </>
            ) : mode === 'register' ? (
              <>
                <span>Crear cuenta de estudiante</span>
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

    </div>
  );
}
