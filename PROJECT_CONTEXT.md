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
- **Autenticación (`/login`)**:
  - `StudentAuth.tsx`: Sistema con 3 modos (Inicio de sesión, Registro oficial de estudiante y Restablecimiento de contraseña).
  - Removidas todas las referencias textuales a "Supabase" hacia el usuario; reemplazadas con distintivo institucional seguro con pulso reactivo ("Campus Virtual Seguro").
  - Visibilidad alternable de contraseña (`eye`/`eyeOff` SVG) en login y registro.
  - Flujo integral de restablecimiento de contraseña con envío de correo seguro y pantalla de confirmación.
  - Accesos directos institucionales optimizados para validación inmediata (Portal Estudiante y Portal Administrador).
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
- **Mis Certificados (`/dashboard/certificados`)**:
  - `StudentCertificatesGrid.tsx`: Catálogo de certificados emitidos para el estudiante con código QR real escaneable y enlace de validación pública.
- **Perfil de Estudiante (`/dashboard/perfil`)**:
  - `StudentProfileManager.tsx`: Pestañas de datos personales, cambio de contraseña mediante Supabase Auth y resumen académico del estudiante.

### B. Módulo del Administrador y Sincronización
- **Panel General (`/admin`)**:
  - `AdminStatGrid.tsx`: Métricas consolidadas 100% exactas y consistentes: 10 estudiantes registrados, 7 cursos publicados, $1.268.600 COP en ventas procesadas y 4 certificados emitidos.
  - `AdminMonthlyChart.tsx`: Gráfica y encabezado de ingresos mensuales sincronizados con la recaudación real de pagos.
  - `AdminPopularCourses.tsx`: Ranking de programas con conteo exacto de alumnos matriculados por curso (Derecho de Policía: 4, Fundamentos: 3, Liderazgo: 3, etc.).
  - `AdminRecentStudents.tsx`: Tabla de últimos ingresos alimentada del directorio activo de estudiantes.
- **Cursos y Contenidos (`/admin/cursos`, `/admin/cursos/nuevo`, `/admin/cursos/[slug]`)**:
  - `AdminCourseTable.tsx`: Tabla de cursos con columna de estudiantes matriculados sincronizada exactamente con los alumnos inscritos (18 matrículas en total).
  - `CourseContentBuilder.tsx`: Constructor y cargador completo de cursos con módulos, lecciones, minutos, puntos clave, resultados y vista previa en vivo.
  - **Sincronización Total**: Al crear o editar un curso en administración, se refleja automáticamente en la página principal (`/` vía `HomeFeaturedCourses`), el catálogo completo (`/cursos`), la ficha pública (`/cursos/[slug]`) y el aula virtual.
- **Directorio de Estudiantes / "Jugadores" (`/admin/estudiantes`)**:
  - `StudentDirectory.tsx`: Buscador en tiempo real por nombre, cédula, correo o ciudad; filtros por avance y exportación a CSV con los 10 estudiantes de la plataforma.
  - `StudentDetailModal.tsx`: Ficha individual del estudiante con avance real en los cursos específicos en que está matriculado y diplomas acreditados.
- **Evaluaciones (`/admin/evaluaciones`)**:
  - `AdminExamManager.tsx`: Selector de curso, configuración del porcentaje mínimo aprobatorio, constructor de preguntas de opción múltiple (A, B, C, D) y selección de respuesta correcta.
- **Certificados y Validador QR (`/admin/certificados`, `/certificados/[code]`, `/certificados/validar`)**:
  - `QrVisual.tsx`: Generador de códigos QR reales escaneables mediante `qrcode` que codifican la URL pública oficial (`.../certificados/[code]`).
  - Al escanear el código QR con cualquier smartphone, redirige automáticamente a la página del certificado donde muestra la acreditación completa y legítima (marca de agua institucional, firmas de Dirección Académica y Secretaría General, fecha, horas y estado Válido).
  - `/certificados/validar`: Validador público por código con soporte para parámetros URL (`?code=...`) y redirección inmediata al diploma completo.
- **Ventas y Facturación (`/admin/ventas`)**:
  - `AdminSalesManager.tsx`: Historial de 18 pagos aprobados correspondientes a las matrículas de los estudiantes, totalizando $1.268.600 COP, ticket promedio y filtro por pasarela (Bold, PSE, Tarjeta).
  - Integración reactiva con el portal de matrícula (`/checkout/[slug]`): cualquier nueva compra se registra automáticamente en el historial de ventas y matricula al estudiante en el curso.
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
