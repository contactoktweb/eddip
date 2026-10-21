export type LegalDocumentKey = 'privacyPolicy' | 'termsConditions';

export type LegalSection = {
  heading: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  intro: string;
  updatedAt: string;
  sections: LegalSection[];
};

export const LEGAL_DOCUMENT_EVENT = 'eddip_legal_document_updated';

export const LEGAL_DOCUMENT_ROUTES: Record<LegalDocumentKey, string> = {
  privacyPolicy: '/politica-de-privacidad',
  termsConditions: '/terminos-y-condiciones',
};

export const defaultLegalDocuments: Record<LegalDocumentKey, LegalDocument> = {
  privacyPolicy: {
    title: 'Política de Tratamiento de Datos Personales',
    updatedAt: '2026-10-21',
    intro:
      'EDDIP, en cumplimiento de la Ley Estatutaria 1581 de 2012, el Decreto 1074 de 2015 y demás normas que regulan la protección de datos personales en Colombia, adopta la presente política para garantizar el adecuado tratamiento de la información de estudiantes, clientes, docentes y visitantes de su plataforma educativa.',
    sections: [
      {
        heading: 'Responsable del tratamiento',
        body:
          'EDDIP es responsable del tratamiento de los datos personales recolectados a través de su plataforma educativa, formularios de inscripción, pasarela de pagos y canales de atención. Para cualquier consulta o reclamo puede escribir al correo de contacto publicado en este sitio.',
      },
      {
        heading: 'Datos que recolectamos',
        body:
          'Nombre completo, número de documento de identidad, correo electrónico, número de celular, departamento y ciudad de residencia, información académica (cursos inscritos, avance, evaluaciones y certificados) e información de transacciones necesaria para la matrícula. No almacenamos datos completos de tarjetas: los pagos se procesan a través de la pasarela autorizada.',
      },
      {
        heading: 'Finalidades del tratamiento',
        body:
          'Los datos se utilizan para: crear y administrar la cuenta del estudiante; gestionar inscripciones, pagos y matrículas; expedir y validar certificados académicos con código de verificación; enviar comunicaciones relacionadas con los cursos, confirmaciones de registro y compra; atender peticiones, quejas y reclamos; y cumplir obligaciones legales y contables.',
      },
      {
        heading: 'Validación pública de certificados',
        body:
          'Al expedirse un certificado, el nombre del titular, el programa, las horas y la fecha de expedición podrán ser consultados por terceros mediante el código único o el código QR del diploma, con el fin exclusivo de verificar su autenticidad.',
      },
      {
        heading: 'Derechos de los titulares',
        body:
          'Como titular usted puede conocer, actualizar y rectificar sus datos; solicitar prueba de la autorización otorgada; ser informado sobre el uso dado a su información; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y solicitar la supresión de sus datos cuando no exista un deber legal o contractual de conservarlos; y acceder gratuitamente a sus datos personales.',
      },
      {
        heading: 'Procedimiento para consultas y reclamos',
        body:
          'Las solicitudes pueden enviarse al correo de contacto indicando nombre, documento de identidad, descripción de la solicitud y datos de respuesta. Las consultas se atenderán en un término máximo de diez (10) días hábiles y los reclamos en un término máximo de quince (15) días hábiles, prorrogables en los casos previstos por la ley.',
      },
      {
        heading: 'Seguridad de la información',
        body:
          'EDDIP adopta medidas técnicas, humanas y administrativas razonables para proteger la información contra pérdida, consulta, uso o acceso no autorizado. El acceso a los datos se limita al personal y a los proveedores que los requieren para cumplir las finalidades descritas.',
      },
      {
        heading: 'Vigencia',
        body:
          'Esta política rige a partir de su publicación. Los datos se conservarán mientras sean necesarios para las finalidades descritas y para el cumplimiento de obligaciones legales. Cualquier cambio sustancial será informado a través de este sitio web.',
      },
    ],
  },
  termsConditions: {
    title: 'Términos y Condiciones de Uso',
    updatedAt: '2026-10-21',
    intro:
      'Estos términos regulan el acceso y uso de la plataforma educativa EDDIP, la inscripción en sus cursos y la expedición de certificados. Al registrarse o adquirir un curso, el usuario declara haber leído y aceptado estas condiciones.',
    sections: [
      {
        heading: 'Registro y cuenta de usuario',
        body:
          'Para inscribirse en un curso es necesario crear una cuenta con información veraz y actualizada. El usuario es responsable de la confidencialidad de su contraseña y de toda actividad realizada con su cuenta. La cuenta es personal e intransferible.',
      },
      {
        heading: 'Inscripción y pagos',
        body:
          'El valor de cada curso se informa en pesos colombianos en su ficha. La matrícula se habilita una vez el pago es aprobado por la pasarela autorizada o confirmado por el área administrativa. El usuario recibirá la confirmación de su inscripción en el correo registrado.',
      },
      {
        heading: 'Acceso a los contenidos',
        body:
          'Una vez matriculado, el estudiante puede acceder a las lecciones, materiales de estudio y evaluación del curso desde su panel. Los contenidos son de uso personal y no pueden ser reproducidos, distribuidos ni comercializados sin autorización expresa de EDDIP.',
      },
      {
        heading: 'Evaluación y certificación',
        body:
          'El certificado se expide cuando el estudiante completa el curso y aprueba la evaluación final con el puntaje mínimo establecido. Cada certificado cuenta con un código único y un código QR que permiten verificar su autenticidad en el validador público del sitio.',
      },
      {
        heading: 'Derecho de retracto y devoluciones',
        body:
          'Las solicitudes de retracto, reversión del pago o devolución se atenderán conforme a la Ley 1480 de 2011 (Estatuto del Consumidor) y demás normas aplicables. Las solicitudes deben enviarse al correo de contacto indicando los datos de la compra.',
      },
      {
        heading: 'Uso adecuado de la plataforma',
        body:
          'El usuario se compromete a no realizar actividades que afecten el funcionamiento del sitio, suplantar identidades, compartir sus credenciales o intentar acceder a información de otros usuarios. EDDIP podrá suspender las cuentas que incumplan estas condiciones.',
      },
      {
        heading: 'Modificaciones',
        body:
          'EDDIP podrá actualizar estos términos para reflejar cambios en sus servicios o en la normativa vigente. La versión publicada en este sitio será la aplicable desde su fecha de actualización.',
      },
    ],
  },
};

export function mergeLegalDocument(key: LegalDocumentKey, value: unknown): LegalDocument {
  const fallback = defaultLegalDocuments[key];
  if (!value || typeof value !== 'object') return fallback;
  const v = value as Partial<LegalDocument>;
  const sections = Array.isArray(v.sections)
    ? v.sections.filter(
        (s): s is LegalSection => Boolean(s) && typeof s.heading === 'string' && typeof s.body === 'string'
      )
    : fallback.sections;
  return {
    title: v.title || fallback.title,
    intro: v.intro ?? fallback.intro,
    updatedAt: v.updatedAt || fallback.updatedAt,
    sections: sections.length > 0 ? sections : fallback.sections,
  };
}

export function formatLegalDate(isoDate: string): string {
  const date = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
