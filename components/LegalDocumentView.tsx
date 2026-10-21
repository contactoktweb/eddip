import Link from 'next/link';
import { SiteHeader } from './SiteHeader';
import { Footer } from './Footer';
import { Icon } from '@/lib/icons';
import { formatLegalDate, type LegalDocument } from '@/lib/legalDocuments';

type Props = {
  document: LegalDocument;
  eyebrow: string;
};

const toAnchor = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toParagraphs = (text: string) => text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);

export function LegalDocumentView({ document, eyebrow }: Props) {
  return (
    <>
      <SiteHeader />
      <main className="legal-page">
        <section className="page-hero legal-hero">
          <div className="container">
            <span className="eyebrow">{eyebrow}</span>
            <h1>{document.title}</h1>
            <p className="legal-updated">
              <Icon name="clock" size={15} /> Última actualización: {formatLegalDate(document.updatedAt)}
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container legal-layout">
            <nav className="legal-toc" aria-label="Contenido del documento">
              <p className="legal-toc-title">Contenido</p>
              <ol>
                {document.sections.map(section => (
                  <li key={section.heading}>
                    <a href={`#${toAnchor(section.heading)}`}>{section.heading}</a>
                  </li>
                ))}
              </ol>
            </nav>

            <article className="legal-article">
              {toParagraphs(document.intro).map((paragraph, i) => (
                <p key={i} className="legal-intro">{paragraph}</p>
              ))}

              {document.sections.map((section, index) => (
                <section key={section.heading} id={toAnchor(section.heading)} className="legal-section">
                  <h2>
                    <span aria-hidden="true">{index + 1}.</span> {section.heading}
                  </h2>
                  {toParagraphs(section.body).map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </section>
              ))}

              <aside className="legal-contact">
                <Icon name="help" size={20} />
                <p>
                  ¿Tienes preguntas sobre este documento? Visita nuestro{' '}
                  <Link href="/ayuda#contacto">centro de ayuda</Link> para comunicarte con el equipo de EDDIP.
                </p>
              </aside>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
