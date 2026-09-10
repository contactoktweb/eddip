# Rutas principales de la demo

## Sitio público
- `/` — Home rediseñada.
- `/cursos` — Catálogo con búsqueda, categorías y orden.
- `/cursos/derecho-de-policia` — Ficha completa de curso.
- `/como-funciona` — Recorrido del estudiante.
- `/nosotros` — Página institucional.
- `/login` — Acceso demo estudiante/administrador.
- `/checkout/derecho-de-policia` — Compra simulada tipo Bold.
- `/certificados/validar` — Validador público.
- `/certificados/EDDIP-2026-000145` — Certificado de prueba.

## Estudiante
- `/dashboard`
- `/dashboard/cursos`
- `/dashboard/certificados`
- `/dashboard/perfil`
- `/aprender/derecho-de-policia/dp-l1`
- `/evaluacion/derecho-de-policia`

## Administrador
- `/admin`
- `/admin/cursos`
- `/admin/cursos/nuevo`
- `/admin/evaluaciones`
- `/admin/estudiantes`
- `/admin/certificados`
- `/admin/ventas`
- `/admin/contenido`
- `/admin/configuracion`

## Datos de prueba
Los archivos están en `/data`:
- `courses.json`
- `students.json`
- `sales.json`
- `certificates.json`
- `exams.json`

Los cambios interactivos de la demo se guardan en `localStorage` para no requerir base de datos.
