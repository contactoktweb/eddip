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
      <main className="dash-main">
        <div className="dash-mobilebar">
          <button
            type="button"
            className="icon-btn"
            onClick={() => setOpen(v => !v)}
            aria-label={open ? 'Cerrar navegación' : 'Abrir navegación'}
          >
            <Icon name="menu" />
          </button>
          <Logo compact />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#071F49' }}>
            {kind === 'admin' ? 'Administración' : 'Portal Estudiante'}
          </span>
        </div>

        {children}
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
