import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/LegalDocumentView';
import { mergeLegalDocument } from '@/lib/legalDocuments';
import { readSiteContent } from '@/lib/supabase/server';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Términos y Condiciones de Uso · EDDIP',
  description:
    'Términos y condiciones de la plataforma educativa EDDIP: registro, inscripción y pago de cursos virtuales, acceso a contenidos y expedición de certificados.',
  alternates: { canonical: '/terminos-y-condiciones' },
};

export default async function TermsPage() {
  const document = mergeLegalDocument('termsConditions', await readSiteContent('termsConditions'));
  return <LegalDocumentView document={document} eyebrow="Condiciones del servicio" />;
}
