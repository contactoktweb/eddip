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
  - `StudentAuth.tsx`: Pestañas para inicio de sesión y registro de nuevos estudiantes (Nombre, Cédula, Teléfono, Correo, Contraseña) contra Supabase Auth.
  - Accesos demo inmediatos para validación sin credenciales.
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
  - `AdminStatGrid.tsx`: Métricas consolidadas (estudiantes registrados, cursos publicados, ventas procesadas en COP y certificados emitidos).
  - `AdminMonthlyChart.tsx`: Gráfica de ingresos mensuales con año dinámico y comparativo porcentual.
  - `AdminPopularCourses.tsx`: Ranking de programas más solicitados con acceso directo a catálogo.
  - `AdminRecentStudents.tsx`: Tabla de últimos ingresos con botón de acceso a ficha.
- **Cursos y Contenidos (`/admin/cursos`, `/admin/cursos/nuevo`, `/admin/cursos/[slug]`)**:
  - `AdminCourseTable.tsx`: Tabla de cursos con buscador, filtro por categoría, indicador de lecciones y acciones de edición/eliminación.
  - `CourseContentBuilder.tsx`: Constructor y cargador completo de cursos con módulos, lecciones, minutos, puntos clave, resultados y vista previa en vivo.
  - **Sincronización Total**: Al crear o editar un curso en administración, se refleja automáticamente en la página principal (`/` vía `HomeFeaturedCourses`), el catálogo completo (`/cursos`), la ficha pública (`/cursos/[slug]`) y el aula virtual.
- **Directorio de Estudiantes / "Jugadores" (`/admin/estudiantes`)**:
  - `StudentDirectory.tsx`: Buscador en tiempo real por nombre, cédula, correo o ciudad; filtros por avance y exportación a CSV.
  - `StudentDetailModal.tsx`: Ficha individual del estudiante con avance lección a lección por curso, exámenes presentados y diplomas verificables.
- **Evaluaciones (`/admin/evaluaciones`)**:
  - `AdminExamManager.tsx`: Selector de curso, configuración del porcentaje mínimo aprobatorio, constructor de preguntas de opción múltiple (A, B, C, D) y selección de respuesta correcta.
- **Certificados y Validador QR (`/admin/certificados`, `/certificados/[code]`, `/certificados/validar`)**:
  - `QrVisual.tsx`: Generador de códigos QR reales escaneables mediante `qrcode` que codifican la URL pública oficial (`.../certificados/[code]`).
  - Al escanear el código QR con cualquier smartphone, redirige automáticamente a la página del certificado donde muestra la acreditación completa y legítima (marca de agua institucional, firmas de Dirección Académica y Secretaría General, fecha, horas y estado Válido).
  - `/certificados/validar`: Validador público por código con soporte para parámetros URL (`?code=...`) y redirección inmediata al diploma completo.
- **Ventas y Facturación (`/admin/ventas`)**:
  - `AdminSalesManager.tsx`: Métricas de ventas, ticket promedio, filtro por pasarela de pago y exportación a CSV.
- **Contenido Web (`/admin/contenido`)**:
  - `AdminContentEditor.tsx`: Edición de textos del Hero de inicio, llamadas a la acción e indicadores con vista previa instantánea.
- **Configuración (`/admin/configuracion`)**:
  - `AdminSettingsPanel.tsx`: Switches de políticas del sistema y reinicio seguro de datos demo.

## 4. Reglas Obligatorias del Proyecto
- Exactamente **un solo `H1`** por página.
- Jerarquía estricta de encabezados (`H1` -> `H2` -> `H3`).
- Footer con atribución obligatoria: **"Desarrollado por K&T ♥"** que redirige a `https://www.kytcode.lat`, corazón dinámico blanco sobre fondo oscuro, y año dinámico `new Date().getFullYear()`.
- Soporte para accesibilidad y `prefers-reduced-motion`.
- Persistencia resiliente: operaciones con Supabase y respaldo automático en caso de falta de conexión o tablas pendientes de migración.
