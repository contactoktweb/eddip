import type { Metadata } from 'next';
import { LegalDocumentView } from '@/components/LegalDocumentView';
import { mergeLegalDocument } from '@/lib/legalDocuments';
import { readSiteContent } from '@/lib/supabase/server';

export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Política de Privacidad y Tratamiento de Datos · EDDIP',
  description:
    'Conoce cómo EDDIP recolecta, usa y protege los datos personales de sus estudiantes conforme a la Ley 1581 de 2012 de protección de datos en Colombia.',
  alternates: { canonical: '/politica-de-privacidad' },
};

export default async function PrivacyPolicyPage() {
  const document = mergeLegalDocument('privacyPolicy', await readSiteContent('privacyPolicy'));
  return <LegalDocumentView document={document} eyebrow="Protección de datos personales" />;
}
