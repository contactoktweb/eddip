# EDDIP Premium — Plataforma educativa Next.js

Rediseño completo de la demo visual/funcional de EDDIP inspirado en la propuesta azul/blanco aprobada: estilo minimalista, profesional, dinámico y con secciones azules de alto contraste.

## Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- CSS puro (sin librerías UI externas)
- Datos demo en JSON
- Persistencia de la demo mediante `localStorage`

## Diseño incluido
- Home premium con hero azul animado y mockup visual del dashboard.
- Secciones alternadas blanco / azul.
- Cards de cursos completamente rediseñadas, minimalistas y personalizadas.
- Categorías, proceso de aprendizaje, certificados verificables, estadísticas y footer.
- Microanimaciones CSS, elementos flotantes, gradientes, formas geométricas y hover states.
- Diseño responsive para desktop, tablet y móvil.
- Referencia visual incluida en `public/design-reference.png`.

## Funcionalidad demo
- Catálogo y filtros de cursos.
- Detalle de curso.
- Checkout simulado estilo Bold.
- Login demo por rol.
- Dashboard del estudiante.
- Seguimiento de progreso y lectura de lecciones.
- Evaluación final funcional.
- Generación visual de certificados y validación por código.
- Panel administrativo.
- Gestión demo de cursos, módulos y lecciones.
- Evaluaciones, estudiantes, certificados, ventas, contenido y configuración.

## Ejecutar
```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Accesos demo
En `/login` usa:
- **Entrar como estudiante**
- **Entrar como administrador**

## Certificado de prueba
Código: `EDDIP-2026-000145`

## Flujo recomendado para la presentación
`/` → `/cursos` → curso → checkout → login estudiante → dashboard → lección → evaluación → certificado → validación.

Para administración:
`/login` → administrador → `/admin` → cursos / evaluaciones / estudiantes / certificados / ventas.

## Alcance
Esta entrega representa la versión visual y funcional de demostración solicitada. Bold, autenticación real, base de datos, correos y generación PDF backend siguen simulados. Los datos se encuentran en `/data/*.json`.
