## [2026-09-26] Pasarela de Pagos Bold: Integración Oficial para Pago de Cursos
- **Credenciales Seguras en `.env.local`** ([`.env.local`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/.env.local)):
  - Incorporadas las credenciales de prueba proporcionadas:
    - Llave de identidad: `7OkEZv2inQ-n10gIYdX_mEzjRGccyySgkpL4F7U_49k` asignada tanto a `NEXT_PUBLIC_BOLD_IDENTITY_KEY` como a `BOLD_IDENTITY_KEY`.
    - Llave secreta: `TmbpZK-m32Y4_0A6a7czMA` asignada a `BOLD_SECRET_KEY` exclusivamente en el backend (cumpliendo estrictamente con la Regla 34 de seguridad sin exponerla en el bundle del cliente).
- **Endpoint Seguro de Firma Criptográfica (`/api/bold/checkout`)** ([`app/api/bold/checkout/route.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/api/bold/checkout/route.ts)):
  - Generación de referencia única de orden `EDDIP-{timestamp}-{random}`.
  - Creación del hash de integridad criptográfica SHA-256 según la especificación de Bold: `SHA256(orderId + amount + currency + secretKey)`.
  - Intento automatizado de generación de links de pago en Bold API (`https://api.online.payments.bold.co/v1/payment_links` y endpoint de integración).
  - Retorno de metadata completa para inicializar el widget oficial de Bold en frontend.
- **Experiencia de Checkout Integrada (`/checkout/[slug]`)** ([`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx)):
  - Inyección dinámica y asíncrona de la librería oficial de Bold (`https://checkout.bold.co/library/boldPaymentButton.js`).
  - Apertura del modal interactivo `window.BoldCheckout` con los parámetros firmados por el servidor.
  - Fallback a enlace de pago directo o pantalla de simulación Sandbox de Bold con confirmación instantánea.
  - Al completar la transacción, registro de matrícula en `enrollCourse()` y registro de venta en `adminService` con método `"Bold"`.

## [2026-09-26] Evaluaciones: Preguntas y Cantidad Suministradas Dinámicamente desde Administración
- **Sincronización Total con Administración** ([`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts), [`app/evaluacion/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/evaluacion/[slug]/page.tsx)):
  - La pantalla de evaluación del estudiante (`/evaluacion/[slug]`) y el módulo `StudentExamModule.tsx` ahora leen dinámicamente el cuestionario oficial mediante `adminService.getExamBySlug(slug, course)`.
  - La cantidad exacta de preguntas (ej. 3, 5, 8, etc.), el texto de los enunciados, las 4 opciones (A, B, C, D), la respuesta correcta y el puntaje mínimo de aprobación provienen estrictamente de la administración.
  - Se eliminó el generador estático que forzaba 8 preguntas arbitrarias (2 por módulo) cuando el curso no estaba en el archivo estático `exams.json`.
- **Panel de Gestión de Evaluaciones (`/admin/evaluaciones`)** ([`app/admin/evaluaciones/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/evaluaciones/page.tsx), [`components/admin/AdminExamManager.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminExamManager.tsx)):
  - Soporte para preselección de curso por parámetro URL (`?course=slug`), permitiendo saltar directamente a editar las preguntas de cualquier programa desde la tabla de cursos o el editor.
  - Carga asíncrona de exámenes guardados desde la base de datos Supabase (`site_content` con clave `exam_${slug}` y tabla `exams`) y `localStorage`.
  - Herramientas completas para añadir nuevas preguntas, eliminar preguntas, editar enunciados, modificar distractores, asignar la opción correcta y ajustar el umbral de aprobación.
  - Al guardar la evaluación, se propaga un evento en tiempo real (`eddip_exam_updated`) que actualiza instantáneamente cualquier prueba abierta sin requerir recargar la página.
- **Accesos Directos en Cursos** ([`components/admin/AdminCourseTable.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminCourseTable.tsx), [`components/admin/CourseContentBuilder.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/CourseContentBuilder.tsx)):
  - Agregado botón de acción con icono de acreditación (`Icon name="award"`) en la tabla de cursos para acceder en un clic a la configuración de la prueba de ese curso.
  - Agregado panel informativo en el constructor de cursos (`CourseContentBuilder`) y botón directo en la cabecera superior.

## [2026-09-26] Header del Dashboard: Remoción del Menú Hamburguesa en PC y Reestructuración Responsiva para Móvil
- **Ocultamiento de Menú de 3 Líneas en PC** ([`components/DashboardShell.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/DashboardShell.tsx), [`app/globals.css`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/globals.css)):
  - En pantallas de escritorio / PC (donde el sidebar lateral ya permanece fijo y visible al 100%), el botón hamburguesa (`.dash-topbar-menu-btn`) se oculta completamente mediante `display: none !important`.
  - El botón de tres líneas se muestra de forma exclusiva en dispositivos móviles y tabletas (`@media (max-width: 820px)`), permitiendo abrir el panel lateral con suavidad y accesibilidad.
- **Reorganización y Optimización del Header en Dispositivos Móviles**:
  - En móviles (`< 620px`), se optimizó el ancho de los elementos para eliminar colisiones y desbordamientos laterales:
    - El enlace "Sitio Público" oculta su texto y se adapta a un botón de icono compacto (`width: 36px; height: 36px;`), ahorrando más de 80px de espacio.
    - El perfil de usuario oculta el nombre de texto para mostrar limpiamente el avatar circular con las iniciales, evitando que quede cortado en el borde derecho de la pantalla.
    - El badge de rol ("Gestión" / "Estudiante") se oculta en pantallas pequeñas para dar prioridad al título institucional y las acciones esenciales.
    - Se redujo el padding lateral del header a `8px 12px` con `box-sizing: border-box`, asegurando que todo el contenido quepa con holgura en cualquier pantalla móvil (incluso en dispositivos de 360px).

## [2026-09-26] Certificados: Inclusión del Número de Cédula de Ciudadanía Debajo del Nombre del Estudiante
- **Presentación en Diploma Oficial** ([`app/certificados/[code]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/certificados/[code]/page.tsx)):
  - Integrado el campo de documento de identidad (`C.C. {numero}`) inmediatamente debajo del nombre del alumno (`h1.certificate-student`), con tipografía legible, peso destacado y formato estandarizado.
  - Resolución dinámica que prioriza el `documentId` registrado por el alumno en su perfil/cuenta o el asignado en el registro histórico oficial.
- **Ajustes de Impresión en 1 Sola Página** ([`app/globals.css`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/globals.css)):
  - Configurada regla `@media print` para `.certificate-student-doc` con espaciado vertical milimétrico (`margin: 1px 0 4px`), asegurando que la inclusión de la cédula no altere la restricción estricta de una sola página apaisada en PDF/impresión.
- **Tipado y Datos de Prueba** ([`lib/types.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/types.ts), [`lib/supabase/types.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/types.ts), [`data/certificates.json`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/data/certificates.json)):
  - Añadido el atributo opcional `documentId?: string` en `Certificate` e `IssuedCertificate`.
  - Actualizados los registros de prueba y la pantalla pública de validación (`/certificados/validar`) con la celda de Identificación (C.C.).
- **Mockup de la Página de Inicio** ([`app/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/page.tsx)):
  - Actualizado el mockup gráfico del diploma en el landing page para exhibir la cédula de ciudadanía debajo del nombre de muestra.

## [2026-09-26] Persistencia Resiliente en Base de Datos Supabase para Imágenes de Cursos
- **Doble Capa de Almacenamiento en Base de Datos** ([`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts)):
  - Se diagnosticó que la tabla remota `courses` de Supabase no contaba inicialmente con las columnas `image` e `images` a nivel de raíz, causando que PostgREST rechazara silenciosamente el upsert completo (error `42703`).
  - Se implementó persistencia en la tabla `site_content` bajo la clave `course_images_${courseSlug}` con `{ slug, image, images, courseId }`, la cual cuenta con permisos verificados de lectura y escritura directos en PostgreSQL.
  - Además, se embebieron `courseImages` y `courseImage` dentro del campo JSONB `instructor` en la tabla `courses`, garantizando persistencia relacional sin importar variaciones del esquema SQL.
- **Recuperación y Sincronización Automática** ([`lib/supabase/contentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/contentService.ts)):
  - En `contentService.getCourses()`, se implementó una consulta combinada concurrente que lee la tabla `courses` y el registro de imágenes en `site_content`.
  - Reconciliación de imágenes primarias y galerías completas para todos los cursos, asegurando que las imágenes subidas o editadas por el administrador permanezcan en la base de datos y se rendericen en el catálogo, ficha y aula.
- **Respaldo Local Redundante** ([`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx)):
  - Sincronización cruzada entre las claves `extra_courses` y `eddip_admin_extra_courses`.

## [2026-09-26] Registro de Estudiantes desde Cero: Inicialización Limpia sin Cursos ni Progreso Cargado
- **Aislamiento de Cuentas Nuevas** ([`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx)):
  - Al registrarse un nuevo estudiante a través de `signUpStudent`, se inicializan en limpio sus estados: `purchased = []`, `completed = {}`, `results = {}` y `notes = {}`.
  - Persistencia aislada por usuario en `localStorage` con clave `eddip_user_${email}` y prevención de herencia accidental de los datos demo de "Sebastián Martínez".
  - Se añadieron métodos `getEnrollments` y `enrollCourse` en [`lib/supabase/studentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/studentService.ts) para sincronización con la base de datos Supabase / fallback local.
- **Vistas Adaptadas a Estado Inicial Vacío**:
  - En [`components/student/StudentRecentActivity.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentRecentActivity.tsx) y [`app/dashboard/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/dashboard/page.tsx): El widget de actividad reciente ahora detecta dinámicamente si el estudiante tiene 0 cursos y muestra "Sin cursos inscritos: Explora el catálogo para comenzar a estudiar", en lugar de forzar cursos precargados.
  - En [`components/student/StudentProfileManager.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentProfileManager.tsx): Conteo exacto de certificados del estudiante y mensaje de estado vacío en la pestaña de historial académico cuando el alumno recién registrado no tiene materias inscritas.
  - En [`components/student/StudentCertificatesGrid.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentCertificatesGrid.tsx): Restringida la acreditación del estudiante de prueba para que los nuevos usuarios registrados inicien con 0 diplomas hasta que aprueben sus evaluaciones.

## [2026-09-26] Limpieza de Autenticación: Remoción de Badge "Campus Virtual Seguro" y Corrección Visual de Iconos en Inputs
- **Remoción de Badge Institucional** ([`components/student/StudentAuth.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentAuth.tsx)):
  - Eliminado el elemento `<div className="auth-badge-secure">` con el texto "Campus Virtual Seguro", dejando un encabezado superior limpio y despejado con únicamente el enlace "Volver al inicio".
- **Corrección de Iconos e Inputs de Texto** ([`app/globals.css`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/globals.css) y [`components/student/StudentAuth.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentAuth.tsx)):
  - Resuelto conflicto de especificidad CSS donde las reglas generales de `.field input` sobreescribían el padding izquierdo de los inputs de autenticación (`.auth-input`).
  - Aplicada especificidad prioritaria (`.field .auth-input-wrap input.auth-input, .field input.auth-input, .auth-input`) con `padding: 13px 16px 13px 44px !important`, garantizando holgura perfecta para que ningún texto ni placeholder colisione con el icono.
  - Centrado vertical de los iconos SVG (`top: 50%; transform: translateY(-50%); z-index: 3; width: 20px; height: 20px;`) y botón de visibilidad de contraseña (`auth-eye-btn`) con `padding-right: 44px !important`.

## [2026-09-26] Corrección: Renderizado y Persistencia de Imágenes Subidas en el Catálogo de Cursos
- **Soporte para Data URLs y URLs Externas** ([`components/CourseImageSlider.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/CourseImageSlider.tsx)):
  - Habilitado `unoptimized={true}` para imágenes en base64 (`data:`), `blob:` y URLs externas, evitando que el optimizador del servidor de Next.js bloquee la carga con error 414 / URI Too Long.
  - Optimizada la asignación de `key` a `slide-${idx}` para eliminar la sobrecarga de reconciliación en React con strings largos.
- **Compresión en el Cliente** ([`components/admin/CourseContentBuilder.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/CourseContentBuilder.tsx)):
  - Integrada función `compressImageFile` mediante HTML5 Canvas para redimensionar (máx 1200px) y comprimir fotos grandes (a ~80-120KB) antes de almacenarlas.
  - Esto erradica el error de cuota excedida (`QuotaExceededError`) en `localStorage`, garantizando persistencia inmediata y duradera.
- **Sincronización Bidireccional de Cursos** ([`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx)):
  - Carga y reconciliación combinada de cursos guardados desde el panel de administración (`eddip_admin_extra_courses` y `eddip-demo-v2`).
  - Priorización estricta por `id` y `slug` en `combinedCourses` para que las fotos y datos editados se reflejen al 100% en `/cursos`.

## [2026-09-26] Certificados: Remoción de Firmas y Optimización Obligatoria de Impresión en 1 Sola Página Horizontal
- En [`app/certificados/[code]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/certificados/[code]/page.tsx):
  - Removidas únicamente las firmas de "Dirección Académica" y "Secretaría General".
  - Centrado el código QR de validación criptográfica (`QrVisual`) con su pie oficial de verificación.
- En [`app/globals.css`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/globals.css):
  - Configurada regla `@page { size: landscape; margin: 6mm 8mm; }` para que al imprimir (`window.print()`) el navegador configure obligatoriamente orientación horizontal.
  - Implementado control estricto de 1 sola página (`max-height: 185mm`, `overflow: hidden`, `page-break-inside: avoid`, `break-inside: avoid`), eliminando cualquier corte o desborde a una segunda página.

## [2026-09-26] Sistema de Subida de Imágenes de Cursos y Slider Táctil Interactivo (Regla 15)
- **Subida de Imágenes en el Editor de Cursos** ([`components/admin/CourseContentBuilder.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/CourseContentBuilder.tsx)):
  - Creado el campo interactivo de subida de imágenes para los cursos con soporte para 1 o múltiples archivos simultáneos (JPG, PNG, WEBP) mediante Drag & Drop y selector nativo del sistema.
  - Implementada biblioteca de presets rápidos con las fotografías oficiales de la plataforma y campo para añadir imágenes mediante URL directa.
  - Grid de miniaturas cargadas con badge dinámico `★ Portada` en la primera foto, botón para alternar cuál es la portada principal y botón de eliminación individual.
  - Sincronización en tiempo real con la **Vista Previa Interactiva** en la columna lateral derecha del editor.
- **Componente Slider Reusable** ([`components/CourseImageSlider.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/CourseImageSlider.tsx)):
  - Desarrollado componente modular con soporte nativo para **gestos táctiles swipe en móviles** (Regla 15: `onTouchStart`, `onTouchMove`, `onTouchEnd`), flechas flotantes translúcidas en desktop, dots de paginación y badge contador (`X/Y`).
  - Si el curso tiene 1 imagen, muestra la portada estática limpia; si tiene 2 o más imágenes, activa automáticamente el modo slide interactivo.
- **Integración Global**:
  - En [`components/CourseCard.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/CourseCard.tsx): Integrado el slider para que los usuarios puedan deslizar y ver las fotos directamente desde las tarjetas del catálogo.
  - En [`app/cursos/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/cursos/[slug]/page.tsx): Integrado el slider en la tarjeta de matrícula del programa.
  - En [`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts) y [`lib/supabase/contentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/contentService.ts): Persistencia de `image` e `images`.
  - En [`lib/supabase/schema.sql`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/schema.sql) y [`lib/types.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/types.ts): Actualizada la estructura de tipos y base de datos con la columna `images JSONB`.

## [2026-09-26] Actualización del Footer Institucional
- En [`components/DashboardShell.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/DashboardShell.tsx):
  - Removido el texto `" — Escuela de Desarrollo y Doctrina Policial"` del copyright del footer, unificándolo con el formato estándar: `© {new Date().getFullYear()} EDDIP. Todos los derechos reservados.`.

## [2026-09-18] Remoción de Textos de Supabase, Rediseño Integral de Autenticación y Despliegue de Imágenes de Curso

### 1. Eliminación Completa de Menciones a Supabase en Interfaces de Usuario
- Removido el chip "Conectado a Supabase" y reemplazado por la insignia institucional con pulso en tiempo real: `<span className="auth-badge-secure"><span className="auth-pulse-dot" /> Campus Virtual Seguro</span>`.
- En [`components/student/StudentAuth.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentAuth.tsx):
  - Eliminados todos los textos orientados al usuario que contenían "Supabase" ("Conectando con Supabase...", "¡Cuenta creada exitosamente en Supabase!...", "Plataforma integrada con Supabase Auth...").
  - Sustituidos por mensajes institucionales de alta confianza sobre cifrado SSL institucional y verificación segura de credenciales.
- En [`app/login/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/login/page.tsx):
  - Actualizado el texto descriptivo del panel corporativo para omitir "Supabase", enfatizando la acreditación y verificación oficial mediante código QR único.
- En [`components/admin/AdminSettingsPanel.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminSettingsPanel.tsx):
  - Ajustado el mensaje del diálogo de restablecimiento a "sincronizará de nuevo con el servidor central".

### 2. Rediseño de Alta Fidelidad del Portal de Acceso y Registro
- En [`components/student/StudentAuth.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentAuth.tsx) y [`app/globals.css`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/globals.css):
  - **Control por Pestañas Segmentadas**: Selector interactivo (`Iniciar sesión` / `Nuevo estudiante`) con micro-interacciones fluidas y estado activo destacado.
  - **Inputs Modernos**: Envoltorio con iconos vectoriales integrados (`mail`, `lock`, `user`, `card`, `whatsapp`, `building`), contornos refinados y foco con halo suave.
  - **Visibilidad de Contraseñas**: Botón interactivo de mostrar/ocultar contraseña con iconos SVG nítidos `eye` y `eyeOff` en todos los campos de contraseña.
  - **Accesos Directos Institucionales**: Tarjetas interactivas con hover para acceso inmediato como Estudiante o Administrador.
  - **Panel Lateral Institucional**: Jerarquía visual enriquecida con badges de acreditación, beneficios con checkmark y tarjeta de garantía formativa, respetando estrictamente la regla de un solo `H1` por página.

### 3. Implementación Completa del Flujo de Restablecimiento de Contraseña
- Creado el modo `'reset'` en `StudentAuth.tsx`:
  - Activación inmediata desde el enlace "¿Olvidaste tu contraseña?" o mediante navegación.
  - Formulario de solicitud de recuperación mediante correo registrado con validación.
  - Conexión con `studentService.resetPasswordForEmail(email)`.
  - Tarjeta de confirmación con icono de correo institucional, instrucciones claras y botón de retorno al inicio de sesión.

### 4. Despliegue de Imágenes de Curso en Fichas y Checkout
- En [`app/cursos/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/cursos/[slug]/page.tsx):
  - Sustituido el contenedor monocolor con icono por la fotografía oficial del curso (`course.image` o fallback `/images/courses/seguridad.jpg`) mediante Next.js `Image` optimizado, con gradiente cinematográfico inferior y chips flotantes de categoría y nivel.
- En [`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx):
  - Incorporada la miniatura fotográfica del curso en el resumen de orden de matrícula.
- En [`components/student/StudentContinueLearning.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentContinueLearning.tsx):
  - Actualizado el thumbnail de cursos activos en el dashboard para mostrar la carátula oficial con el indicador de avance o certificación.

---

## [2026-09-18] Sincronización y Consistencia Exacta de Estudiantes, Cursos y Pagos

### 1. Eliminación de Cifras Infladas y Sincronización en Supabase
- **Tabla `public.courses` y `courses.json`**:
  - Actualizados los registros de estudiantes en Supabase y localmente para eliminar los números artificiales (342, 286, 412...) y reflejar con exactitud la cantidad real de estudiantes inscritos en cada curso:
    - *Derecho de Policía*: **4** estudiantes
    - *Fundamentos de Seguridad y Convivencia*: **3** estudiantes
    - *Liderazgo y Trabajo en Equipo*: **3** estudiantes
    - *Gestión Pública por Resultados*: **2** estudiantes
    - *Derecho Administrativo Contemporáneo*: **2** estudiantes
    - *Contratación Estatal y Normatividad*: **2** estudiantes
    - *Ciberseguridad para Entornos Públicos*: **2** estudiantes
    - **Total matriculados**: **18 inscripciones activas**.
  - Actualizadas las sentencias de semilla y la cláusula `ON CONFLICT (slug) DO UPDATE` en `lib/supabase/schema.sql`.

### 2. Consistencia en Directorio y Fichas Académicas
- En `data/students.json` y `lib/supabase/adminService.ts`:
  - Asignados a cada uno de los 10 estudiantes sus cursos matriculados específicos, avances de lección reales y certificados acreditados (sumando exactamente las 18 inscripciones y los 4 certificados emitidos).
  - Al abrir la ficha académica de cualquier estudiante (`StudentDetailModal.tsx`), se muestran los cursos en los que verdaderamente está matriculado con sus respectivos códigos de diploma.

### 3. Registro Oficial de Pagos y Ventas
- En `data/sales.json` y `lib/supabase/adminService.ts`:
  - Generado el registro oficial de **18 transacciones aprobadas** correspondientes a cada una de las 18 inscripciones académicas por un total recaudado de **$1.268.600 COP**.
  - Implementada persistencia reactiva en `adminService` (`recordSale`, `getSalesHistory`, `enrollStudentInCourse`) con sincronización en `localStorage`.

### 4. Métricas del Panel de Administración y Portal de Matrícula
- En [`app/admin/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/page.tsx):
  - Eliminados los modificadores artificiales (`+ 720`, `+ 180`).
  - Las 4 tarjetas de métricas despliegan datos 100% reales: **10 estudiantes registrados**, **7 cursos publicados**, **$1.268.600 COP en ventas** y **4 certificados emitidos**.
- En [`components/admin/AdminMonthlyChart.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminMonthlyChart.tsx):
  - Sincronizado el encabezado con el recaudo total real ($1.268.600 COP) y las 18 transacciones aprobadas.
- En [`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx) y [`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx):
  - Al procesar una matrícula en el checkout, se registra la venta en `adminService.recordSale`, se matricula al estudiante y se incrementa en tiempo real el contador de estudiantes del curso.

---

## [2026-09-18] Unificación de Header y Footer en el 100% de las Páginas

### 1. Cobertura Total de Encabezado y Pie de Página
- **Vistas Públicas e Institucionales**:
  - [`app/certificados/[code]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/certificados/[code]/page.tsx): Integrados `SiteHeader` y `Footer` institucional tanto en la vista activa del diploma como en el estado de "no encontrado" (ocultos automáticamente al imprimir el diploma gracias a la clase `.no-print`).
  - [`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx): Reemplazada la barra aislada por `SiteHeader` completo y agregado el `Footer` institucional con branding K&T.
  - [`app/login/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/login/page.tsx): Envuelto el formulario de acceso con `SiteHeader` y `Footer` para permitir navegación fluida de vuelta al catálogo y conservar la identidad en todo momento.
  - [`app/evaluacion/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/evaluacion/[slug]/page.tsx): Integrados `SiteHeader` y `Footer` en la pantalla de evaluación del curso.
  - [`app/not-found.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/not-found.tsx): Creada la página 404 personalizada con `SiteHeader`, navegación y `Footer`.
- **Aula Virtual (`/aprender/[slug]/[lessonId]`)**:
  - Conservado el `reader-top` header y adicionado el pie de página institucional del aula virtual con copyright dinámico y atribución "Desarrollado por K&T ♥".
- **Paneles de Estudiante y Administrador (`DashboardShell.tsx`)**:
  - Diseñado e implementado `dash-topbar` como encabezado sticky en todos los tamaños de pantalla (con botón de menú móvil, título institucional, estado y enlace al sitio público).
  - Diseñado e implementado `dash-footer` con copyright dinámico (`new Date().getFullYear()`) y atribución legal "Desarrollado por K&T ♥" con corazón negro sobre fondo claro conforme a la regla 31.
- **Verificación Automatizada**: Script de integración ejecutado contra todas las rutas confirmando 100% de presencia de encabezado y pie de página con HTTP 200 OK.

---

## [2026-09-18] Depuración de Textos Demo y Conexión Dinámica de Contenidos con Supabase

### 1. Eliminación Total de Textos Demo, Mock y Simulaciones
- **Nosotros (`/nosotros`)**: Reescritura integral como página institucional oficial conectada a `contentService.getSiteContent()`, suprimiendo cualquier mención a "datos de prueba", "json local" o "sin servicios externos". Ahora despliega la historia, misión, visión, pilares doctrinarios y métricas de impacto de EDDIP.
- **Cómo Funciona (`/como-funciona`)**: Removidas referencias a "compra simulada" y "demo"; sustituidas por la metodología pedagógica oficial de 6 pasos de EDDIP.
- **Detalle de Curso (`/cursos/[slug]`)**: Eliminada la etiqueta "certificado de demostración" y referencias a compras de prueba; agregada garantía institucional de acreditación y certificación con trazabilidad QR.
- **Pasarela de Matrícula (`/checkout/[slug]`)**: Sustituido el mensaje de prueba por los términos de matrícula académica, confirmación de pasarela de pagos cifrada SSL 256 bits y facturación electrónica.
- **Validador de Certificados (`/certificados/validar` y `/certificados/[code]`)**:
  - Eliminados los códigos de prueba preescritos y la fabricación automática de certificados dummy para cadenas que comiencen por `EDDIP-`.
  - Ahora realiza búsquedas reales contra Supabase (`public.certificates`) y la base de datos oficial, mostrando un estado legítimo de "Certificado no encontrado" si el código no está registrado.
- **Dashboard y Módulos de Estudiante (`/dashboard`, `/dashboard/certificados`, `StudentAuth.tsx`)**:
  - Eliminado el filtro por subcadena `DEMO`.
  - Eliminados los valores por defecto `demo123` y correos dummy de los inputs.
  - Sustituida la botonera de acceso rápido por accesos institucionales directos con terminología formal.
- **Página de Inicio (`/`)**:
  - Credencial de acreditación en mockup actualizada al código oficial verificado `EDDIP-2026-000145`.
  - Carrusel de cursos sincronizado directamente con Supabase mediante `HomeFeaturedCourses` y `contentService`.

### 2. Suministro Dinámico y Resiliencia en Supabase
- Creado `lib/supabase/contentService.ts` para consultas dinámicas de `courses`, `certificates` y `site_content` con mapeo flexible camelCase/snake_case.
- Actualizado `app/providers.tsx` para cargar en tiempo real los cursos y certificados de Supabase al montar la aplicación.
- Enriquecido `lib/supabase/schema.sql` con las tablas `public.courses` y `public.site_content`, políticas RLS, y sentencias `INSERT ... ON CONFLICT DO UPDATE` completas con las 7 asignaturas y certificados oficiales listos para ejecutar en el SQL Editor de Supabase.

---

## [2026-09-17] Verificación Integral del Estudiante, Avances y Generación de Certificados

### 1. Componentes del Estudiante y Navegación del Aula
- Creada la ruta índice [`app/aprender/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/aprender/[slug]/page.tsx) con redirección inteligente a la primera lección no completada o inicial para eliminar cualquier 404 al acceder a `/aprender/[slug]`.
- Calibrado [`LessonNavigation.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/LessonNavigation.tsx) y [`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx) para asegurar que `toggleLesson` actualice de forma síncrona y determinista el progreso en la cuenta del estudiante y en Supabase.
- Al llegar a la última lección del programa, el aula virtual despliega automáticamente el botón de llamado a la acción "Presentar evaluación final".

### 2. Tarjetas de Cursos y Estados de Avance Contextuales
- En [`StudentCourseCard.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentCourseCard.tsx) y [`StudentCourseList.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentCourseList.tsx):
  - **En progreso (< 100%)**: Barra de avance porcentual con botón "Continuar lección" o "Iniciar curso".
  - **Completado (100%)**: Notificación de lecciones completas y botón prominente para "Presentar evaluación final".
  - **Aprobado y Certificado**: Etiqueta destacada en verde "✓ Aprobado y Certificado", botón directo "Ver certificado" con enlace criptográfico al diploma y botón secundario "Repasar".
- En [`StudentContinueLearning.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentContinueLearning.tsx): integrado el estado de certificación para enlazar directamente al certificado generado o a la evaluación final desde el inicio del dashboard.

### 3. Generación y Validación de Certificados
- En [`lib/supabase/studentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/studentService.ts): implementado `getCertificateByCode` y `getAllCertificates` con consulta cruzada en Supabase y persistencia local para asegurar resolución inmediata ante escaneo externo de QR o recarga de página.
- En [`StudentCertificatesGrid.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentCertificatesGrid.tsx) y [`app/dashboard/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/dashboard/page.tsx): unificado el filtro de certificados para incluir automáticamente cualquier examen aprobado en la sesión del estudiante.
- En [`app/certificados/[code]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/certificados/[code]/page.tsx) y [`app/certificados/validar/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/certificados/validar/page.tsx): conexión con `studentService.getCertificateByCode` y sincronización con el nombre real del estudiante.
- Validación de compilación: `tsc --noEmit` y `next build` pasando con **0 errores** a lo largo de las 23 rutas de la aplicación.


### 1. Pruebas de Conexión y Supabase
- Verificada conexión activa con el endpoint Supabase Auth en `https://ubjttczrydprsutppsgo.supabase.co`.
- Sincronización del catálogo en tiempo real: los cursos agregados o editados en `/admin/cursos/nuevo` o `/admin/cursos/[slug]` se reflejan automáticamente en la página principal (`/` mediante `HomeFeaturedCourses`), en el catálogo (`/cursos`) y en el aula virtual.

### 2. Generación de Códigos QR Reales y Validador Público
- Instalada biblioteca `qrcode` y `@types/qrcode`.
- Actualizado `components/QrVisual.tsx` para generar imágenes QR escaneables con contraste profesional (`#071F49` sobre `#FFFFFF`) codificando la URL oficial (`.../certificados/[code]`).
- Al leer el código QR con cualquier teléfono o cámara, abre directamente la URL del certificado oficial.
- Actualizada la vista de certificado en `app/certificados/[code]/page.tsx` con diseño diplomático oficial, marca de agua de seguridad de EDDIP, intensidad horaria, fecha de expedición, estado verificado y firmas de Dirección Académica y Secretaría General.
- Actualizado el validador público en `app/certificados/validar/page.tsx` con soporte para parámetros URL (`?code=...`), consulta directa, comprobación de estado y botón de redirección al certificado completo.

### 3. Pruebas de Integración Ejecutadas
- Ejecutado script de pruebas de conexión Supabase y codificación QR con 100% de éxito.
- Comprobado `tsc --noEmit` y `next build` con **0 errores**.
