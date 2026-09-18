import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { Icon } from '@/lib/icons';
import Link from 'next/link';

export default function HowPage() {
  const steps = [
    {
      icon: 'search',
      title: '1. Explora el Catálogo',
      desc: 'Selecciona cursos especializados por área jurídica, policial o de gestión pública revisando el temario, horas lectivas e instructor.',
    },
    {
      icon: 'card',
      title: '2. Inscríbete en Línea',
      desc: 'Realiza tu inscripción de manera ágil y segura para habilitar de forma inmediata el acceso a tu aula virtual personalizada.',
    },
    {
      icon: 'book',
      title: '3. Estudia a tu Ritmo',
      desc: 'Accede a lecciones con fundamentación doctrinal, toma notas de estudio y monitorea tu porcentaje de avance en tiempo real.',
    },
    {
      icon: 'file',
      title: '4. Presenta la Evaluación',
      desc: 'Demuestra los conocimientos adquiridos mediante una prueba estructurada con retroalimentación y calificación instantánea.',
    },
    {
      icon: 'award',
      title: '5. Obtén tu Certificado',
      desc: 'Al aprobar, recibe un diploma con código alfanumérico único y código QR criptográfico para verificación pública oficial.',
    },
    {
      icon: 'grid',
      title: '6. Trazabilidad Académica',
      desc: 'Mantén en tu panel todo tu historial formativo, horas acumuladas y diplomas acreditados disponibles en cualquier momento.',
    },
  ];

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">Metodología Formativa</span>
            <h1>Aprender, avanzar y certificarte con excelencia</h1>
            <p>
              Nuestra plataforma integra inscripción, contenidos interactivos, seguimiento pedagógico, evaluación y acreditación en una sola experiencia digital.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="feature-grid">
              {steps.map(s => (
                <div className="feature-card" key={s.title}>
                  <div className="category-icon">
                    <Icon name={s.icon} />
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: 48 }}>
              <Link className="btn btn-primary btn-lg" href="/cursos">
                Explorar catálogo de cursos <Icon name="arrow" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
