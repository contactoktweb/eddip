'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Logo } from './Logo';
import { Icon } from '@/lib/icons';
import { useDemo } from '@/app/providers';

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { role, user } = useDemo();

  const navLinks = [
    { href: '/', label: 'Inicio' },
    { href: '/cursos', label: 'Cursos' },
    { href: '/certificados/validar', label: 'Certificados' },
    { href: '/nosotros', label: 'Nosotros' },
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <header className="site-header premium-header">
      <div className="container nav-wrap">
        <Logo />

        <nav className={open ? 'main-nav open' : 'main-nav'} aria-label="Navegación principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={isActive(link.href) ? 'nav-link active' : 'nav-link'}
              onClick={() => setOpen(false)}
            >
              {link.label}
              {isActive(link.href) && <span className="active-pill-line" />}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          {role === 'student' ? (
            <Link className="nav-user-link" href="/dashboard">
              Hola, {user.name.split(' ')[0]}
            </Link>
          ) : role === 'admin' ? (
            <Link className="nav-user-link" href="/admin">
              Panel admin
            </Link>
          ) : (
            <Link className="nav-user-link desktop-only" href="/login">
              Iniciar sesión
            </Link>
          )}

          <Link className="btn btn-primary nav-cta desktop-only" href="/cursos">
            <span>Comienza ahora</span>
            <span className="btn-orb">
              <Icon name="arrow" size={14} />
            </span>
          </Link>

          <button
            className="icon-btn mobile-menu"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          >
            <Icon name={open ? 'close' : 'menu'} />
          </button>
        </div>
      </div>
    </header>
  );
}
