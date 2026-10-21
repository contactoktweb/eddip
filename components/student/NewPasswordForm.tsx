'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@/lib/icons';
import { studentService } from '@/lib/supabase/studentService';

type Props = {
  token: string;
  onDone: (message: string) => void;
  onRequestNewLink: () => void;
};

const MIN_PASSWORD_LENGTH = 6;

export function NewPasswordForm({ token, onDone, onRequestNewLink }: Props) {
  const [status, setStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    studentService.validatePasswordResetToken(token).then(valid => {
      if (mounted) setStatus(valid ? 'valid' : 'invalid');
    });
    return () => {
      mounted = false;
    };
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setSaving(true);
    const result = await studentService.confirmPasswordReset(token, password);
    setSaving(false);

    if (result.success) {
      onDone('¡Contraseña actualizada! Ya puedes iniciar sesión con tu nueva contraseña.');
    } else {
      setError(result.error);
    }
  };

  if (status === 'checking') {
    return (
      <div className="auth-reset-success-card" aria-busy="true">
        <span className="auth-spinner-sm" aria-hidden="true" />
        <p className="auth-reset-desc">Verificando el enlace de recuperación…</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="auth-reset-success-card" role="alert">
        <div className="auth-reset-icon-wrap">
          <Icon name="alert" size={32} />
        </div>
        <h3 className="auth-reset-title">El enlace ya no es válido</h3>
        <p className="auth-reset-desc">
          Los enlaces de recuperación vencen a los 60 minutos y solo pueden usarse una vez. Solicita uno nuevo para continuar.
        </p>
        <button type="button" className="btn btn-primary btn-full" onClick={onRequestNewLink} style={{ marginTop: 20 }}>
          Solicitar un nuevo enlace
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form-fields" noValidate>
      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <div className="auth-alert-icon">
            <Icon name="close" size={16} />
          </div>
          <div className="auth-alert-text">{error}</div>
        </div>
      )}

      <div className="field auth-field">
        <label htmlFor="new-password">Nueva contraseña (mínimo 6 caracteres) *</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">
            <Icon name="lock" size={17} />
          </span>
          <input
            id="new-password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="auth-input auth-input-password"
            autoComplete="new-password"
            placeholder="Escribe tu nueva contraseña"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            className="auth-eye-btn"
          >
            <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
          </button>
        </div>
      </div>

      <div className="field auth-field">
        <label htmlFor="new-password-confirm">Confirmar nueva contraseña *</label>
        <div className="auth-input-wrap">
          <span className="auth-input-icon">
            <Icon name="lock" size={17} />
          </span>
          <input
            id="new-password-confirm"
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="auth-input auth-input-password"
            autoComplete="new-password"
            placeholder="Repite tu nueva contraseña"
            required
          />
        </div>
      </div>

      <button type="submit" className="btn btn-primary btn-full auth-submit-btn" disabled={saving}>
        {saving ? (
          <span className="auth-btn-loading">
            <span className="auth-spinner-sm" />
            Guardando nueva contraseña...
          </span>
        ) : (
          <>
            <span>Guardar nueva contraseña</span>
            <Icon name="check" size={18} />
          </>
        )}
      </button>
    </form>
  );
}
