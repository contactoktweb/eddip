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
  ['/admin/certificados', 'Certificados', 'award'],
  ['/admin/ventas', 'Ventas', 'dollar'],
  ['/admin/contenido', 'Contenido web', 'edit'],
  ['/admin/configuracion', 'Configuración', 'settings'],
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
  const { logout, user } = useDemo();

  const items = kind === 'admin' ? adminNav : studentNav;
  const initials =
    kind === 'admin'
      ? 'AD'
      : user.name
          .split(' ')
          .filter(Boolean)
          .map(n => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'ES';

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
          href={kind === 'student' ? '/dashboard/perfil' : '/admin/configuracion'}
          className="dash-profile"
          style={{ textDecoration: 'none', color: 'inherit' }}
          onClick={() => setOpen(false)}
        >
          <div className="avatar">{initials}</div>
          <div style={{ minWidth: 0 }}>
            <strong style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {kind === 'admin' ? 'Administrador EDDIP' : user.name}
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
              {kind === 'admin' ? 'Control de plataforma' : 'Estudiante activo'}
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
        <header
          className="dash-topbar"
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            padding: '12px 28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 35,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button
              type="button"
              className="icon-btn"
              onClick={() => setOpen(v => !v)}
              aria-label={open ? 'Cerrar navegación' : 'Abrir navegación'}
            >
              <Icon name="menu" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Logo compact />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#071F49' }}>
                {kind === 'admin' ? 'Administración EDDIP' : 'Campus Virtual EDDIP'}
              </span>
              <span
                style={{
                  fontSize: 11,
                  background: kind === 'admin' ? '#eff6ff' : '#ecfdf5',
                  color: kind === 'admin' ? '#1d4ed8' : '#059669',
                  padding: '2px 8px',
                  borderRadius: 999,
                  fontWeight: 600,
                }}
              >
                {kind === 'admin' ? 'Gestión' : 'Estudiante'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link
              href="/"
              className="btn btn-outline"
              style={{ fontSize: 12, padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="home" size={14} /> Sitio Público
            </Link>
            <Link
              href={kind === 'student' ? '/dashboard/perfil' : '/admin/configuracion'}
              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                {initials}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                {kind === 'admin' ? 'Admin' : user.name.split(' ')[0]}
              </span>
            </Link>
          </div>
        </header>

        {/* Contenido dinámico del panel */}
        <div style={{ padding: '28px 24px', flex: 1 }}>
          {children}
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
          <span>© {new Date().getFullYear()} EDDIP — Escuela de Desarrollo y Doctrina Policial.</span>
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
