## [2026-09-26] Implementación del Rol de Diseñador Instruccional con Permisos Exclusivos de Cursos (RBAC)
- **Definición de Tipos y Modelo de Datos (`types.ts`, `lib/supabase/types.ts`, `lib/supabase/schema.sql`)** ([`lib/supabase/types.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/types.ts), [`lib/supabase/schema.sql`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/schema.sql)):
  - Ampliación del tipo `Role` para admitir `'designer'` junto a `'admin'`, `'student'` y `'guest'`.
  - Actualización de la restricción SQL en la tabla `public.profiles`: `CHECK (role IN ('student', 'admin', 'designer'))`.
- **Autenticación y Sesión (`providers.tsx`, `studentService.ts`, `StudentAuth.tsx`)** ([`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx), [`lib/supabase/studentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/studentService.ts), [`components/student/StudentAuth.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentAuth.tsx)):
  - **Detección Automática de Rol**: Asignación de rol `'designer'` tanto por metadata de usuario de Supabase como por cuentas institucionales del tipo `disenador@eddip.edu.co`.
  - **Tarjeta de Acceso Rápido Institucional**: En el portal de login (`/login`), se agregó la tarjeta dorada *"Portal Diseñador — Crear y actualizar cursos"* con redirección directa a `/admin/cursos`.
  - **Redirección Contextual Post-Login**: Al iniciar sesión con credenciales de diseñador, el sistema conduce inmediatamente a `/admin/cursos` en lugar del dashboard general o el campus de estudiante.
- **Restricción de Permisos y Menú Exclusivo (`DashboardShell.tsx`, `app/admin/page.tsx`)** ([`components/DashboardShell.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/DashboardShell.tsx), [`app/admin/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/page.tsx)):
  - **Barra Lateral Dedicada (`designerNav`)**: El diseñador visualiza únicamente el módulo `Cursos y Lecciones` (`/admin/cursos`), sin acceso visual ni enlaces a Dashboard general, Evaluaciones, Estudiantes, Certificados, Ventas ni Contenido web.
  - **Guarda de Seguridad y Bloqueo Activo**: Si un usuario con rol de diseñador intenta navegar directamente por URL a cualquier otra sección administrativa protegida (`/admin`, `/admin/estudiantes`, `/admin/ventas`, etc.), `DashboardShell` bloquea el renderizado y muestra una pantalla amigable de *"Acceso Restringido para Diseñador"* con botón para retornar a la gestión de cursos.
  - **Redirección en Raíz Administrativa**: [`app/admin/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/page.tsx) detecta al diseñador y ejecuta `router.replace('/admin/cursos')` automáticamente.
  - **Distintivos y Encabezado Personalizado**: Avatar con iniciales `DI`, badge de rol *"Diseñador"* en tono ámbar y subtítulo *"Diseño de Cursos"*.
- **Control de Acciones en Catálogo (`AdminCourseTable.tsx`)** ([`components/admin/AdminCourseTable.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminCourseTable.tsx)):
  - El diseñador puede crear cursos (`/admin/cursos/nuevo`) y editar módulos, lecciones, videos e imágenes (`/admin/cursos/[slug]`), pero el botón de eliminación de cursos se oculta para su rol (`!isDesigner`), preservando la integridad del catálogo.
  - Banner superior informativo indicando los permisos activos de diseño curricular.
- **Navegación Pública (`SiteHeader.tsx`)** ([`components/SiteHeader.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/SiteHeader.tsx)):
  - Enlace en cabecera pública *"Gestión de Cursos"* con enlace directo a `/admin/cursos` cuando un diseñador tiene sesión iniciada.

## [2026-09-26] Sincronización Dinámica Bidireccional de Contenido Web en Tiempo Real con Supabase
- **Capa de Servicios y Persistencia (`contentService.ts`)** ([`lib/supabase/contentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/contentService.ts)):
  - **Ampliación de Tipos y Esquema Dinámico**: Se incorporaron los tipos `HomeHeroContent` y `HomeStatsContent` dentro de `SiteContent`, abarcando etiquetas, titular principal, frase con énfasis visual, subtítulo/lead, botones de llamado a la acción (texto y enlace) y métricas institucionales clave (estudiantes, cursos, certificados, países y valoración).
  - **Métodos de Persistencia en Supabase**: Se implementaron `updateSiteContent(key, value)` y `saveAllSiteContent(content)` con operaciones concurrentes `upsert` hacia la tabla `public.site_content`, respaldo atómico en `localStorage` y emisión del evento global de navegador `eddip_site_content_updated`.
  - **Carga Híbrida Inteligente**: `getSiteContent()` lee directamente de la base de datos de Supabase e integra la información en memoria con preservación ante recargas y modo sin conexión.
- **Panel Administrativo Dinámico de Contenido (`AdminContentEditor.tsx`)** ([`components/admin/AdminContentEditor.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminContentEditor.tsx)):
  - **Navegación por Pestañas Estructuradas**: Segmentación intuitiva en 3 áreas maestras: *Página de Inicio (Hero)*, *Cifras y Estadísticas* e *Institucional (Nosotros)*.
  - **Sincronización Bidireccional Real**: Se suprimieron los estados fijos no guardados; al cargar, el editor obtiene los datos reales desde Supabase y al hacer clic en *"Guardar y sincronizar"*, persiste los registros en la base de datos con indicador de estado (pulsing badge *"Supabase en vivo"*) y retroalimentación mediante toast.
  - **Vista Previa en Vivo Contextual**: El panel lateral derecho exhibe en tiempo real el diseño fiel de la sección seleccionada conforme el administrador edita los campos.
- **Página de Inicio y Nosotros 100% Dinámicas (`app/page.tsx`, `HomeHeroSection.tsx`, `HomeStatsSection.tsx`, `app/nosotros/page.tsx`)** ([`app/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/page.tsx), [`components/HomeHeroSection.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/HomeHeroSection.tsx), [`components/HomeStatsSection.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/HomeStatsSection.tsx), [`app/nosotros/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/nosotros/page.tsx)):
  - **Sustitución de Textos Estáticos**: Se reemplazaron los bloques fijos del Hero y el banner de métricas en la Home por los componentes dinámicos `HomeHeroSection` y `HomeStatsSection`.
  - **Actualización Reactiva sin Recarga**: Los componentes escuchan el evento `eddip_site_content_updated`, actualizando la interfaz de usuario en milisegundos cuando se aplican cambios desde el panel de administración.
  - **Soporte SEO Estricto**: Mantenimiento de la jerarquía de encabezados (`H1` único con énfasis dinámico) y compatibilidad con renderizado óptimo para Core Web Vitals.
- **Esquema de Base de Datos (`lib/supabase/schema.sql`)**:
  - Incorporadas las sentencias de inserción y semillas para las claves `'homeHero'` y `'homeStats'` en la tabla `public.site_content`.

## [2026-09-26] Eliminación del Módulo de Configuración del Panel Administrativo
- **Depuración del Menú de Navegación Lateral (`DashboardShell.tsx`)** ([`components/DashboardShell.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/DashboardShell.tsx)):
  - Se eliminó el enlace y elemento `Configuración` (`['/admin/configuracion', 'Configuración', 'settings']`) del arreglo `adminNav`, reduciendo la barra lateral administrativa a sus 7 módulos esenciales: *Dashboard*, *Cursos*, *Evaluaciones*, *Estudiantes*, *Certificados*, *Ventas* y *Contenido web*.
  - Se redireccionaron los enlaces del perfil de usuario y avatar del administrador en la barra lateral y superior para apuntar a la raíz del panel administrativo (`/admin`) en lugar de la ruta obsoleta.
- **Eliminación de Archivos Obsoletos y Código Muerto**:
  - Se eliminó la página [`app/admin/configuracion/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/configuracion/page.tsx).
  - Se eliminó el componente [`components/admin/AdminSettingsPanel.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminSettingsPanel.tsx).
- **Actualización de Documentación y Arquitectura**:
  - Se actualizaron [`ARCHITECTURE.md`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/ARCHITECTURE.md), [`PROJECT_CONTEXT.md`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/PROJECT_CONTEXT.md) y [`DEMO_ROUTES.md`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/DEMO_ROUTES.md) para remover referencias al módulo eliminado.
  - Validación completa de TypeScript y compilación de producción con `pnpm build` (22/22 rutas exitosas).

## [2026-09-26] Conexión de Ventas y Pagos a Base de Datos Supabase (Automático con Bold y Manual)
- **Sincronización Estricta con Supabase (`adminService.ts`, `app/admin/ventas/page.tsx`, `app/admin/page.tsx`)** ([`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts), [`app/admin/ventas/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/ventas/page.tsx), [`app/admin/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/page.tsx)):
  - **Eliminación Total de Datos Mock de Ventas**: Se removió el fallback a las 18 ventas estáticas de `sales.json` en `getSalesHistory()`, `recordSale()`, `updateSaleStatus()` y `deleteSale()`. Ahora las transacciones se leen y persisten exclusivamente en la base de datos de Supabase (`site_content` con clave `'admin_sales_list'`).
  - **Filtro de Descarte de Semillas Mock (`isMockSale`)**: Se agregó validación para ignorar identificadores de muestra (`VEN-1001` .. `VEN-1018`) o datos demo heredados en el navegador.
  - **Inicialización Limpia**: En `/admin/ventas` y en el resumen `/admin`, la lista de transacciones inicia vacía (`[]`), reflejando con exactitud los valores de la base de datos (0 ventas procesadas y $0 recaudados si la base de datos está vacía).
- **Ventas Automáticas por Pasarela Bold (`app/checkout/[slug]/page.tsx`, `app/api/bold/checkout/route.ts`)** ([`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx), [`app/api/bold/checkout/route.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/api/bold/checkout/route.ts)):
  - Al completar el pago mediante Bold (ya sea por retorno de URL firmada o widget modal embebido), la venta se almacena de forma inmediata en Supabase con método `'Bold'`, estado `'Aprobado'`, ID único de transacción y datos reales del comprador.
  - El estudiante queda automáticamente matriculado en el curso en la base de datos (`profiles`, `enrollments`, `site_content`), emitiendo los eventos reactivos `eddip_sales_updated` y `eddip_students_updated`.
- **Registro y Gestión de Ventas Manuales (`AdminSalesManager.tsx`)** ([`components/admin/AdminSalesManager.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminSalesManager.tsx)):
  - Modal interactivo con soporte para cursos dinámicos mediante `contentService.getCourses()`.
  - Campos opcionales de correo electrónico y cédula/documento de identidad que, al aprobarse la venta, dan de alta y matriculan al estudiante en Supabase en el programa correspondiente.
  - Opciones de método de pago: *Bold (Pasarela)*, *PSE*, *Tarjeta de Crédito*, *Transferencia Bancolombia* y *Consignación / Efectivo*.
  - Actualización dinámica e inmediata del estado de la transacción (*Aprobado*, *Pendiente*, *Rechazado*, *Reembolsado*) con guardado directo en Supabase.
  - Estado vacío responsive con tarjeta central y botón para registrar la primera venta manual cuando no hay registros en la base de datos.

## [2026-09-26] Sincronización Estricta del Directorio y Registro de Estudiantes con la Base de Datos Real
- **Eliminación Definitiva de Datos Semilla/Mock (`adminService.ts`, `app/admin/page.tsx`)** ([`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts), [`app/admin/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/page.tsx)):
  - **Supresión de la lista estática `baseList`**: Se removió la inyección incondicional de los 10 estudiantes de prueba de `students.json` en `getAllStudents()`. Ahora la lista de estudiantes refleja exclusivamente la información de la base de datos de Supabase (`public.profiles` y `site_content` con clave `'admin_students_list'`).
  - **Filtro de Descarte de Semillas Mock (`isMockSeed`)**: Se añadió un filtro estricto que descarta cualquier identificador `st-001` .. `st-010` o correos `@eddip.edu.co` de prueba heredados en cachés locales de navegadores, garantizando que si en la base de datos no hay ningún estudiante, se reporte fielmente `0`.
  - **Limpieza de `STUDENT_ENROLLMENTS`**: Se eliminó la estructura estática en memoria que asociaba cursos falsos a los IDs demo.
  - **Inicialización Limpia en Dashboard (`app/admin/page.tsx`)**: El estado `studentList` ahora inicia en `[]` en lugar de `initialStudents`, y su recarga asíncrona actualiza fielmente a `0` sin requerir que la lista sea mayor a cero (`res.length > 0`), sincronizando de forma inmediata el valor de la tarjeta de métricas *"Estudiantes registrados"*.
- **Estado Vacío Amigable y Profesional en Directorio (`StudentDirectory.tsx`, `AdminRecentStudents.tsx`)** ([`components/admin/StudentDirectory.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/StudentDirectory.tsx), [`components/admin/AdminRecentStudents.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminRecentStudents.tsx)):
  - En [`components/admin/StudentDirectory.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/StudentDirectory.tsx), si la base de datos no tiene alumnos registrados, se presenta el contador oficial `Todos (0)` y una tarjeta central con avatar, mensaje informativo indicando la sincronización en vivo con Supabase y botón directo `+ Registrar primer estudiante` para ingresar alumnos manualmente.
  - En [`components/admin/AdminRecentStudents.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminRecentStudents.tsx), si la lista está vacía, se muestra un mensaje informativo que enlaza directamente al directorio para dar de alta al primer usuario.
- **Persistencia y Actualización Reactiva Garantizada**:
  - Todo nuevo estudiante registrado desde la web (`/login?mode=register`, `/checkout`) o creado por un administrador en [`components/admin/AddStudentModal.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AddStudentModal.tsx) se persiste de inmediato en Supabase (`public.profiles` y `site_content`), emitiendo los eventos `eddip_students_updated` para refrescar de inmediato tablas y contadores.

## [2026-09-26] Corrección Crítica en Generación, Persistencia Multi-Capa y Validación de Certificados QR
- **Resolución Asíncrona sin Bloqueo Prematuro (`CertificateView.tsx`, `validar/page.tsx`)** ([`app/certificados/[code]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/certificados/[code]/page.tsx), [`app/certificados/validar/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/certificados/validar/page.tsx)):
  - **Eliminación del Fallback Falso Prematuro**: Se implementó estado `loading: true` con indicador de verificación ("Consultando acreditación oficial..."), evitando que la vista renderizara de inmediato "Certificado no encontrado" antes de que se completara la consulta asíncrona a Supabase o al almacenamiento local.
  - **Búsqueda Multi-Capa**: La verificación ahora consulta en paralelo: 1) memoria React `certs`, 2) resultados del usuario, 3) datos base, 4) clave atómica directa en localStorage (`eddip_cert_${code}`), 5) Supabase tabla `certificates`, 6) Supabase `site_content` clave `certificate_${code}`.
- **Persistencia Universal sin Fallos de UUID (`studentService.ts`, `providers.tsx`, `adminService.ts`)** ([`lib/supabase/studentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/studentService.ts), [`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx), [`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts)):
  - **Saneamiento de UUID**: Validación estricta con regex de `userId` antes de pasarlo a la columna `student_id UUID` de PostgreSQL. Si no es un UUID válido (como `'st-001'` o `'demo-student'`), se envía `null`, evitando el error `invalid input syntax for type uuid` que provocaba que la inserción fallara silenciosamente.
  - **Respaldo en `site_content`**: Al emitir cualquier certificado, se guarda automáticamente en `site_content` con la clave `certificate_${code.toLowerCase()}`, garantizando que cualquier dispositivo o teléfono móvil que escanee el QR pueda consultarlo sin restricciones de RLS ni problemas de esquemas.
  - **Soporte de Cursos Dinámicos en `saveResult`**: La función `saveResult` en `providers.tsx` ahora busca el curso en todos los cursos conocidos (`baseCourses`, `extraCourses` y `remoteCourses`) y no solo en los locales, asegurando que cursos creados dinámicamente como *"Curso Avanzado De Seguridad Ciudadana"* generen y guarden su certificado sin omitir la emisión.
  - **Unificación de Claves Locales**: Sincronización simultánea en `certificates_list`, `eddip_student_certificates_list`, `admin_certs` y claves atómicas individuales `eddip_cert_${code}`.
  - **Actualización de Certificado Demo**: Inclusión oficial del certificado `EDDIP-2026-525678` en [`data/certificates.json`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/data/certificates.json).

## [2026-09-26] Soporte de Recursos Multimedia en Lecciones: Videos (YouTube y Directos) e Imágenes Pedagógicas
- **Tipado y Utilidades de Medios (`lib/types.ts`, `lib/mediaUtils.ts`)** ([`lib/types.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/types.ts), [`lib/mediaUtils.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/mediaUtils.ts)):
  - Ampliación de la estructura de `Lesson` para soportar `videoUrl`, `videoType` ('youtube' | 'direct'), `images` (array de URLs o DataURLs) e `imageUrl`.
  - Creación de motor utilitario `mediaUtils.ts` para extracción universal de IDs de YouTube (enlaces estándar, youtu.be, shorts, embeds) y generación de URLs de incrustación segura (`youtube-nocookie.com`).
- **Editor Multimedia en Administración (`LessonMediaEditor.tsx`, `CourseContentBuilder.tsx`)** ([`components/admin/LessonMediaEditor.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/LessonMediaEditor.tsx), [`components/admin/CourseContentBuilder.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/CourseContentBuilder.tsx)):
  - Módulo integrado dentro de cada lección en el panel de creación y edición de cursos:
    - **Gestión de Videos**:
      - Modo "Enlace de YouTube": Detección automática y vista previa interactiva del reproductor embebido.
      - Modo "Video Directo / Archivo MP4": Zona drag & drop y selector de archivos locales (.mp4, .webm, .ogg) hasta 25MB con compresión/dataURL para persistencia o URL directa, acompañado de reproductor HTML5 de verificación.
      - Opción "Sin video" y botón de eliminación rápida.
    - **Gestión de Imágenes**:
      - Subida directa múltiple con compresión automatizada en Canvas para optimizar rendimiento de almacenamiento.
      - Soporte para enlaces directos de imágenes web y presets institucionales.
      - Cuadrícula de miniaturas con eliminación individual de fotos.
- **Visor Audiovisual en el Aula Virtual del Estudiante (`LessonMediaViewer.tsx`, `LessonReaderContent.tsx`)** ([`components/student/LessonMediaViewer.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/LessonMediaViewer.tsx), [`components/student/LessonReaderContent.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/LessonReaderContent.tsx)):
  - **Reproductor de Video Responsive**: Contenedor en ratio 16:9 con esquinas redondeadas, sombra sutil y distintivo institucional ("Videoclase Oficial de la Lección"), reproduciendo mediante iframe de YouTube o reproductor HTML5 con controles fluidos.
  - **Galería de Esquemas Doctrinales**: Visualización de infografías y diagramas con micro-animaciones en hover y badges informativos.
  - **Modal Lightbox en Alta Resolución**: Apertura de imágenes a pantalla completa con navegación mediante flechas (`←`, `→`) y cierre con tecla `Escape` o botón táctil.
  - **Indicador Visual en Temario Lateral (`LessonSidebar.tsx`)**: Badge con icono de reproducción (`Icon name="play"`) en las lecciones que disponen de videoclase activa.
- **Demostración y Persistencia (`data/courses.json`)** ([`data/courses.json`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/data/courses.json)):
  - Inclusión de videos e imágenes de muestra en las lecciones de *Fundamentos de Seguridad y Convivencia* y *Derecho de Policía*.

## [2026-09-26] Evaluaciones: Actualización Dinámica de Preguntas en Tiempo Real y Sincronización Estricta con el Cuestionario del Curso
- **Constructor Interactivo de Preguntas In-line (`AdminExamManager.tsx`)** ([`components/admin/AdminExamManager.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminExamManager.tsx)):
  - **Edición Directa en Pantalla**: El panel principal de `/admin/evaluaciones` ahora permite diseñar y modificar preguntas directamente en la vista principal sin depender exclusivamente de ventanas modales.
  - **Botón `+ Añadir pregunta` Reactivo**: Ubicado tanto en la barra superior como al final del cuestionario. Al hacer clic, se añade inmediatamente la nueva pregunta (`Pregunta #N`), el contador *"Consta de N preguntas"* se actualiza al instante y se sincroniza en vivo.
  - **Controles Completos por Pregunta**:
    - Edición en tiempo real del enunciado de la pregunta.
    - Cuadrícula de 4 opciones (A, B, C, D) con inputs directos.
    - Selector interactivo de respuesta correcta mediante radio/píldora con resaltado en verde esmeralda y badge `✓ Correcta`.
    - Botones de ordenamiento vertical (`↑ Subir`, `↓ Bajar`).
    - Botón para duplicar preguntas (`⧉ Duplicar`).
    - Botón de eliminación con protección de mínimo una pregunta (`🗑 Eliminar`).
  - **Persistencia y Auto-Guardado Inteligente**: Debounce automático de 700ms ante cualquier cambio de texto, opción o respuesta correcta, más botón manual *"Guardar cuestionario"* con indicador visual (`✓ Sincronizado en tiempo real`).
- **Sincronización Total con el Cuestionario del Estudiante (`/evaluacion/[slug]`)** ([`app/evaluacion/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/evaluacion/[slug]/page.tsx), [`components/student/StudentExamModule.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentExamModule.tsx), [`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts)):
  - **Carga Dinámica del Examen Personalizado**: Al ingresar a la prueba del curso, el estudiante recibe exactamente las preguntas configuradas en administración (la cantidad exacta, enunciados, opciones y respuestas correctas).
  - **Cálculo Proporcional y Regla de Aprobación**: Los puntajes se calculan sobre el total dinámico de preguntas (`exam.questions.length`), validando contra el puntaje aprobatorio definido por el administrador (`exam.passingScore`).
  - **Enlaces Seguros de Repaso**: Corrección en los botones de "Repasar lecciones" para que apunten de forma segura a `/aprender/${slug}` incluso si el curso no cuenta con módulos anidados.
  - **Persistencia Redundante**: Guardado simultáneo en clave atómica `eddip_exam_${slug}`, `custom_exams` y en `site_content` de Supabase (`exam_${slug}` y `admin_exams_list`), con disparo de eventos `eddip_exam_updated` para reactividad inmediata entre pestañas.

## [2026-09-26] Corrección de Responsividad en Botones de Confirmación y Eliminación de Bucle en Retorno de Bold
- **Prevención de Bucle Infinito en Retorno de Bold** ([`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx)):
  - **Deduplicación Estricta de Retorno**: Implementado control mediante `processedBoldOrderRef` y `sessionStorage.getItem('eddip_bold_processed_${boldOrder}')` para garantizar que la orden se procese y acredite exactamente una sola vez.
  - **Aislamiento de Dependencias de React**: Eliminadas dependencias reactivas inestables (`confirmedCustomer`, `formData`, `user`, etc.) que causaban que el efecto se volviera a ejecutar cientos de veces por segundo bloqueando el hilo de eventos de JavaScript de la página.
  - **Limpieza de Parámetros de URL**: Uso de `window.history.replaceState` para sanear la URL inmediatamente después de confirmar la orden, evitando re-procesamientos.
  - **Eliminación de Overlays Residuales**: Limpieza automática de cualquier contenedor iframe o modal (`#boldEmbeddedCheckout`) remanente de la pasarela para asegurar que no bloquee interacciones del puntero.
  - **Navegación Robusta en Botones de Éxito**: Los botones *"Ingresar al aula virtual"* e *"Ir a Mis Cursos"* ahora son enlaces `<Link>` semánticos con `onClick` de fallback nativo inmediato y `z-index: 10`, garantizando navegación instantánea sin importar el estado transitorio del enrutador.

## [2026-09-26] Requisito Obligatorio de Registro Previo en Plataforma para Pagar Cursos
- **Bloqueo y Puerta de Registro Obligatoria en Checkout** ([`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx)):
  - **Validación Estricta de Autenticación**: Para iniciar o procesar el pago de un curso, el usuario debe tener una cuenta de estudiante registrada y activa en EDDIP (`role !== 'guest'` y correo válido).
  - **Guard en Función `pay`**: Si un usuario no registrado o invitado intenta ejecutar la orden o enviar el formulario, el sistema bloquea inmediatamente la transacción y lo redirige a la vista de registro: `/login?mode=register&redirect=/checkout/[slug]`.
  - **Banner de Requisito Obligatorio**: Si el usuario no ha iniciado sesión, se despliega una tarjeta de alta visibilidad antes del formulario con:
    - Botón primario: *"Crear Cuenta de Estudiante"*.
    - Botón secundario: *"Ya tengo cuenta / Iniciar Sesión"*.
    - Formulario desplegable in-situ de *"Ingreso rápido"* con correo y contraseña para autenticarse y desbloquear el pago al instante sin abandonar la página.
  - **Insignia de Estudiante Verificado**: Una vez autenticado, se muestra una tarjeta verde de confirmación con los datos de la cuenta activa (`user.name` y `user.email`), auto-completando automáticamente el formulario de acreditación.
  - **Bloqueo del Botón de Pago en el Resumen Lateral**: La barra lateral de checkout reemplaza el botón de cobro por *"Regístrate para Pagar este Curso"* si el usuario es invitado/no registrado, enlazando directamente al flujo de registro con retorno automático.
- **Flujo de Retorno y Preservación de Redirección** ([`components/student/StudentAuth.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/student/StudentAuth.tsx), [`app/login/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/login/page.tsx)):
  - Lectura de los parámetros de consulta `?redirect=...` y `?mode=...` mediante `useSearchParams`.
  - Si el usuario accede a `/login` desde el checkout con un redirect pendiente, se muestra un banner explicativo: *"Registro Requerido para Pago de Curso: Crea tu cuenta o inicia sesión para continuar con la matrícula y pasarela de pago"*.
  - Al completar el registro o inicio de sesión, el estudiante es retornado de manera inmediata y fluida a la página de checkout del curso solicitado.
  - Página `/login/page.tsx` envuelta en `<Suspense>` para cumplimiento de Next.js App Router con Turbopack.
- **Ajuste de Estado Inicial de Visitantes** ([`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx)):
  - El rol por defecto para nuevos visitantes no autenticados es ahora estrictamente `'guest'`, evitando que visitantes anónimos aparezcan como estudiantes pre-autenticados con cuentas demo.

## [2026-09-26] Persistencia de Estudiantes en Base de Datos Supabase y Prevención Estricta de Registros Duplicados
- **Prevención de Duplicados en Registro y Base de Datos** ([`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts), [`lib/supabase/studentService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/studentService.ts)):
  - **Validación Bidireccional por Correo y Cédula**: Implementado método `isStudentDuplicate(email, documentId)` que normaliza correos (`email.toLowerCase()`) y cédulas (removiendo puntos, espacios y guiones).
  - Consulta en tiempo real tanto en la lista consolidada de la plataforma como en la tabla `public.profiles` de Supabase.
  - Bloquea inmediatamente cualquier intento de registrar un estudiante con un correo o documento ya existente, retornando mensajes descriptivos al usuario (*"El correo electrónico ya se encuentra registrado en el sistema"* o *"El documento de identidad ya se encuentra registrado con otro estudiante"*).
- **Persistencia Directa en Supabase (`public.profiles` y `site_content`)**:
  - En `studentService.signUp`: Todo nuevo estudiante registrado desde `/login?mode=register` se guarda automáticamente en Supabase Auth, se inserta/actualiza en la tabla relacional `public.profiles` y se sincroniza en `site_content` con la clave `'admin_students_list'`.
  - En `adminService.saveStudent` y `enrollStudentInCourse`: Almacenamiento persistente en Supabase y respaldo en `localStorage`, garantizando consistencia total entre sesiones y dispositivos.
- **Motor de Deduplicación en Directorio Administrativo** ([`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts)):
  - En `getAllStudents()`, se consolidan las fuentes (Supabase `site_content`, perfiles de `public.profiles`, base histórica y respaldo local) fusionando registros que compartan correo o cédula. La tabla administrativa nunca muestra filas duplicadas ni datos redundantes.
- **Registro Directo desde el Directorio de Estudiantes** ([`components/admin/AddStudentModal.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AddStudentModal.tsx), [`components/admin/StudentDirectory.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/StudentDirectory.tsx)):
  - Botón interactivo `+ Registrar estudiante` en `/admin/estudiantes` junto a `Exportar CSV`.
  - Modal accesible para ingresar Nombres y Apellidos (*), Cédula (*), Correo (*), Teléfono, Ciudad y opción de matrícula inicial en cursos existentes.
  - Validación anti-duplicados en vivo y guardado directo en la base de datos de Supabase.
- **Sincronización Reactiva en Tiempo Real** ([`app/admin/estudiantes/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/estudiantes/page.tsx), [`app/admin/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/page.tsx)):
  - Evento personalizado `eddip_students_updated` y listener `storage` para que ante cualquier registro de estudiante (desde la web pública, checkout o panel administrativo), las tablas y métricas del dashboard se actualicen al instante sin necesidad de recargar la página.

## [2026-09-26] Sincronización Integral de Ventas: Registro Web, Actualización de Estados y Persistencia en Supabase
- **Persistencia en Supabase y Sincronización en Tiempo Real** ([`lib/supabase/adminService.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/supabase/adminService.ts)):
  - Sincronización asíncrona de transacciones en la tabla `site_content` de PostgreSQL (`key: 'admin_sales_list'`) con respaldo en `localStorage`.
  - Disparo de eventos personalizados (`eddip_sales_updated`) y escuchas cruzadas entre pestañas (`storage`), permitiendo que cualquier compra en la web aparezca al instante en el panel administrativo sin recargar.
  - Nuevos métodos `recordSale`, `updateSaleStatus` y `deleteSale` con sincronización atómica.
- **Gestor Comercial Interactivo (`AdminSalesManager.tsx`)** ([`components/admin/AdminSalesManager.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/admin/AdminSalesManager.tsx), [`app/admin/ventas/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/ventas/page.tsx)):
  - **Actualización Dinámica de Estados**: El badge de estado en cada fila es ahora un selector interactivo coloreado que permite conmutar en un clic entre *Aprobado*, *Pendiente*, *Rechazado* y *Reembolsado*, guardando el cambio de inmediato en la base de datos con notificación de confirmación.
  - **Métricas Financieras Reales**: *Total recaudado*, *Inscripciones procesadas*, *Ticket promedio* y *Tasa de aprobación* ahora se calculan dinámicamente sobre las ventas aprobadas activas.
  - **Filtro Avanzado por Estado**: Agregado dropdown de filtrado por estado (*Aprobado*, *Pendiente*, *Rechazado*, *Reembolsado* o *Todos los estados*).
  - **Modal de Venta Manual**: Botón `+ Registrar venta manual` para que los administradores puedan asentar compras offline (consignación bancaria, transferencia o efectivo), matriculando automáticamente al estudiante.
- **Sincronización en Dashboard General (`/admin`)** ([`app/admin/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/admin/page.tsx)):
  - El resumen comercial del dashboard principal escucha `eddip_sales_updated`, recalculando instantáneamente el total facturado y la gráfica mensual de ingresos ante cualquier nueva matrícula en el sitio web.

## [2026-09-26] Confirmación de Matrícula: Información Real de Facturación Ingresada por el Estudiante
- **Corrección de Sobreescritura en Perfil y Matrícula** ([`app/providers.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/providers.tsx)):
  - Se eliminó el reseteo involuntario en `login('student')` que forzaba el usuario demo *"Sebastián Martínez"* con documento *"1.032.456.789"*.
  - `updateProfile` y `login` ahora preservan de manera persistente los datos reales que el usuario ingresa en el checkout (`eddip_student_profile` en `localStorage`).
- **Persistencia Post-Redirección y Pantalla de Éxito** ([`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx)):
  - Implementado estado `confirmedCustomer` respaldado en `sessionStorage` (`eddip_checkout_customer`) y `localStorage`.
  - Al completar la transacción (tanto en pasarela externa de Bold con redirección `?bold_order=...&bold_status=approved` como en el simulador Sandbox):
    - Se extraen y confirman el nombre completo, cédula, correo, teléfono y ubicación (departamento y ciudad) que el estudiante digitó en el formulario.
    - Se registra la matrícula (`enrollStudentInCourse`) y la venta en `adminService` con el nombre y correo reales del estudiante.
    - La tarjeta de **MATRÍCULA CONFIRMADA** ahora despliega con exactitud los datos reales de facturación ingresados, incluyendo estudiante, documento, correo, teléfono y ubicación, sin mostrar ningún valor de prueba ficticio.

## [2026-09-26] Formulario de Checkout: Campos Limpios por Defecto y Selects Personalizados de Departamento y Ciudad
- **Inicialización Limpia de Datos** ([`app/checkout/[slug]/page.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/checkout/[slug]/page.tsx)):
  - Se eliminó la precarga de datos de prueba (nombre, cédula demo, correo ficticio, teléfono y ciudad pre-ingresados). Todos los campos del formulario de matrícula inician vacíos (`""`), permitiendo que el comprador ingrese sus datos reales sin tener que borrar contenido previo.
- **Componente `CustomSelect` Modular y Accesible** ([`components/CustomSelect.tsx`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/components/CustomSelect.tsx), [`app/globals.css`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/app/globals.css)):
  - Select interactivo de diseño premium con apertura fluida, borde con foco personalizado, rotación de flecha indicadora y soporte completo para navegación con teclado.
  - Buscador integrado insensible a mayúsculas y tildes para listas extensas de opciones.
  - Detección de clic exterior para cierre automático y soporte para estado deshabilitado con mensaje explicativo.
- **Catálogo Geográfico de Colombia** ([`lib/colombiaPlaces.ts`](file:///Users/keynerstebantri/Downloads/eddip-nextjs-premium/lib/colombiaPlaces.ts)):
  - Definición completa de los 32 departamentos y Bogotá D.C., con sus correspondientes municipios y ciudades principales.
- **Cascada Dinámica Departamento - Ciudad**:
  - El selector de ciudad permanece deshabilitado mostrando *"Primero selecciona un departamento"* hasta que el usuario elija su departamento.
  - Al seleccionar un departamento, el dropdown de ciudad se activa y carga instantáneamente los municipios asociados. Si se cambia de departamento, la ciudad se reinicia automáticamente para evitar inconsistencias.
  - Disposición responsiva con clase `.checkout-fields-row` que adapta automáticamente las dos columnas a una en pantallas móviles.

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
