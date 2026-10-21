export type HelpQuickLink = {
  icon: string;
  title: string;
  description: string;
  href: string;
};

export type HelpFaqGroup = {
  title: string;
  items: { question: string; answer: string }[];
};

export const helpQuickLinks: HelpQuickLink[] = [
  {
    icon: 'user',
    title: 'Crear mi cuenta',
    description: 'Regístrate como estudiante para inscribirte en los cursos.',
    href: '/login?mode=register',
  },
  {
    icon: 'key',
    title: 'Recuperar contraseña',
    description: 'Recibe un enlace en tu correo para crear una nueva contraseña.',
    href: '/login?mode=reset',
  },
  {
    icon: 'book',
    title: 'Explorar cursos',
    description: 'Consulta la oferta académica, temarios, horas y valores.',
    href: '/cursos',
  },
  {
    icon: 'award',
    title: 'Validar un certificado',
    description: 'Verifica la autenticidad de un diploma con su código único.',
    href: '/certificados/validar',
  },
];

export const helpFaqGroups: HelpFaqGroup[] = [
  {
    title: 'Cuenta y acceso',
    items: [
      {
        question: '¿Cómo creo mi cuenta de estudiante?',
        answer:
          'Ingresa a "Iniciar sesión", selecciona la pestaña de registro y completa tus datos: nombre completo, documento de identidad, correo, celular y ubicación. Al finalizar recibirás un correo de bienvenida y podrás ingresar de inmediato a tu panel.',
      },
      {
        question: 'Olvidé mi contraseña, ¿cómo la recupero?',
        answer:
          'En la pantalla de inicio de sesión haz clic en "¿Olvidaste tu contraseña?", escribe el correo con el que te registraste y te enviaremos un enlace para crear una nueva contraseña. El enlace vence en una hora.',
      },
      {
        question: '¿Puedo actualizar mis datos personales?',
        answer:
          'Sí. Desde tu panel de estudiante entra a "Perfil" para actualizar tus datos de contacto y cambiar tu contraseña.',
      },
    ],
  },
  {
    title: 'Inscripción y pagos',
    items: [
      {
        question: '¿Cómo me inscribo en un curso?',
        answer:
          'Elige el curso en el catálogo, haz clic en "Inscribirme", confirma tus datos y realiza el pago a través de la pasarela segura. Cuando el pago es aprobado el curso aparece automáticamente en "Mis cursos".',
      },
      {
        question: '¿Qué medios de pago puedo usar?',
        answer:
          'Los pagos en línea se procesan con la pasarela Bold, que admite tarjetas débito y crédito y PSE. Si prefieres pagar por transferencia, comunícate con nosotros por WhatsApp para registrar tu matrícula.',
      },
      {
        question: '¿Recibo confirmación de mi compra?',
        answer:
          'Sí. Al aprobarse el pago te enviamos un correo con el resumen de la inscripción y el acceso al curso.',
      },
    ],
  },
  {
    title: 'Cursos y certificados',
    items: [
      {
        question: '¿Cuánto tiempo tengo para terminar un curso?',
        answer:
          'Estudias a tu ritmo: tu avance queda guardado lección por lección y puedes continuar desde cualquier dispositivo.',
      },
      {
        question: '¿Cómo obtengo mi certificado?',
        answer:
          'Al completar todas las lecciones presenta la evaluación final. Si la apruebas, el certificado se genera de inmediato con un código único y un código QR, y queda disponible en "Certificados" dentro de tu panel.',
      },
      {
        question: '¿Cómo puede un tercero verificar mi certificado?',
        answer:
          'Cualquier persona puede escanear el código QR del diploma o ingresar su código en el validador público del sitio para confirmar su autenticidad.',
      },
    ],
  },
];
