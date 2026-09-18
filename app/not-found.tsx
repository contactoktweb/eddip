import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Icon } from '@/lib/icons';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main
        className="section container"
        style={{
          minHeight: '65vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '80px 20px',
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: 'rgba(11, 98, 221, 0.08)',
            color: '#0b62dd',
            display: 'grid',
            placeItems: 'center',
            marginBottom: 20,
          }}
        >
          <Icon name="search" size={36} />
        </div>
        <span className="eyebrow">Error 404 · Página no encontrada</span>
        <h1 style={{ fontSize: 36, margin: '8px 0 14px', color: '#071F49' }}>
          La página que buscas no está disponible
        </h1>
        <p style={{ color: '#68788d', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
          Es posible que la dirección haya cambiado o que el contenido ya no se encuentre activo.
          Puedes regresar al inicio o explorar nuestra oferta académica oficial.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link className="btn btn-primary" href="/">
            <Icon name="home" /> Ir al inicio
          </Link>
          <Link className="btn btn-outline" href="/cursos">
            <Icon name="book" /> Ver cursos disponibles
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
