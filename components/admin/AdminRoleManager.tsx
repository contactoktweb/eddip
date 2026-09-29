'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Icon } from '@/lib/icons';
import { adminService } from '@/lib/supabase/adminService';
import type { RegisteredAccount } from '@/lib/supabase/studentService';
import { useDemo } from '@/app/providers';

type RoleFilter = 'all' | 'admin' | 'designer' | 'student';

export function AdminRoleManager() {
  const { user: currentUser } = useDemo();
  const [users, setUsers] = useState<RegisteredAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<RoleFilter>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [updatingEmail, setUpdatingEmail] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modales de confirmación
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: RegisteredAccount;
    newRole: 'student' | 'designer' | 'admin';
  } | null>(null);

  const [userToDelete, setUserToDelete] = useState<RegisteredAccount | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para nuevo usuario en modal
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDocumentId, setNewDocumentId] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'student' | 'designer' | 'admin'>('designer');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Guía de permisos colapsable
  const [showGuide, setShowGuide] = useState(true);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4000);
  }, []);

  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const list = await adminService.getUserAccounts();
      setUsers(list);
    } catch (err) {
      console.error('Error al cargar cuentas de usuarios:', err);
      showToast('No se pudieron sincronizar las cuentas de usuario', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadAccounts();

    const handleRoleUpdate = () => {
      loadAccounts();
    };

    window.addEventListener('eddip_roles_updated', handleRoleUpdate);
    window.addEventListener('eddip_students_updated', handleRoleUpdate);
    window.addEventListener('storage', handleRoleUpdate);

    return () => {
      window.removeEventListener('eddip_roles_updated', handleRoleUpdate);
      window.removeEventListener('eddip_students_updated', handleRoleUpdate);
      window.removeEventListener('storage', handleRoleUpdate);
    };
  }, [loadAccounts]);

  // Contadores de roles
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin').length;
    const designers = users.filter(u => u.role === 'designer').length;
    const students = users.filter(u => !u.role || u.role === 'student').length;
    return { total, admins, designers, students };
  }, [users]);

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.documentId && u.documentId.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.city && u.city.toLowerCase().includes(q));

      if (!matchSearch) return false;

      const userRole = u.role || 'student';
      if (filterRole === 'admin') return userRole === 'admin';
      if (filterRole === 'designer') return userRole === 'designer';
      if (filterRole === 'student') return userRole === 'student';

      return true;
    });
  }, [users, searchTerm, filterRole]);

  // Ejecución directa de cambio de rol
  const applyRoleChange = async (targetUser: RegisteredAccount, targetRole: 'student' | 'designer' | 'admin') => {
    try {
      setUpdatingEmail(targetUser.email);
      const res = await adminService.updateUserRole(targetUser.id || targetUser.email, targetRole);

      if (res.success) {
        setUsers(prev =>
          prev.map(u => (u.email.toLowerCase().trim() === targetUser.email.toLowerCase().trim() ? { ...u, role: targetRole } : u))
        );
        const roleLabel =
          targetRole === 'admin'
            ? 'Administrador'
            : targetRole === 'designer'
            ? 'Diseñador Instruccional'
            : 'Estudiante';
        showToast(`¡Rol de ${targetUser.fullName} actualizado a "${roleLabel}" con éxito!`, 'success');
      } else {
        showToast(res.error || 'Error al actualizar el rol del usuario', 'error');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al cambiar de rol';
      showToast(msg, 'error');
    } finally {
      setUpdatingEmail(null);
      setPendingRoleChange(null);
    }
  };

  // Manejador que detecta si requiere confirmación (ej: auto-degradación de rol del admin activo)
  const handleSelectRole = (targetUser: RegisteredAccount, targetRole: 'student' | 'designer' | 'admin') => {
    if (targetUser.role === targetRole) return;

    const isCurrentActiveAdmin =
      currentUser?.email &&
      currentUser.email.toLowerCase().trim() === targetUser.email.toLowerCase().trim() &&
      targetRole !== 'admin';

    const isLastAdmin = stats.admins <= 1 && targetUser.role === 'admin' && targetRole !== 'admin';

    if (isCurrentActiveAdmin || isLastAdmin) {
      setPendingRoleChange({ user: targetUser, newRole: targetRole });
      return;
    }

    applyRoleChange(targetUser, targetRole);
  };

  // Crear usuario con rol
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const cleanName = newFullName.trim();
    const cleanEmail = newEmail.toLowerCase().trim();
    const cleanDoc = newDocumentId.trim();

    if (!cleanName) {
      setCreateError('Por favor ingresa el nombre completo.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setCreateError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!cleanDoc) {
      setCreateError('El documento de identidad es requerido.');
      return;
    }

    try {
      setCreateLoading(true);
      const res = await adminService.createUserWithRole({
        fullName: cleanName,
        email: cleanEmail,
        documentId: cleanDoc,
        phone: newPhone.trim(),
        city: newCity.trim() || 'Colombia',
        password: newPassword.trim() || 'Eddip2026*',
        role: newRole,
      });

      if (!res.success) {
        setCreateError(res.error || 'No se pudo crear la cuenta.');
        return;
      }

      showToast(`¡Usuario ${cleanName} registrado como ${getRoleBadgeText(newRole)}!`, 'success');
      setShowCreateModal(false);
      setNewFullName('');
      setNewEmail('');
      setNewDocumentId('');
      setNewPhone('');
      setNewCity('');
      setNewPassword('');
      setNewRole('designer');
      await loadAccounts();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado al crear usuario';
      setCreateError(msg);
    } finally {
      setCreateLoading(false);
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await adminService.deleteUserAccount(userToDelete.id || userToDelete.email);
      setUsers(prev => prev.filter(u => u.email !== userToDelete.email));
      showToast(`Usuario ${userToDelete.fullName} eliminado del sistema.`, 'success');
      setUserToDelete(null);
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar la cuenta.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Exportar reporte de roles a CSV
  const handleExportCSV = () => {
    const headers = ['Nombre Completo', 'Correo Electrónico', 'Documento', 'Teléfono', 'Ciudad', 'Rol Asignado', 'Fecha Registro'];
    const rows = filteredUsers.map(u => [
      `"${u.fullName}"`,
      `"${u.email}"`,
      `"${u.documentId || ''}"`,
      `"${u.phone || ''}"`,
      `"${u.city || ''}"`,
      `"${getRoleBadgeText(u.role)}"`,
      `"${u.createdAt || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `roles_usuarios_eddip_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Reporte de roles exportado en formato CSV', 'success');
  };

  function getRoleBadgeText(role?: string) {
    if (role === 'admin') return 'Administrador';
    if (role === 'designer') return 'Diseñador Instruccional';
    return 'Estudiante';
  }

  function getInitials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'US';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Toast Notification Flotante */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 20px',
            background: 'var(--navy)',
            color: '#fff',
            borderRadius: 14,
            boxShadow: '0 14px 34px rgba(10, 31, 68, 0.28)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: 13.5,
            fontWeight: 600,
            animation: 'fadeIn 0.25s ease-out',
            maxWidth: 420,
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--blue)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Icon name={toast.type === 'success' ? 'check' : 'close'} size={14} />
          </span>
          <span style={{ flex: 1, lineHeight: 1.4 }}>{toast.message}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              cursor: 'pointer',
              padding: 4,
            }}
            aria-label="Cerrar notificación"
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}

      {/* Tarjetas de Métricas de Roles (Estilo unificado de la plataforma) */}
      <section aria-label="Métricas de roles institucionales">
        <div className="stats-grid" style={{ marginBottom: 0 }}>
          {/* Total Cuentas */}
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="users" />
            </div>
            <div>
              <span>Total Usuarios</span>
              <strong>{stats.total}</strong>
              <small style={{ color: 'var(--muted)' }}>Cuentas en plataforma</small>
            </div>
          </div>

          {/* Administradores */}
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="shield" />
            </div>
            <div>
              <span>Administradores</span>
              <strong>{stats.admins}</strong>
              <small style={{ color: 'var(--muted)' }}>Control y permisos totales</small>
            </div>
          </div>

          {/* Diseñadores Instruccionales */}
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="edit" />
            </div>
            <div>
              <span>Diseñadores</span>
              <strong>{stats.designers}</strong>
              <small style={{ color: 'var(--muted)' }}>Cursos y lecciones</small>
            </div>
          </div>

          {/* Estudiantes */}
          <div className="stat-card">
            <div className="stat-icon">
              <Icon name="cap" />
            </div>
            <div>
              <span>Estudiantes</span>
              <strong>{stats.students}</strong>
              <small style={{ color: 'var(--muted)' }}>Campus virtual activo</small>
            </div>
          </div>
        </div>
      </section>

      {/* Matriz de Privilegios y Alcance de Roles */}
      <section aria-label="Matriz de privilegios institucionales">
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--line)',
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '16px 20px',
              borderBottom: showGuide ? '1px solid var(--line)' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              cursor: 'pointer',
              background: '#fcfdfd',
            }}
            onClick={() => setShowGuide(v => !v)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'var(--blue-3)',
                  color: 'var(--blue)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name="shield" size={18} />
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                  Matriz de Permisos y Niveles de Acceso Institucional
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--muted)' }}>
                  Conoce qué secciones y facultades operativas tiene cada rol asignado en EDDIP
                </p>
              </div>
            </div>

            <button
              type="button"
              className="icon-btn"
              style={{ width: 32, height: 32, transform: showGuide ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              aria-label={showGuide ? 'Ocultar matriz de permisos' : 'Mostrar matriz de permisos'}
            >
              <Icon name="chevron" size={16} />
            </button>
          </div>

          {showGuide && (
            <div
              style={{
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 16,
                background: '#ffffff',
              }}
            >
              {/* Columna Administrador */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--blue-3)',
                        color: 'var(--blue)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon name="shield" size={15} />
                    </span>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                      Administrador
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'var(--navy)',
                      color: '#ffffff',
                    }}
                  >
                    Control Total
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                  Máximo nivel de autoridad operativa en la plataforma EDDIP.
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <li>Gestión completa de cursos, módulos y lecciones</li>
                  <li>Creación y revisión de evaluaciones</li>
                  <li>Directorio de estudiantes y registro manual</li>
                  <li><strong>Asignación y revocación de roles</strong></li>
                  <li>Gestión y emisión de certificados oficiales</li>
                  <li>Reportes de ventas, ingresos e IVA</li>
                  <li>Editor de contenido web y configuración</li>
                </ul>
              </div>

              {/* Columna Diseñador Instruccional */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--blue-3)',
                        color: 'var(--blue)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon name="edit" size={15} />
                    </span>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                      Diseñador Instruccional
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'var(--blue-3)',
                      color: 'var(--blue)',
                      border: '1px solid var(--blue-4)',
                    }}
                  >
                    Curricular
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                  Especialista pedagógico enfocado en estructurar contenidos formativos.
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <li>Creación y edición de programas de capacitación</li>
                  <li>Organización de módulos, temas y duraciones</li>
                  <li>Carga de videos (YouTube / HTML5) y material de apoyo</li>
                  <li>Subida de infografías e imágenes formativas</li>
                  <li style={{ color: 'var(--muted)' }}>Restringido de ventas y métricas financieras</li>
                  <li style={{ color: 'var(--muted)' }}>Restringido de gestión de roles y estudiantes</li>
                </ul>
              </div>

              {/* Columna Estudiante */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 14,
                  background: '#ffffff',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        background: 'var(--blue-3)',
                        color: 'var(--blue)',
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <Icon name="cap" size={15} />
                    </span>
                    <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>
                      Estudiante
                    </h3>
                  </div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid var(--line)',
                    }}
                  >
                    Participante
                  </span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
                  Usuario matriculado en programas educativos del campus virtual.
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#475569', lineHeight: 1.6 }}>
                  <li>Acceso al campus virtual personal (`/dashboard`)</li>
                  <li>Avance autónomo en el aula interactiva de clases</li>
                  <li>Cuaderno de notas privado sincronizado</li>
                  <li>Presentación de evaluaciones y cuestionarios</li>
                  <li>Descarga y verificación de diplomas con código QR</li>
                  <li style={{ color: 'var(--muted)' }}>Sin acceso a rutas administrativas</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Barra de Filtros, Buscador y Acciones */}
      <section aria-label="Controles de búsqueda y filtros de usuarios">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            background: '#ffffff',
            padding: '16px 20px',
            borderRadius: 16,
            border: '1px solid var(--line)',
          }}
        >
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flex: 1 }}>
            {/* Buscador */}
            <div style={{ position: 'relative', minWidth: 260, maxWidth: 380, flex: 1 }}>
              <input
                type="search"
                placeholder="Buscar por nombre, correo o cédula..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  borderRadius: 10,
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--muted)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <Icon name="search" size={15} />
              </span>
            </div>

            {/* Píldoras de Filtro */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <button
                type="button"
                className={`btn ${filterRole === 'all' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 12px', fontSize: 12 }}
                onClick={() => setFilterRole('all')}
              >
                Todos ({stats.total})
              </button>
              <button
                type="button"
                className={`btn ${filterRole === 'admin' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 12px', fontSize: 12 }}
                onClick={() => setFilterRole('admin')}
              >
                Administradores ({stats.admins})
              </button>
              <button
                type="button"
                className={`btn ${filterRole === 'designer' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 12px', fontSize: 12 }}
                onClick={() => setFilterRole('designer')}
              >
                Diseñadores ({stats.designers})
              </button>
              <button
                type="button"
                className={`btn ${filterRole === 'student' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 12px', fontSize: 12 }}
                onClick={() => setFilterRole('student')}
              >
                Estudiantes ({stats.students})
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{
                fontSize: 13,
                padding: '9px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="plus" size={15} /> Asignar rol a usuario
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={handleExportCSV}
              style={{
                fontSize: 13,
                padding: '9px 16px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Icon name="upload" size={15} /> Exportar CSV
            </button>
          </div>
        </div>
      </section>

      {/* Listado Principal de Usuarios y Selector de Rol */}
      <section aria-label="Directorio y asignación de roles de usuarios">
        {loading ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              background: '#ffffff',
              borderRadius: 16,
              border: '1px solid var(--line)',
              color: 'var(--muted)',
            }}
          >
            <div style={{ display: 'inline-block', width: 32, height: 32, border: '3px solid var(--blue)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: 12 }} />
            <p style={{ margin: 0, fontSize: 14 }}>Sincronizando cuentas con la plataforma...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '50px 24px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--blue-3)',
                color: 'var(--blue)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <Icon name="users" size={24} />
            </div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--navy)', margin: '0 0 6px' }}>
              {searchTerm ? 'No se encontraron usuarios coincidentes' : 'No hay usuarios en este filtro'}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--muted)', maxWidth: 440, margin: '0 auto 18px', lineHeight: 1.5 }}>
              {searchTerm
                ? `No existen cuentas que coincidan con "${searchTerm}". Intenta con otro término o limpia los filtros.`
                : 'Puedes crear un nuevo usuario o cambiar de filtro de rol para ver las cuentas registradas.'}
            </p>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
            >
              <Icon name="plus" size={15} /> Asignar primer rol a usuario
            </button>
          </div>
        ) : (
          <>
            {/* Vista Escritorio / Tablet (Tabla de datos) */}
            <div className="role-desktop-view">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: 240 }}>Usuario</th>
                      <th style={{ minWidth: 190 }}>Identificación & Contacto</th>
                      <th style={{ minWidth: 140 }}>Rol Actual</th>
                      <th style={{ minWidth: 280 }}>Asignar / Cambiar Rol</th>
                      <th style={{ textAlign: 'right', minWidth: 80 }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => {
                      const currentRole = user.role || 'student';
                      const isUpdating = updatingEmail === user.email;
                      const isCurrentActiveUser =
                        currentUser?.email &&
                        currentUser.email.toLowerCase().trim() === user.email.toLowerCase().trim();

                      return (
                        <tr key={user.id || user.email}>
                          {/* Columna Usuario */}
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div
                                className="avatar"
                                style={{
                                  width: 38,
                                  height: 38,
                                  fontSize: 13,
                                  borderRadius: 12,
                                  flexShrink: 0,
                                }}
                              >
                                {getInitials(user.fullName)}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className="table-title" style={{ fontSize: 13.5 }}>
                                    {user.fullName}
                                  </span>
                                  {isCurrentActiveUser && (
                                    <span
                                      style={{
                                        fontSize: 9.5,
                                        fontWeight: 700,
                                        padding: '1px 6px',
                                        borderRadius: 6,
                                        background: 'var(--blue-3)',
                                        color: 'var(--blue)',
                                        border: '1px solid var(--blue-4)',
                                      }}
                                      title="Tu sesión actual"
                                    >
                                      Tú
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
                                  Registrado: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Activo'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Columna Contacto */}
                          <td>
                            <div style={{ fontSize: 12 }}>
                              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{user.email}</div>
                              <div style={{ color: 'var(--muted)', marginTop: 2 }}>
                                {user.documentId ? `C.C. ${user.documentId}` : 'Sin documento'}
                                {user.phone ? ` • ${user.phone}` : ''}
                              </div>
                              {user.city && (
                                <small style={{ color: 'var(--muted)', display: 'block', marginTop: 1 }}>{user.city}</small>
                              )}
                            </div>
                          </td>

                          {/* Columna Rol Actual */}
                          <td>
                            {currentRole === 'admin' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 999,
                                  background: 'var(--navy)',
                                  color: '#ffffff',
                                }}
                              >
                                <Icon name="shield" size={13} />
                                Administrador
                              </span>
                            )}
                            {currentRole === 'designer' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 999,
                                  background: 'var(--blue-3)',
                                  color: 'var(--blue)',
                                  border: '1px solid var(--blue-4)',
                                }}
                              >
                                <Icon name="edit" size={13} />
                                Diseñador
                              </span>
                            )}
                            {currentRole === 'student' && (
                              <span
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: '4px 10px',
                                  borderRadius: 999,
                                  background: '#f1f5f9',
                                  color: '#475569',
                                  border: '1px solid var(--line)',
                                }}
                              >
                                <Icon name="cap" size={13} />
                                Estudiante
                              </span>
                            )}
                          </td>

                          {/* Columna Conmutador / Asignador Rápido de Rol */}
                          <td>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: '#f8fafc',
                                padding: 3,
                                borderRadius: 10,
                                border: '1px solid var(--line)',
                                opacity: isUpdating ? 0.6 : 1,
                                pointerEvents: isUpdating ? 'none' : 'auto',
                                transition: 'opacity 0.2s',
                              }}
                            >
                              {/* Opción Administrador */}
                              <button
                                type="button"
                                onClick={() => handleSelectRole(user, 'admin')}
                                title="Asignar rol de Administrador"
                                aria-label={`Asignar rol Administrador a ${user.fullName}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 7,
                                  border: 'none',
                                  fontSize: 11.5,
                                  fontWeight: currentRole === 'admin' ? 700 : 500,
                                  cursor: 'pointer',
                                  background: currentRole === 'admin' ? 'var(--blue)' : 'transparent',
                                  color: currentRole === 'admin' ? '#ffffff' : 'var(--muted)',
                                  boxShadow: currentRole === 'admin' ? '0 1px 4px rgba(32, 80, 201, 0.25)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Icon name="shield" size={12} />
                                Admin
                              </button>

                              {/* Opción Diseñador */}
                              <button
                                type="button"
                                onClick={() => handleSelectRole(user, 'designer')}
                                title="Asignar rol de Diseñador Instruccional"
                                aria-label={`Asignar rol Diseñador a ${user.fullName}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 7,
                                  border: 'none',
                                  fontSize: 11.5,
                                  fontWeight: currentRole === 'designer' ? 700 : 500,
                                  cursor: 'pointer',
                                  background: currentRole === 'designer' ? 'var(--blue)' : 'transparent',
                                  color: currentRole === 'designer' ? '#ffffff' : 'var(--muted)',
                                  boxShadow: currentRole === 'designer' ? '0 1px 4px rgba(32, 80, 201, 0.25)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Icon name="edit" size={12} />
                                Diseñador
                              </button>

                              {/* Opción Estudiante */}
                              <button
                                type="button"
                                onClick={() => handleSelectRole(user, 'student')}
                                title="Asignar rol de Estudiante"
                                aria-label={`Asignar rol Estudiante a ${user.fullName}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  padding: '5px 10px',
                                  borderRadius: 7,
                                  border: 'none',
                                  fontSize: 11.5,
                                  fontWeight: currentRole === 'student' ? 700 : 500,
                                  cursor: 'pointer',
                                  background: currentRole === 'student' ? 'var(--blue)' : 'transparent',
                                  color: currentRole === 'student' ? '#ffffff' : 'var(--muted)',
                                  boxShadow: currentRole === 'student' ? '0 1px 4px rgba(32, 80, 201, 0.25)' : 'none',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Icon name="cap" size={12} />
                                Estudiante
                              </button>
                            </div>
                          </td>

                          {/* Columna Acciones */}
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6, justifyContent: 'flex-end' }}>
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => setUserToDelete(user)}
                                title={`Eliminar cuenta de ${user.fullName}`}
                                aria-label={`Eliminar cuenta de ${user.fullName}`}
                                style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  color: 'var(--muted)',
                                  border: '1px solid var(--line)',
                                  background: '#fff',
                                }}
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Vista Móvil: Tarjetas Táctiles Accesibles (Regla 10-15) */}
            <div className="role-mobile-view">
              {filteredUsers.map(user => {
                const currentRole = user.role || 'student';
                const isUpdating = updatingEmail === user.email;
                const isCurrentActiveUser =
                  currentUser?.email &&
                  currentUser.email.toLowerCase().trim() === user.email.toLowerCase().trim();

                return (
                  <div key={`mob-${user.id || user.email}`} className="role-user-card">
                    {/* Encabezado del usuario */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          className="avatar"
                          style={{
                            width: 40,
                            height: 40,
                            fontSize: 13,
                            borderRadius: 12,
                            flexShrink: 0,
                          }}
                        >
                          {getInitials(user.fullName)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <strong style={{ fontSize: 14, color: 'var(--navy)' }}>{user.fullName}</strong>
                            {isCurrentActiveUser && (
                              <span
                                style={{
                                  fontSize: 9.5,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 6,
                                  background: 'var(--blue-3)',
                                  color: 'var(--blue)',
                                  border: '1px solid var(--blue-4)',
                                }}
                              >
                                Tú
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--muted)' }}>{user.email}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => setUserToDelete(user)}
                        aria-label={`Eliminar cuenta de ${user.fullName}`}
                        style={{ width: 34, height: 34, borderRadius: 8, color: 'var(--muted)', border: '1px solid var(--line)' }}
                      >
                        <Icon name="trash" size={15} />
                      </button>
                    </div>

                    {/* Ficha rápida de contacto */}
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px 14px',
                        fontSize: 12,
                        color: 'var(--muted)',
                        background: '#f8fafc',
                        padding: '9px 12px',
                        borderRadius: 10,
                      }}
                    >
                      {user.documentId && <span><strong>C.C.:</strong> {user.documentId}</span>}
                      {user.phone && <span><strong>Tel:</strong> {user.phone}</span>}
                      {user.city && <span><strong>Ciudad:</strong> {user.city}</span>}
                      <span><strong>Registro:</strong> {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Activo'}</span>
                    </div>

                    {/* Asignación táctil de rol */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Asignar Rol:
                        </span>
                        {currentRole === 'admin' && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'var(--navy)',
                              color: '#ffffff',
                            }}
                          >
                            Administrador
                          </span>
                        )}
                        {currentRole === 'designer' && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: 'var(--blue-3)',
                              color: 'var(--blue)',
                              border: '1px solid var(--blue-4)',
                            }}
                          >
                            Diseñador
                          </span>
                        )}
                        {currentRole === 'student' && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: 999,
                              background: '#f1f5f9',
                              color: '#475569',
                              border: '1px solid var(--line)',
                            }}
                          >
                            Estudiante
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: 6,
                          opacity: isUpdating ? 0.6 : 1,
                          pointerEvents: isUpdating ? 'none' : 'auto',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleSelectRole(user, 'admin')}
                          style={{
                            minHeight: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            borderRadius: 10,
                            border: currentRole === 'admin' ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                            background: currentRole === 'admin' ? 'var(--blue)' : '#ffffff',
                            color: currentRole === 'admin' ? '#ffffff' : 'var(--muted)',
                            fontWeight: currentRole === 'admin' ? 700 : 500,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          <Icon name="shield" size={13} />
                          <span>Admin</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectRole(user, 'designer')}
                          style={{
                            minHeight: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            borderRadius: 10,
                            border: currentRole === 'designer' ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                            background: currentRole === 'designer' ? 'var(--blue)' : '#ffffff',
                            color: currentRole === 'designer' ? '#ffffff' : 'var(--muted)',
                            fontWeight: currentRole === 'designer' ? 700 : 500,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          <Icon name="edit" size={13} />
                          <span>Diseñador</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSelectRole(user, 'student')}
                          style={{
                            minHeight: 44,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 5,
                            borderRadius: 10,
                            border: currentRole === 'student' ? '1.5px solid var(--blue)' : '1px solid var(--line)',
                            background: currentRole === 'student' ? 'var(--blue)' : '#ffffff',
                            color: currentRole === 'student' ? '#ffffff' : 'var(--muted)',
                            fontWeight: currentRole === 'student' ? 700 : 500,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          <Icon name="cap" size={13} />
                          <span>Estudiante</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Modal: Asignar Rol a Nuevo Usuario */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-role-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 31, 68, 0.65)',
            backdropFilter: 'blur(5px)',
            zIndex: 999,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
            overflowY: 'auto',
          }}
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="panel"
            style={{
              width: 'min(580px, 100%)',
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 20,
              border: '1px solid var(--line)',
              padding: 28,
              boxShadow: '0 20px 45px -12px rgba(10, 31, 68, 0.3)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <span className="eyebrow" style={{ margin: 0 }}>Control de Acceso</span>
                <h2 id="modal-role-title" style={{ fontSize: 21, margin: '4px 0 0', color: 'var(--navy)' }}>
                  Asignar Rol a Usuario
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
                  Crea o registra una cuenta con permisos inmediatos de Diseñador, Administrador o Estudiante.
                </p>
              </div>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowCreateModal(false)}
                aria-label="Cerrar modal de asignación"
                style={{ width: 36, height: 36 }}
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Mensaje de Error */}
            {createError && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 12,
                  background: '#fff0f1',
                  border: '1px solid #ffd0d4',
                  color: 'var(--red)',
                  fontSize: 13,
                  marginBottom: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Icon name="close" size={16} />
                <span>{createError}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tarjetas de Selección de Rol */}
              <div>
                <label style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: 'var(--navy)', marginBottom: 8 }}>
                  Selecciona el Rol a Asignar *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  {/* Diseñador */}
                  <div
                    onClick={() => setNewRole('designer')}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: newRole === 'designer' ? '2px solid var(--blue)' : '1px solid var(--line)',
                      background: newRole === 'designer' ? 'var(--blue-3)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: newRole === 'designer' ? 'var(--blue)' : 'var(--navy)' }}>
                      <Icon name="edit" size={16} />
                      <strong style={{ fontSize: 13 }}>Diseñador</strong>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.3 }}>
                      Gestión de cursos y lecciones
                    </span>
                  </div>

                  {/* Administrador */}
                  <div
                    onClick={() => setNewRole('admin')}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: newRole === 'admin' ? '2px solid var(--blue)' : '1px solid var(--line)',
                      background: newRole === 'admin' ? 'var(--blue-3)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: newRole === 'admin' ? 'var(--blue)' : 'var(--navy)' }}>
                      <Icon name="shield" size={16} />
                      <strong style={{ fontSize: 13 }}>Administrador</strong>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.3 }}>
                      Control total de plataforma
                    </span>
                  </div>

                  {/* Estudiante */}
                  <div
                    onClick={() => setNewRole('student')}
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      border: newRole === 'student' ? '2px solid var(--blue)' : '1px solid var(--line)',
                      background: newRole === 'student' ? 'var(--blue-3)' : '#ffffff',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: newRole === 'student' ? 'var(--blue)' : 'var(--navy)' }}>
                      <Icon name="cap" size={16} />
                      <strong style={{ fontSize: 13 }}>Estudiante</strong>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.3 }}>
                      Campus virtual y exámenes
                    </span>
                  </div>
                </div>
              </div>

              {/* Nombre Completo */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Nombre y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Carmen Elena Vásquez"
                  value={newFullName}
                  onChange={e => setNewFullName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
              </div>

              {/* Cédula y Correo */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Documento de Identidad (C.C.) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1.098.765.432"
                    value={newDocumentId}
                    onChange={e => setNewDocumentId(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="usuario@eddip.edu.co"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Teléfono y Ciudad */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Teléfono / WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    placeholder="Ej. 312 345 6789"
                    value={newPhone}
                    onChange={e => setNewPhone(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                    Ciudad (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Bogotá D.C."
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1px solid var(--line)',
                      fontSize: 13,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Contraseña temporal */}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>
                  Contraseña Temporal de Acceso
                </label>
                <input
                  type="text"
                  placeholder="Por defecto: Eddip2026*"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1px solid var(--line)',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block', marginTop: 4 }}>
                  El usuario podrá ingresar con esta contraseña y modificarla desde su perfil.
                </span>
              </div>

              {/* Botones de Acción */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 12, paddingTop: 16, borderTop: '1px solid var(--line)' }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={createLoading}
                  style={{ padding: '9px 18px', fontSize: 13 }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createLoading}
                  style={{ padding: '9px 20px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Icon name="check" size={15} />
                  {createLoading ? 'Asignando rol...' : 'Guardar y Asignar Rol'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Advertencia para Cambio de Rol Crítico (Auto-democión o último admin) */}
      {pendingRoleChange && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 31, 68, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setPendingRoleChange(null)}
        >
          <div
            className="panel"
            style={{
              width: 'min(480px, 100%)',
              background: '#ffffff',
              borderRadius: 20,
              padding: 26,
              boxShadow: '0 20px 45px -12px rgba(10, 31, 68, 0.35)',
              border: '1px solid var(--line)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'var(--blue-3)',
                color: 'var(--blue)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 0 16px',
              }}
            >
              <Icon name="shield" size={24} />
            </div>

            <h3 id="confirm-dialog-title" style={{ fontSize: 18, color: 'var(--navy)', margin: '0 0 8px', fontWeight: 800 }}>
              ¿Confirmar cambio de rol sensible?
            </h3>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 18px' }}>
              Estás modificando el rol de{' '}
              <strong>{pendingRoleChange.user.fullName}</strong> ({pendingRoleChange.user.email}) a{' '}
              <span style={{ fontWeight: 700, color: 'var(--navy)' }}>{getRoleBadgeText(pendingRoleChange.newRole)}</span>.
              <br />
              <br />
              {currentUser?.email && currentUser.email.toLowerCase().trim() === pendingRoleChange.user.email.toLowerCase().trim() ? (
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                  Atención: Esta es tu sesión activa. Si cambias tu rol de Administrador a Diseñador o Estudiante, perderás el acceso a este panel de roles.
                </span>
              ) : (
                <span>El usuario tendrá los nuevos privilegios en su próxima acción.</span>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPendingRoleChange(null)}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => applyRoleChange(pendingRoleChange.user, pendingRoleChange.newRole)}
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                Sí, cambiar rol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {userToDelete && (
        <div
          role="alertdialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10, 31, 68, 0.7)',
            backdropFilter: 'blur(5px)',
            zIndex: 1000,
            display: 'grid',
            placeItems: 'center',
            padding: 16,
          }}
          onClick={() => setUserToDelete(null)}
        >
          <div
            className="panel"
            style={{
              width: 'min(440px, 100%)',
              background: '#ffffff',
              borderRadius: 20,
              padding: 26,
              boxShadow: '0 20px 45px -12px rgba(10, 31, 68, 0.35)',
              border: '1px solid var(--line)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: '#fff0f1',
                color: 'var(--red)',
                display: 'grid',
                placeItems: 'center',
                margin: '0 0 16px',
              }}
            >
              <Icon name="trash" size={24} />
            </div>

            <h3 style={{ fontSize: 18, color: 'var(--navy)', margin: '0 0 8px', fontWeight: 800 }}>
              ¿Eliminar cuenta de usuario?
            </h3>

            <p style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.5, margin: '0 0 20px' }}>
              ¿Estás seguro de que deseas eliminar a{' '}
              <strong>{userToDelete.fullName}</strong> ({userToDelete.email})?
              Esta acción revocará el acceso al sistema.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                style={{ padding: '8px 16px', fontSize: 13 }}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDeleteUser}
                disabled={isDeleting}
                style={{ padding: '8px 18px', fontSize: 13 }}
              >
                {isDeleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
