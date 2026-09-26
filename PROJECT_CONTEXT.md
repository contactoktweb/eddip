# Contexto del Proyecto: EDDIP Premium

## 1. Descripción General
EDDIP es una plataforma educativa especializada en programas de formación jurídica, seguridad ciudadana, convivencia y gestión pública. La interfaz cuenta con una experiencia visual premium, minimalista, accesible y totalmente responsive.

## 2. Tecnologías y Stack
- **Framework**: Next.js 16 (App Router con Turbopack)
- **Biblioteca UI**: React 19
- **Lenguaje**: TypeScript (Strict mode)
- **Estilos**: CSS puro modularizado en `app/globals.css` (sin frameworks pesados externos, con diseño responsivo mobile-first)
- **Base de Datos & Auth**: Supabase (`@supabase/supabase-js`)
  - Project URL: `https://ubjttczrydprsutppsgo.supabase.co`
  - Anon Key: configurada en `.env.local`
  - Script SQL de base de datos disponible en `lib/supabase/schema.sql`
- **Generación Criptográfica de QR**: `qrcode` con codificación de URLs de verificación pública y resolución retina.

## 3. Módulos Implementados

### A. Módulo del Estudiante (Verificado E2E)
- **Autenticación y Registro (`/login`)**:
  - `StudentAuth.tsx`: Sistema con 3 modos (Inicio de sesión, Registro oficial de estudiante y Restablecimiento de contraseña).
  - **Registro Limpio desde Cero**: Al crear una nueva cuenta, el estudiante inicia con 0 cursos comprados, 0 progreso de lecciones, 0 certificados y 0 notas (`purchased: []`, `completed: {}`, `results: {}`). Su almacenamiento queda estrictamente aislado por usuario (`eddip_user_${email}`) sin heredar los cursos de la cuenta de prueba demo.
  - Removidas todas las menciones a "Campus Virtual Seguro" y "Supabase", presentando una interfaz institucional minimalista y limpia con retorno directo al inicio.
  - Inputs optimizados con iconos vectoriales centrados verticalmente y espaciado interior (`padding-left: 44px`), evitando cualquier superposición con textos o placeholders.
  - Visibilidad alternable de contraseña (`eye`/`eyeOff` SVG) con espacio reservado a la derecha en todos los campos de contraseña.
- **Panel Principal (`/dashboard`)**:
  - `StudentStatGrid.tsx`: Métricas de cursos activos, completados, horas acumuladas y diplomas con filtros sincronizados.
  - `StudentContinueLearning.tsx`: Tarjeta interactiva del curso en progreso con avance porcentual, indicación de próxima lección y botón dinámico que conmuta a "Evaluación" al llegar al 100%.
  - `StudentRecentActivity.tsx`: Línea de tiempo de actividad y certificaciones.
- **Mis Cursos (`/dashboard/cursos`)**:
  - `StudentCourseList.tsx` y `StudentCourseCard.tsx`: Filtros dinámicos ("Todos", "En progreso", "Completados"), buscador en tiempo real, barras de progreso y botón de acción directa ("Continuar", "Repasar" y botón especial de examen final al completar el 100%).
- **Aula Virtual (`/aprender/[slug]/[lessonId]`)**:
  - `LessonSidebar.tsx`: Temario con módulos colapsables, checkmarks de lecciones concluidas, progreso total, drawer móvil táctil y enlace permanente a evaluación.
  - `LessonReaderContent.tsx`: Visor de lectura optimizado con puntos clave para la práctica profesional.
  - `LessonNotesWidget.tsx`: Cuaderno de apuntes privado por lección sincronizado en la cuenta del estudiante.
  - `LessonNavigation.tsx`: Controles de lección anterior/siguiente, botón atómico "Marcar como completada" y botón de acceso a evaluación final en la última lección.
- **Evaluación Final (`/evaluacion/[slug]`)**:
  - `StudentExamModule.tsx`: Pantalla de instrucciones, stepper interactivo de preguntas, cálculo de puntaje, validación de aprobación (>=70-80%), generación automática de certificados oficiales y enlace directo al diploma.
  - Generador dinámico de evaluaciones para programas que no cuenten con examen fijo en JSON.
- **Mis Certificados y Diploma Oficial (`/dashboard/certificados`, `/certificados/[code]`)**:
  - `StudentCertificatesGrid.tsx`: Catálogo de certificados emitidos para el estudiante con código QR real escaneable y enlace de validación pública.
  - `[code]/page.tsx`: Vista oficial del diploma con código QR criptográfico, diseño apaisado de una sola página para impresión/PDF y número de identificación (C.C.) visible debajo del nombre del alumno.
- **Perfil de Estudiante (`/dashboard/perfil`)**:
  - `StudentProfileManager.tsx`: Pestañas de datos personales, cambio de contraseña mediante Supabase Auth y resumen académico del estudiante.

### B. Módulo del Administrador y Sincronización
- **Shell de Navegación Unificado (`DashboardShell.tsx`)**:
  - Encabezado responsivo (`dash-topbar`):
    - En PC / escritorio, el botón de navegación con las tres líneas (`.dash-topbar-menu-btn`) se oculta automáticamente (`display: none`), dado que la barra lateral (`dash-sidebar`) ya se encuentra fija y desplegada al 100%.
    - En dispositivos móviles y tabletas (`<= 820px`), el botón de 3 líneas se muestra como un control táctil (`display: inline-flex`) para desplegar la navegación lateral.
    - En pantallas móviles (`< 620px`), el header se optimiza automáticamente: el botón "Sitio Público" oculta su texto y adopta formato de icono cuadrado, el usuario oculta su nombre para mostrar únicamente el avatar circular, y el badge de rol se oculta para garantizar que ningún botón o texto se desborde o corte.
- **Panel General (`/admin`)**:
  - `AdminStatGrid.tsx`: Métricas consolidadas 100% exactas y consistentes: 10 estudiantes registrados, 7 cursos publicados, $1.268.600 COP en ventas procesadas y 4 certificados emitidos.
  - `AdminMonthlyChart.tsx`: Gráfica y encabezado de ingresos mensuales sincronizados con la recaudación real de pagos.
  - `AdminPopularCourses.tsx`: Ranking de programas con conteo exacto de alumnos matriculados por curso (Derecho de Policía: 4, Fundamentos: 3, Liderazgo: 3, etc.).
  - `AdminRecentStudents.tsx`: Tabla de últimos ingresos alimentada del directorio activo de estudiantes.
- **Cursos y Contenidos (`/admin/cursos`, `/admin/cursos/nuevo`, `/admin/cursos/[slug]`)**:
  - `AdminCourseTable.tsx`: Tabla de cursos con columna de estudiantes matriculados sincronizada exactamente con los alumnos inscritos (18 matrículas en total).
  - `CourseContentBuilder.tsx`: Constructor y cargador completo de cursos con módulos, lecciones, minutos, puntos clave, resultados, sistema de subida de imágenes múltiples (1 o varias con drag & drop, presets y URLs) y vista previa en vivo con slide táctil interactivo.
  - `CourseImageSlider.tsx`: Componente modular para tarjetas de catálogo, ficha pública y panel de administración, con soporte completo de gestos táctiles swipe en móviles (Regla 15), navegación prev/next con micro-animaciones, dots y badge indicador.
  - **Persistencia en Base de Datos Supabase**: Almacenamiento persistente en dos capas en PostgreSQL (`site_content` con clave `course_images_${slug}` y campo JSONB `instructor.courseImages` en `courses`, además de redundancia en localStorage), asegurando que todas las imágenes subidas persistan de manera duradera en la base de datos remota.
  - **Sincronización Total**: Al crear o editar un curso en administración, se refleja automáticamente en la página principal (`/` vía `HomeFeaturedCourses`), el catálogo completo (`/cursos`), la ficha pública (`/cursos/[slug]`) y el aula virtual.
- **Directorio de Estudiantes / "Jugadores" (`/admin/estudiantes`)**:
  - `StudentDirectory.tsx`: Buscador en tiempo real por nombre, cédula, correo o ciudad; filtros por avance y exportación a CSV con los 10 estudiantes de la plataforma.
  - `StudentDetailModal.tsx`: Ficha individual del estudiante con avance real en los cursos específicos en que está matriculado y diplomas acreditados.
- **Evaluaciones (`/admin/evaluaciones`, `/evaluacion/[slug]`)**:
  - `AdminExamManager.tsx`: Selector de cursos con soporte para parámetros URL (`?course=slug`), configuración del porcentaje mínimo aprobatorio, constructor de preguntas de opción múltiple (A, B, C, D), selección de respuesta correcta, adición y remoción de preguntas.
  - **Sincronización Total con el Estudiante**: La cantidad de preguntas, los textos de los enunciados y las opciones de respuesta que ve el estudiante en `/evaluacion/[slug]` y `StudentExamModule.tsx` provienen directamente de lo configurado en la administración, con persistencia en Supabase (`site_content` con clave `exam_${slug}` y tabla `exams`), respaldo en `localStorage` y propagación reactiva de eventos `eddip_exam_updated`.
- **Certificados y Validador QR (`/admin/certificados`, `/certificados/[code]`, `/certificados/validar`)**:
  - `QrVisual.tsx`: Generador de códigos QR reales escaneables mediante `qrcode` que codifican la URL pública oficial (`.../certificados/[code]`).
  - Al escanear el código QR con cualquier smartphone, redirige automáticamente a la página del certificado donde muestra la acreditación completa y legítima (marca de agua institucional, firmas de Dirección Académica y Secretaría General, fecha, horas y estado Válido).
  - `/certificados/validar`: Validador público por código con soporte para parámetros URL (`?code=...`) y redirección inmediata al diploma completo.
- **Ventas y Facturación (`/admin/ventas`, `/checkout/[slug]`)**:
  - `AdminSalesManager.tsx`: Historial de ventas y pagos aprobados correspondientes a las matrículas de los estudiantes, ticket promedio y filtro por pasarela (Bold, PSE, Tarjeta).
  - **Pasarela de Pagos Bold Oficial**:
    - Integrada en el proceso de matrícula de cursos en `/checkout/[slug]`.
    - Credenciales configuradas en `.env.local` (`NEXT_PUBLIC_BOLD_IDENTITY_KEY` y `BOLD_SECRET_KEY`).
    - Endpoint seguro `/api/bold/checkout` que calcula la referencia única de orden `EDDIP-{timestamp}-{random}` y firma el payload con SHA-256 (`orderId + amount + currency + secretKey`).
    - Carga dinámica del SDK oficial de Bold (`boldPaymentButton.js`) e inicialización de `window.BoldCheckout` con fallback seguro a enlace de pago o Sandbox oficial.
    - Al confirmarse el pago por Bold, matricula de inmediato al estudiante en el curso (`enrollCourse`) y registra la venta formal bajo el método `'Bold'` en `adminService`.
  - **Formulario de Acreditación Oficial y Confirmación de Matrícula**:
    - Inicialización 100% limpia sin datos pre-ingresados (campos en blanco con placeholders descriptivos).
    - Selects personalizados (`CustomSelect`) para Departamento y Ciudad basados en el catálogo territorial oficial de Colombia (`lib/colombiaPlaces.ts`).
    - Cascada dinámica: el selector de ciudad se habilita una vez escogido el departamento, con buscador rápido integrado insensible a mayúsculas y acentos.
    - **Pantalla de Confirmación con Datos Reales**: Persistencia garantizada (incluso post-redirección de Bold) en `sessionStorage` y `localStorage`. La tarjeta de matrícula confirmada exhibe con exactitud el nombre, cédula, correo, teléfono y ciudad que el usuario ingresó, sin volver a datos demo ni sobreescribir con valores de prueba.
- **Contenido Web (`/admin/contenido`)**:
  - `AdminContentEditor.tsx`: Edición de textos del Hero de inicio, llamadas a la acción e indicadores con vista previa instantánea.
- **Configuración (`/admin/configuracion`)**:
  - `AdminSettingsPanel.tsx`: Switches de políticas del sistema y reinicio seguro de datos demo.

## 4. Reglas Obligatorias del Proyecto
- Exactamente **un solo `H1`** por página.
- Jerarquía estricta de encabezados (`H1` -> `H2` -> `H3`).
- Footer con atribución obligatoria: **"Desarrollado por K&T ♥"** que redirige a `https://www.kytcode.lat`, corazón dinámico blanco sobre fondo oscuro, y año dinámico `new Date().getFullYear()`.
- Cero textos de prueba, "demo", "simulado" o "JSON local" en la interfaz de usuario.
- Soporte para accesibilidad y `prefers-reduced-motion`.
- Persistencia resiliente: operaciones con Supabase y respaldo automático en caso de falta de conexión o tablas pendientes de migración.

## 5. Integración y Suministro Dinámico desde Supabase
- **Servicio Unificado `contentService.ts`**: Encapsula las consultas a Supabase para las tablas `courses`, `certificates` y `site_content`.
- **Página de Cursos (`/cursos`, `/cursos/[slug]`)**: Suministrada directamente mediante `contentService.getCourses()` y sincronizada en el contexto global sin textos de prueba ni simulaciones.
- **Página de Nosotros (`/nosotros`)**: Carga dinámica de la misión, visión, pilares doctrinales y estadísticas desde `site_content` en Supabase con fallback institucional.
- **Página de Certificados (`/certificados/validar`, `/certificados/[code]`, `/dashboard/certificados`)**: Validación oficial en tiempo real contra `public.certificates` en Supabase, sin códigos mockeados ni fallbacks sintéticos ficticios.
- **Página de Inicio (`/`)**: Integración en el carrusel de cursos destacados (`HomeFeaturedCourses`) alimentado por la base de datos y credencial de verificación pública `EDDIP-2026-000145`.
- **Script SQL Completo (`lib/supabase/schema.sql`)**: Contiene la definición de todas las tablas con RLS, triggers y sentencias `INSERT` con semillas completas para despliegue inmediato en el SQL Editor de Supabase.
