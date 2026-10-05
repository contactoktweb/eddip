'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Icon } from '@/lib/icons';
import { Logo } from './Logo';
import { useDemo } from '@/app/providers';

const studentNav = [
  ['/dashboard', 'Inicio', 'home'],
  ['/dashboard/cursos', 'Mis cursos', 'book'],
  ['/dashboard/certificados', 'Certificados', 'award'],
  ['/dashboard/perfil', 'Perfil', 'user'],
] as const;

const adminNav = [
  ['/admin', 'Dashboard', 'grid'],
  ['/admin/cursos', 'Cursos', 'book'],
  ['/admin/evaluaciones', 'Evaluaciones', 'file'],
  ['/admin/estudiantes', 'Estudiantes', 'users'],
  ['/admin/roles', 'Roles y Permisos', 'shield'],
  ['/admin/certificados', 'Certificados', 'award'],
  ['/admin/ventas', 'Ventas', 'dollar'],
  ['/admin/contenido', 'Contenido web', 'edit'],
] as const;

const designerNav = [
  ['/admin/cursos', 'Cursos y Lecciones', 'book'],
  ['/admin/evaluaciones', 'Evaluaciones', 'file'],
] as const;

export function DashboardShell({
  kind,
  children,
}: {
  kind: 'student' | 'admin';
  children: React.ReactNode;
}) {
  const path = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { logout, user, role } = useDemo();

  const isDesigner = role === 'designer';
  const isStudent = kind === 'student';

  const items = isStudent ? studentNav : (isDesigner ? designerNav : adminNav);
  const initials = isDesigner
    ? 'DI'
    : kind === 'admin'
    ? 'AD'
    : user.name
        .split(' ')
        .filter(Boolean)
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'ES';

  const profileHref = isStudent ? '/dashboard/perfil' : (isDesigner ? '/admin/cursos' : '/admin');

  // Control estricto de acceso para Diseñador (únicamente crear y actualizar cursos)
  const isDesignerAllowedPath =
    path === '/admin/cursos' ||
    path.startsWith('/admin/cursos/') ||
    path === '/admin/evaluaciones' ||
    path.startsWith('/admin/evaluaciones/');

  const isDesignerBlocked = isDesigner && kind === 'admin' && !isDesignerAllowedPath;
  const isStudentBlocked = role === 'student' && kind === 'admin';
  const isAccessBlocked = isDesignerBlocked || isStudentBlocked;

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="dash-layout">
      {/* Sidebar navegable */}
      <aside className={open ? 'dash-sidebar open' : 'dash-sidebar'} aria-label="Menú principal">
        <div className="dash-logo">
          <Logo />
        </div>

        <Link
          href={profileHref}
          className="dash-profile"
          style={{ textDecoration: 'none', color: 'inherit' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="avatar"
            style={isDesigner ? { background: '#fef3c7', color: '#d97706' } : {}}
          >
            {initials}
          </div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {isDesigner ? 'Diseñador Instruccional' : (kind === 'admin' ? 'Administrador EDDIP' : user.name)}
            </strong>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#059669',
                  display: 'inline-block',
                }}
              />
              {isDesigner ? 'Diseño de Cursos' : (kind === 'admin' ? 'Control de plataforma' : 'Estudiante activo')}
            </span>
          </div>
        </Link>

        <nav style={{ flex: 1 }}>
          {items.map(([href, label, icon]) => {
            const isActive =
              path === href || (href !== '/admin' && href !== '/dashboard' && path.startsWith(href));

            return (
              <Link
                key={href}
                className={isActive ? 'active' : ''}
                href={href}
                onClick={() => setOpen(false)}
              >
                <Icon name={icon} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="sidebar-logout"
          onClick={handleLogout}
          aria-label="Cerrar sesión"
        >
          <Icon name="logout" />
          Cerrar sesión
        </button>
      </aside>

      {/* Área principal */}
      <main className="dash-main" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: 0 }}>
        {/* Barra superior de navegación / Dashboard Header */}
        <header className="dash-topbar">
          <div className="dash-topbar-left">
            <button
              type="button"
              className="icon-btn dash-topbar-menu-btn"
              onClick={() => setOpen(v => !v)}
              aria-label={open ? 'Cerrar navegación' : 'Abrir navegación'}
            >
              <Icon name="menu" />
            </button>
            <div className="dash-topbar-brand">
              <Logo compact />
              <div className="dash-topbar-titles">
                <span className="dash-topbar-title">
                  {isDesigner ? 'Diseño Curricular' : (kind === 'admin' ? 'Administración' : 'Campus Virtual')}
                </span>
                <span className="dash-topbar-subtitle">EDDIP</span>
              </div>
              <span
                className={`dash-topbar-badge ${kind === 'admin' ? 'admin' : 'student'}`}
                style={isDesigner ? { background: 'var(--blue-3)', color: 'var(--blue)', border: '1px solid var(--blue-4)' } : {}}
              >
                {isDesigner ? 'Diseñador' : (kind === 'admin' ? 'Gestión' : 'Estudiante')}
              </span>
            </div>
          </div>

          <div className="dash-topbar-right">
            <Link
              href="/"
              className="btn btn-outline dash-topbar-public-btn"
              title="Sitio Público"
              aria-label="Ir al Sitio Público"
            >
              <Icon name="home" size={15} />
              <span className="dash-topbar-public-text">Sitio Público</span>
            </Link>
            <Link
              href={profileHref}
              className="dash-topbar-user"
              title={isDesigner ? 'Diseñador Instruccional EDDIP' : (kind === 'admin' ? 'Administrador EDDIP' : `Perfil de ${user.name}`)}
            >
              <div
                className="avatar dash-topbar-avatar"
                style={isDesigner ? { background: 'var(--blue-3)', color: 'var(--blue)' } : {}}
              >
                {initials}
              </div>
              <span className="dash-topbar-username">
                {isDesigner ? 'Diseñador' : (kind === 'admin' ? 'Admin' : user.name.split(' ')[0])}
              </span>
            </Link>
          </div>
        </header>

        {/* Contenido dinámico del panel o bloqueo por permisos */}
        <div style={{ padding: '28px 24px', flex: 1 }}>
          {isStudentBlocked ? (
            <div
              className="panel"
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid var(--line)',
                padding: '48px 32px',
                textAlign: 'center',
                maxWidth: 620,
                margin: '40px auto',
                boxShadow: '0 10px 30px rgba(7, 31, 73, 0.05)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: '#eff6ff',
                  color: '#1d4ed8',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <Icon name="shield" size={32} />
              </div>
              <h2 style={{ fontSize: 22, color: '#071F49', marginBottom: 10 }}>Portal de Administración Restringido</h2>
              <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.6, marginBottom: 24 }}>
                Tu cuenta tiene asignado el rol oficial de <strong>Estudiante</strong>. Este módulo está reservado exclusivamente para la administración directiva y cuerpo docente de EDDIP.
              </p>
              <Link
                href="/dashboard"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px' }}
              >
                <Icon name="home" size={16} /> Ir a Mi Aula Virtual
              </Link>
            </div>
          ) : isDesignerBlocked ? (
            <div
              className="panel"
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid var(--line)',
                padding: '48px 32px',
                textAlign: 'center',
                maxWidth: 620,
                margin: '40px auto',
                boxShadow: '0 10px 30px rgba(7, 31, 73, 0.05)',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: '#fef3c7',
                  color: '#d97706',
                  display: 'grid',
                  placeItems: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <Icon name="shield" size={32} />
              </div>
              <h2 style={{ fontSize: 22, color: '#071F49', marginBottom: 10 }}>Acceso Restringido</h2>
              <p style={{ color: '#64748b', fontSize: 14.5, lineHeight: 1.6, marginBottom: 24 }}>
                Tu cuenta tiene asignado el rol de <strong>Diseñador Instruccional</strong>. Tus permisos en la plataforma están configurados para la <strong>creación y estructuración de cursos, programas académicos y evaluaciones</strong>.
              </p>
              <Link
                href="/admin/cursos"
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 22px' }}
              >
                <Icon name="book" size={16} /> Ir al Módulo de Cursos
              </Link>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Footer institucional del panel */}
        <footer
          className="dash-footer"
          style={{
            borderTop: '1px solid #e2e8f0',
            padding: '18px 28px',
            background: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#64748b',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 'auto',
          }}
        >
          <span>© {new Date().getFullYear()} EDDIP. Todos los derechos reservados.</span>
          <a
            href="https://www.kytcode.lat"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            Desarrollado por K&T <span style={{ color: '#0f172a' }}>♥</span>
          </a>
        </footer>
      </main>

      {/* Fondo oscurecedor en móviles */}
      {open && (
        <button
          className="sidebar-scrim"
          onClick={() => setOpen(false)}
          aria-label="Cerrar menú lateral"
        />
      )}
    </div>
  );
}
