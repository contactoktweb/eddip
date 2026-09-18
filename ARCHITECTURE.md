# Arquitectura Técnica del Proyecto EDDIP

## 1. Estructura de Directorios

```
eddip-nextjs-premium/
├── .env.local                    # Credenciales de entorno (Supabase URL & Anon Key)
├── app/
│   ├── layout.tsx                # Root layout con DemoProvider
│   ├── providers.tsx             # Proveedor global de autenticación, cursos y estado
│   ├── globals.css               # Sistema de diseño, tokens, animaciones y responsive
│   ├── login/page.tsx            # Autenticación con StudentAuth y accesos demo
│   ├── dashboard/                # Portal del Estudiante
│   │   ├── page.tsx              # Inicio con métricas y cursos activos
│   │   ├── cursos/page.tsx       # Catálogo personal con filtros y buscador
│   │   ├── certificados/page.tsx # Diplomas obtenidos y validador
│   │   └── perfil/page.tsx       # Datos personales, seguridad y resumen
│   ├── aprender/[slug]/[lessonId]/page.tsx # Aula virtual (temario, visor, notas)
│   ├── evaluacion/[slug]/page.tsx          # Examen final y emisión de diploma
│   └── admin/                    # Portal del Administrador
│       ├── page.tsx              # Resumen administrativo con gráficos y métricas
│       ├── cursos/
│       │   ├── page.tsx          # Tabla de cursos y buscador
│       │   ├── nuevo/page.tsx    # Creador de curso y lecciones
│       │   └── [slug]/page.tsx   # Editor dinámico de curso existente
│       ├── estudiantes/page.tsx  # Directorio con ficha detallada y exportación CSV
│       ├── evaluaciones/page.tsx # Constructor de cuestionarios y preguntas
│       ├── certificados/page.tsx # Control de certificados y emisión manual
│       ├── ventas/page.tsx       # Historial de transacciones y facturación
│       ├── contenido/page.tsx    # Editor de textos y propuesta de valor
│       └── configuracion/page.tsx# Parámetros operativos y mantenimiento
├── components/
│   ├── student/                  # Componentes de Estudiante
│   │   ├── StudentAuth.tsx
│   │   ├── StudentStatGrid.tsx
│   │   ├── StudentContinueLearning.tsx
│   │   ├── StudentRecentActivity.tsx
│   │   ├── StudentCourseCard.tsx
│   │   ├── StudentCourseList.tsx
│   │   ├── LessonSidebar.tsx
│   │   ├── LessonReaderContent.tsx
│   │   ├── LessonNotesWidget.tsx
│   │   ├── LessonNavigation.tsx
│   │   ├── StudentExamModule.tsx
│   │   ├── StudentCertificatesGrid.tsx
│   │   └── StudentProfileManager.tsx
│   ├── admin/                    # Componentes de Administrador
│   │   ├── AdminStatGrid.tsx
│   │   ├── AdminMonthlyChart.tsx
│   │   ├── AdminPopularCourses.tsx
│   │   ├── AdminRecentStudents.tsx
│   │   ├── AdminCourseTable.tsx
│   │   ├── CourseContentBuilder.tsx
│   │   ├── StudentDirectory.tsx
│   │   ├── StudentDetailModal.tsx
│   │   ├── AdminExamManager.tsx
│   │   ├── AdminCertificatesTable.tsx
│   │   ├── AdminSalesManager.tsx
│   │   ├── AdminContentEditor.tsx
│   │   └── AdminSettingsPanel.tsx
│   ├── DashboardShell.tsx        # Shell de navegación unificado (estudiante & admin)
│   └── Footer.tsx                # Footer con firma K&T y fecha dinámica
├── lib/
│   ├── supabase/
│   │   ├── client.ts             # Cliente singleton de Supabase
│   │   ├── types.ts              # Tipos TypeScript para base de datos
│   │   ├── schema.sql            # Script DDL con tablas y políticas RLS
│   │   ├── studentService.ts     # Capa de servicios para estudiantes
│   │   └── adminService.ts       # Capa de servicios para administración
│   ├── types.ts                  # Tipos del dominio educativo
│   └── data.ts                   # Datos base y funciones utilitarias
```

## 2. Flujo de Datos y Resiliencia
- **Autenticación**: Supabase Auth (`supabase.auth.signUp`, `signInWithPassword`, `signOut`, `updateUser`) para cuentas reales de estudiantes y administradores, con accesos de prueba instantáneos.
- **Persistencia Híbrida**: Las capas `studentService.ts` y `adminService.ts` interactúan con las tablas de Supabase. Si una tabla aún no está migrada, opera de forma transparente y sin errores mediante almacenamiento local (`localStorage`).
- **Sincronización de Estado Global**: El hook `useDemo()` centraliza la creación, edición y eliminación de cursos, avance de lecciones, toma de notas, notas de exámenes y emisión de certificados.
