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
  - **Persistencia en la Nube y Base de Datos**: Registro en `eddip_registered_users` y `admin_students_list` dentro de la tabla `site_content` de Supabase más respaldo local. Todo usuario registrado queda guardado y puede iniciar sesión inmediatamente desde cualquier dispositivo o navegador.
  - **Manejo Resiliente de Autenticación**: Validación de contraseñas garantizada incluso ante límites de envío de correos o falta de confirmación SMTP en Supabase Auth.
  - **Diseño Responsive y Arquitectura Visual**: Distribución a 2 columnas en desktop (`grid-template-columns: 420px minmax(0, 1fr)`) que previene la compresión de la columna lateral institucional, con títulos protegidos contra saltos o cortes de palabras (`word-break: normal; hyphens: none`), insignia *"Educación Superior y Continua"* en una sola línea, y alineación superior (`justify-content: flex-start`) sin espacios blancos vacíos.
  - **Adaptabilidad en Tablet y Móviles**: En resoluciones ≤ 899px el banner se transforma en un encabezado corporativo compacto que sitúa el formulario directamente en el viewport, y en pantallas ≤ 640px los accesos institucionales se apilan a 1 columna para asegurar zonas táctiles mayores a 48px.
  - **Insignia Activa de Seguridad**: Indicador *"Acceso Seguro SSL"* con animación de pulso verde en la barra superior.
  - **Registro Limpio desde Cero**: Al crear una nueva cuenta, el estudiante inicia con 0 cursos comprados, 0 progreso de lecciones, 0 certificados y 0 notas (`purchased: []`, `completed: {}`, `results: {}`). Su almacenamiento queda estrictamente aislado por usuario (`eddip_user_${email}`) sin heredar los cursos de la cuenta de prueba demo.
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
- **Mis Certificados y Diploma Oficial (`/dashboard/certificados`, `/certificados/[code]`, `/certificados/validar`)**:
  - `StudentCertificatesGrid.tsx`: Catálogo de certificados emitidos para el estudiante con código QR real escaneable y enlace de validación pública.
  - `[code]/page.tsx`: Vista oficial del diploma con código QR criptográfico, número de identificación (C.C.) visible y diseño apaisado institucional de una sola página.
  - **Soporte Móvil Horizontal Desplazable (Touch/Swipe - Regla 15)**: En dispositivos móviles y pantallas estrechas, el diploma preserva su estructura apaisada original de alta fidelidad (`min-width: 920px`) mediante un contenedor interactivo con scroll horizontal suave (`overflow-x: auto; touch-action: pan-x pan-y; -webkit-overflow-scrolling: touch;`), permitiendo al usuario moverlo con el dedo de lado a lado sin alterar el ancho del resto de la página. Incluye una píldora visual animada que indica la posibilidad de deslizamiento táctil.
  - **Identidad Institucional Actualizada**: Se eliminó en su totalidad la mención *"Escuela de Desarrollo y Doctrina Policial"*, adoptando de manera unificada *"Educación Superior y Continua"*.
- **Perfil de Estudiante (`/dashboard/perfil`)**:
  - `StudentProfileManager.tsx`: Pestañas de datos personales, cambio de contraseña mediante Supabase Auth y resumen académico del estudiante.

### B. Módulo del Administrador y Sincronización
- **Shell de Navegación Unificado (`DashboardShell.tsx`)**:
  - Encabezado responsivo (`dash-topbar`):
    - En PC / escritorio, el botón de navegación con las tres líneas (`.dash-topbar-menu-btn`) se oculta automáticamente (`display: none`), dado que la barra lateral (`dash-sidebar`) ya se encuentra fija y desplegada al 100%.
    - En dispositivos móviles y tabletas (`<= 820px`), el botón de 3 líneas se muestra como un control táctil (`display: inline-flex`) para desplegar la navegación lateral.
    - En pantallas móviles (`< 620px`), el header se optimiza automáticamente: el botón "Sitio Público" oculta su texto y adopta formato de icono cuadrado, el usuario oculta su nombre para mostrar únicamente el avatar circular, y el badge de rol se oculta para garantizar que ningún botón o texto se desborde o corte.
## Sistema de Roles y Control de Acceso (RBAC) y Designación en Registro
- **Designación de Roles en el Registro Oficial (`/login?mode=register`)**:
  - Al crear una cuenta en la plataforma, el usuario puede designar libremente su rol institucional mediante tarjetas interactivas táctiles y accesibles con micro-animaciones:
    - **Estudiante (`student`)**: Perfil de alumno con acceso directo a aula virtual, temarios, notas, exámenes y certificados oficiales. Al registrarse redirige de inmediato a `/dashboard` (o al checkout si procedía de una compra).
    - **Diseñador Instruccional (`designer`)**: Perfil docente/curricular con permisos exclusivos para estructurar programas académicos, lecciones y multimedia. Al registrarse redirige a `/admin/cursos`.
    - **Administrador (`admin`)**: Perfil directivo con control total de la plataforma, métricas, ventas, usuarios y contenidos. Al registrarse redirige a `/admin`.
  - Persistencia multi-capa: guarda en `supabase.auth.signUp` con metadata `role`, tabla `public.profiles`, tabla `site_content` (`eddip_registered_users`) y almacenamiento local reactivo.
  - Al iniciar sesión con credenciales, la plataforma detecta automáticamente el rol designado del usuario y lo conduce a su área correspondiente.
  - Los administradores también pueden designar roles explícitos al agregar nuevos usuarios desde el modal de `/admin/estudiantes` (`AddStudentModal.tsx`).
- **Módulo de Gestión y Asignación de Roles (`/admin/roles`)**:
  - `AdminRoleManager.tsx`: Panel administrativo avanzado de RBAC integrado en la barra lateral (`DashboardShell.tsx` con icono `shield`).
  - **Métricas de Roles**: 4 tarjetas de estadísticas con micro-interacciones (Total Usuarios, Administradores, Diseñadores Instruccionales y Estudiantes).
  - **Matriz de Privilegios**: Guía visual comparativa desplegable que detalla las facultades y restricciones de cada rol.
  - **Asignación Rápida de Rol**: Conmutador segmented de 1-clic con feedback visual instantáneo (toast notification) y persistencia reactiva en Supabase (`profiles` y `site_content`) y sincronización de sesiones activas.
  - **Protección Antilockout**: Alerta modal de confirmación antes de degradar la cuenta del administrador en sesión activa o el último administrador.
  - **Creación / Asignación Directa de Rol**: Modal para agregar nuevos usuarios institucionales designando su rol (Diseñador, Administrador o Estudiante) con validación de no duplicidad.
  - **Diseño Responsive & Touch Mobile (Regla 10-15)**: Tabla de datos en desktop y tarjetas táctiles optimizadas en móviles (`role-mobile-view`) con zonas de pulsación ≥ 44px y sin desbordamiento horizontal.
  - **Exportación CSV**: Descarga inmediata del censo de usuarios y roles asignados.
- **Administrador (`admin`)**:
  - Acceso total y completo a la plataforma: Dashboard general, Cursos, Evaluaciones, Estudiantes, Certificados, Ventas y Contenido web.
  - Gestión integral de usuarios, finanzas, métricas y eliminación de registros.
- **Diseñador Instruccional (`designer`)**:
  - Acceso exclusivo para **crear y actualizar cursos y programas académicos** (`/admin/cursos`, `/admin/cursos/nuevo`, `/admin/cursos/[slug]`).
  - Navegación lateral simplificada que exhibe únicamente el módulo *Cursos y Lecciones*.
  - Bloqueo de seguridad automático en `DashboardShell.tsx` y redirección en `app/admin/page.tsx`: no puede acceder a ventas, estudiantes, certificados, contenido web ni métricas globales.
  - La eliminación de cursos está restringida exclusivamente a administradores (`!isDesigner`).
- **Estudiante (`student`)**:
  - Acceso a su campus virtual (`/dashboard`, `/dashboard/cursos`, `/dashboard/certificados`, `/dashboard/perfil`).
  - Visualización del reproductor multimedia en lecciones y presentación de exámenes.
  - Bloqueo de seguridad en `DashboardShell.tsx` si intenta acceder a rutas administrativas, con mensaje institucional y botón de regreso al aula virtual.

- **Panel General (`/admin`)**:
  - `AdminStatGrid.tsx`: Métricas consolidadas 100% exactas y consistentes sincronizadas con la base de datos real (estudiantes registrados calculados en tiempo real desde Supabase, cursos publicados, ventas procesadas y certificados emitidos).
  - `AdminMonthlyChart.tsx`: Gráfica y encabezado de ingresos mensuales sincronizados con la recaudación real de pagos.
  - `AdminPopularCourses.tsx`: Ranking de programas con conteo de alumnos matriculados por curso.
  - `AdminRecentStudents.tsx`: Tabla de últimos ingresos alimentada del directorio activo de estudiantes sincronizado con base de datos, con estado vacío si no hay alumnos registrados.
- **Cursos y Contenidos (`/admin/cursos`, `/admin/cursos/nuevo`, `/admin/cursos/[slug]`)**:
  - `AdminCourseTable.tsx`: Tabla de cursos con columna de estudiantes matriculados sincronizada con alumnos reales inscritos.
  - `CourseContentBuilder.tsx`: Constructor y cargador completo de cursos con módulos, lecciones, minutos, puntos clave, resultados, sistema de subida de imágenes múltiples (1 o varias con drag & drop, presets y URLs) y vista previa en vivo con slide táctil interactivo.
  - **Multimedia en Lecciones (Videos e Imágenes)**:
    - `LessonMediaEditor.tsx`: Módulo interactivo dentro del editor de lecciones en administración que permite asociar:
      - **Videos**: Por enlace de YouTube (con validación de URL, extracción de ID y vista previa embebida) o carga directa de archivos de video (.mp4, .webm, .ogg) y URLs de video con reproductor HTML5 en tiempo real.
      - **Imágenes**: Carga directa desde el equipo con compresión optimizada en Canvas, zona drag & drop, presets institucionales y URLs web, con visor de miniaturas y eliminación individual.
    - `LessonMediaViewer.tsx`: Visor audiovisual en el aula del estudiante (`/aprender/[slug]/[lessonId]`) con reproducción en ratio 16:9 de YouTube (modo privacidad mejorada) o video HTML5, galería interactiva de esquemas e infografías, y modal Lightbox para ampliar imágenes en alta resolución con controles de teclado (Escape, flechas).
    - `LessonSidebar.tsx`: Distintivo visual sutil (`Icon name="play"`) en las lecciones que contienen videoclase configurada.
  - `CourseImageSlider.tsx`: Componente modular para tarjetas de catálogo, ficha pública y panel de administración, con soporte completo de gestos táctiles swipe en móviles (Regla 15), navegación prev/next con micro-animaciones, dots y badge indicador.
  - **Persistencia en Base de Datos Supabase**: Almacenamiento persistente en dos capas en PostgreSQL (`site_content` con clave `course_images_${slug}` y campo JSONB `instructor.courseImages` en `courses`, además de redundancia en localStorage), asegurando que todas las imágenes subidas persistan de manera duradera en la base de datos remota.
  - **Sincronización Total**: Al crear o editar un curso en administración, se refleja automáticamente en la página principal (`/` vía `HomeFeaturedCourses`), el catálogo completo (`/cursos`), la ficha pública (`/cursos/[slug]`) y el aula virtual.
- **Directorio de Estudiantes y Sincronización Estricta con Base de Datos (`/admin/estudiantes`)**:
  - `StudentDirectory.tsx`: Buscador en tiempo real por nombre, cédula, correo o ciudad; filtros por avance (`Todos (N)`, `En progreso`, `Completados`), botón de exportación a CSV, botón `+ Registrar estudiante` y estado vacío amigable e interactivo cuando la base de datos no contiene registros (`Todos (0)`).
  - **Eliminación Total de Datos Mock (Falsos)**: Se suprimió la inyección artificial de los 10 estudiantes de prueba de `students.json`. El directorio y las tarjetas métricas reflejan única y exclusivamente lo que existe en Supabase (`public.profiles` y `site_content` con clave `'admin_students_list'`). Si la base de datos está vacía, muestra con fidelidad 0 estudiantes.
  - `AddStudentModal.tsx`: Modal para ingreso de nuevos estudiantes con validación en tiempo real contra registros duplicados por correo o cédula, y guardado directo en Supabase (`public.profiles` y `site_content` con clave `'admin_students_list'`).
  - **Prevención de Duplicados en Registro Web y Panel**: Motor de deduplicación en `adminService.isStudentDuplicate` y `adminService.getAllStudents` que normaliza correos (`email.toLowerCase()`) y cédulas (sin puntos ni guiones), impidiendo que se repita cualquier estudiante tanto en `/login?mode=register` como en `/checkout` o en el panel administrativo.
  - **Sincronización Reactiva**: Actualización en vivo de la tabla y métricas del dashboard ante nuevos registros mediante eventos `eddip_students_updated`.
  - `StudentDetailModal.tsx`: Ficha individual del estudiante con avance real en los cursos específicos en que está matriculado y diplomas acreditados.
- **Evaluaciones (`/admin/evaluaciones`, `/evaluacion/[slug]`)**:
  - `AdminExamManager.tsx`: Constructor interactivo in-line de evaluaciones. Permite añadir preguntas (`+ Añadir pregunta`), editarlas directamente en pantalla (enunciado, 4 opciones y selección visual de respuesta correcta en verde esmeralda), duplicarlas, reordenarlas y eliminarlas, con actualización reactiva instantánea del contador (*"Consta de N preguntas"*), auto-guardado con debounce y botón de guardado manual.
  - **Sincronización Total con el Estudiante**: La cantidad de preguntas, los textos de los enunciados y las opciones de respuesta que ve el estudiante en `/evaluacion/[slug]` y `StudentExamModule.tsx` provienen directamente de lo configurado en la administración, con persistencia en Supabase (`site_content` con clave `exam_${slug}` y `admin_exams_list`), respaldo redundante atómico en `localStorage` (`eddip_exam_${slug}` y `custom_exams`) y propagación reactiva de eventos `eddip_exam_updated`.
- **Certificados y Validador QR (`/admin/certificados`, `/certificados/[code]`, `/certificados/validar`)**:
  - `QrVisual.tsx`: Generador de códigos QR reales escaneables mediante `qrcode` que codifican la URL pública oficial (`.../certificados/[code]`).
  - **Generación y Persistencia Multi-Capa**: Emisión y almacenamiento garantizado en Supabase tabla `certificates` (con saneamiento estricto de UUID para evitar fallos de base de datos) y en `site_content` bajo clave `certificate_${code}`, además de sincronización atómica en localStorage (`eddip_cert_${code}`, `certificates_list`).
  - **Validación Asíncrona sin Bloqueo**: `/certificados/[code]` y `/certificados/validar` implementan estado `loading` con spinner oficial de verificación, consultando en paralelo todas las capas (memoria, almacenamiento local y Supabase) antes de determinar el estado del diploma, evitando pantallas erróneas de "Certificado no encontrado".
  - Al escanear el código QR con cualquier smartphone, redirige automáticamente a la página del certificado donde muestra la acreditación completa y legítima (marca de agua institucional, cédula de ciudadanía C.C., fecha, horas y estado Válido).
  - `/certificados/validar`: Validador público por código con soporte para parámetros URL (`?code=...`) y redirección inmediata al diploma completo.
- **Ventas y Facturación (`/admin/ventas`, `/checkout/[slug]`)**:
  - `AdminSalesManager.tsx`: Historial comercial reactivo sincronizado estrictamente con Supabase (`site_content` con clave `admin_sales_list`).
    - **Sincronización Estricta con Base de Datos**: Eliminación total del fallback a transacciones mock de `sales.json`. Si no hay ventas en la base de datos, el panel muestra fielmente 0 recaudado, 0 inscripciones y estado vacío amigable con botón directo para registrar la primera venta.
    - **Registro de Ventas en Doble Modalidad**:
      - **Venta Automática por Bold**: Al completar el checkout en `/checkout/[slug]`, Bold procesa la orden, matricula al estudiante en Supabase (`enrollStudentInCourse`) y registra automáticamente la transacción en `admin_sales_list` con ID único `VEN-XXXX`, método `'Bold'`, datos reales del comprador y monto pagado, actualizándose al instante en el panel comercial y dashboard general.
      - **Venta Manual desde Panel**: Modal integrado (`+ Registrar venta manual`) para ingresar pagos directos (efectivo, transferencias Bancolombia, datáfono Bold físico, PSE o tarjetas). Permite vincular nombre del estudiante, correo electrónico, documento (cédula) y curso; si la venta se crea como *Aprobado*, matricula de inmediato al estudiante en Supabase.
    - **Actualización Dinámica de Estados**: Selectores interactivos por fila para conmutar estados entre *Aprobado*, *Pendiente*, *Rechazado* y *Reembolsado*, guardando cambios inmediatamente en Supabase.
    - **Métricas Calculadas en Tiempo Real**: Total recaudado, ticket promedio y porcentaje de aprobación recalculados dinámicamente con base en transacciones reales aprobadas.
    - **Filtros y Exportación**: Búsqueda libre, filtrado simultáneo por pasarela y estado, y exportación a formato CSV.
  - **Pasarela de Pagos Bold Oficial**:
    - Integrada en el proceso de matrícula de cursos en `/checkout/[slug]`.
    - Credenciales configuradas en `.env.local` (`NEXT_PUBLIC_BOLD_IDENTITY_KEY` y `BOLD_SECRET_KEY`).
    - Endpoint seguro `/api/bold/checkout` que calcula la referencia única de orden `EDDIP-{timestamp}-{random}` y firma el payload con SHA-256 (`orderId + amount + currency + secretKey`).
    - Carga dinámica del SDK oficial de Bold (`boldPaymentButton.js`) e inicialización de `window.BoldCheckout` con fallback seguro a enlace de pago o Sandbox oficial.
    - Al confirmarse el pago por Bold, matricula de inmediato al estudiante en el curso (`enrollCourse`) y registra la venta formal bajo el método `'Bold'` en Supabase.
  - **Formulario de Acreditación Oficial y Confirmación de Matrícula**:
    - Inicialización 100% limpia sin datos pre-ingresados (campos en blanco con placeholders descriptivos).
    - Selects personalizados (`CustomSelect`) para Departamento y Ciudad basados en el catálogo territorial oficial de Colombia (`lib/colombiaPlaces.ts`).
    - Cascada dinámica: el selector de ciudad se habilita una vez escogido el departamento, con buscador rápido integrado insensible a mayúsculas y acentos.
    - **Requisito Obligatorio de Registro Previo**:
      - Para pagar un curso, el usuario debe tener una cuenta registrada y activa (`role !== 'guest'`).
      - Si el visitante es un usuario no autenticado, el botón de pago en la barra lateral se bloquea y se transforma en un CTA *"Regístrate para Pagar este Curso"* hacia `/login?mode=register&redirect=/checkout/[slug]`.
      - En el encabezado del checkout se exhibe una tarjeta destacada con opciones de registro rápido, inicio de sesión tradicional o login in-line sin salir de la página.
      - La función de pago `pay` valida el estado `isRegistered` e interrumpe cualquier intento no autenticado, redirigiendo con preservación del curso seleccionado.
      - Una vez autenticado, se visualiza una insignia verde de estudiante verificado y sus credenciales se precargan de forma instantánea.
    - **Pantalla de Confirmación con Datos Reales**: Persistencia garantizada (incluso post-redirección de Bold) en `sessionStorage` y `localStorage`. La tarjeta de matrícula confirmada exhibe con exactitud el nombre, cédula, correo, teléfono y ciudad que el usuario ingresó, sin volver a datos demo ni sobreescribir con valores de prueba.
- **Contenido Web (`/admin/contenido`)**:
  - `AdminContentEditor.tsx`: Panel administrativo por pestañas (Inicio, Estadísticas, Nosotros) con vista previa interactiva en tiempo real. Sincronización bidireccional inmediata con Supabase (`site_content`) y persistencia local reactiva vía `contentService.saveAllSiteContent()`.
  - Sincronización en vivo con la web pública mediante el evento reactivo `eddip_site_content_updated`, permitiendo que cambios en el Hero, CTA, estadísticas institucionales o misión/visión se reflejen al instante en todo el portal.

## 4. Reglas Obligatorias del Proyecto
- Exactamente **un solo `H1`** por página.
- Jerarquía estricta de encabezados (`H1` -> `H2` -> `H3`).
- Footer con atribución obligatoria: **"Desarrollado por K&T ♥"** que redirige a `https://www.kytcode.lat`, corazón dinámico blanco sobre fondo oscuro, y año dinámico `new Date().getFullYear()`.
- Cero textos de prueba, "demo", "simulado" o "JSON local" en la interfaz de usuario.
- Soporte para accesibilidad y `prefers-reduced-motion`.
- Persistencia resiliente: operaciones con Supabase y respaldo automático en caso de falta de conexión o tablas pendientes de migración.

## 5. Integración y Suministro Dinámico desde Supabase
- **Servicio Unificado `contentService.ts`**: Encapsula las consultas y persistencia a Supabase para las tablas `courses`, `certificates` y `site_content` (`homeHero`, `homeStats`, `stats`, `aboutHero`, `mission`, `vision`).
- **Página de Cursos (`/cursos`, `/cursos/[slug]`)**: Suministrada directamente mediante `contentService.getCourses()` y sincronizada en el contexto global sin textos de prueba ni simulaciones.
- **Página de Inicio (`/`)**: Totalmente dinámica mediante `HomeHeroSection`, `HomeStatsSection` y `HomeFeaturedCourses`, leyendo y sincronizando en tiempo real con Supabase.
- **Página de Nosotros (`/nosotros`)**: Carga dinámica y reactiva de la historia, misión, visión, pilares doctrinales y estadísticas desde `site_content` en Supabase con escucha de eventos reactivos en vivo.
- **Página de Certificados (`/certificados/validar`, `/certificados/[code]`, `/dashboard/certificados`)**: Validación oficial en tiempo real contra `public.certificates` en Supabase, sin códigos mockeados ni fallbacks sintéticos ficticios.
- **Script SQL Completo (`lib/supabase/schema.sql`)**: Contiene la definición de todas las tablas con RLS, triggers y sentencias `INSERT` con semillas completas para despliegue inmediato en el SQL Editor de Supabase.
