import { supabase } from './client';
import type { Course, Certificate } from '@/lib/types';
import { baseCourses, certificates as baseCertificates } from '@/lib/data';

export type HomeHeroContent = {
  eyebrow: string;
  headline: string;
  headlineHighlight: string;
  lead: string;
  primaryBtnText: string;
  primaryBtnLink: string;
  secondaryBtnText: string;
  secondaryBtnLink: string;
};

export type HomeStatsContent = {
  students: string;
  courses: string;
  certificates: string;
  countries: string;
  rating: string;
};

export type SiteContent = {
  homeHero: HomeHeroContent;
  homeStats: HomeStatsContent;
  aboutHero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  mission: {
    title: string;
    description: string;
    pillars: string[];
  };
  vision: {
    title: string;
    description: string;
  };
  stats: {
    students: string;
    courses: string;
    certificates: string;
    countries: string;
  };
};

export const defaultHomeHero: HomeHeroContent = {
  eyebrow: 'Bienvenido a EDDIP',
  headline: 'Educación online para profesionales que transforman el mundo',
  headlineHighlight: 'transforman el mundo',
  lead: 'Capacítate con cursos especializados diseñados por expertos. Aprende a tu ritmo, obtén certificados verificables y avanza en tu carrera profesional.',
  primaryBtnText: 'Explorar cursos',
  primaryBtnLink: '/cursos',
  secondaryBtnText: 'Conoce más',
  secondaryBtnLink: '/nosotros',
};

export const defaultHomeStats: HomeStatsContent = {
  students: '12.500+',
  courses: '250+',
  certificates: '8.900+',
  countries: '15+',
  rating: '4.9 / 5',
};

export const defaultSiteContent: SiteContent = {
  homeHero: defaultHomeHero,
  homeStats: defaultHomeStats,
  aboutHero: {
    eyebrow: 'Institución de Educación Superior y Doctrina',
    title: 'Excelencia académica para profesionales de la seguridad y el derecho',
    description:
      'EDDIP lidera programas de educación continua, formación normativa y actualización profesional orientados a servidores públicos, personal de seguridad y juristas en todo el territorio nacional.',
  },
  mission: {
    title: 'Nuestra Misión',
    description:
      'Formar y capacitar integralmente a profesionales en seguridad, derecho de policía, derechos humanos y gestión pública mediante programas estructurados bajo los más altos estándares éticos, técnicos y normativos vigentes en Colombia.',
    pillars: [
      'Rigor doctrinario y fundamentación jurídica',
      'Actualización normativa y jurisprudencial constante',
      'Certificaciones verificables con trazabilidad criptográfica QR',
      'Docentes de amplia trayectoria institucional y académica',
    ],
  },
  vision: {
    title: 'Nuestra Visión',
    description:
      'Ser reconocidos como la plataforma referente a nivel nacional e internacional en formación virtual especializada en convivencia ciudadana, seguridad integral y administración pública, fortaleciendo el ejercicio profesional transparente y efectivo.',
  },
  stats: {
    students: '12.500+',
    courses: '250+',
    certificates: '8.900+',
    countries: '15+',
  },
};

const COURSE_LIST_COLUMNS =
  'id,slug,title,category,short_description,description,price,duration_hours,level,rating,students,featured,gradient,outcomes,modules,' +
  'instructor_name:instructor->>name,instructor_role:instructor->>role,instructor_bio:instructor->>bio';

type CourseListRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  short_description: string | null;
  description: string | null;
  price: number | string;
  duration_hours: number | string;
  level: string | null;
  rating: number | string | null;
  students: number | string | null;
  featured: boolean | null;
  gradient: string | null;
  outcomes: string[] | string | null;
  modules: Course['modules'] | string | null;
  instructor_name: string | null;
  instructor_role: string | null;
  instructor_bio: string | null;
};

const SITE_CONTENT_KEYS = ['homeHero', 'homeStats', 'aboutHero', 'mission', 'vision', 'stats'];

export const contentService = {
  /**
   * Obtiene la oferta de cursos directamente desde Supabase si la tabla existe,
   * unificando imágenes desde la tabla courses, el registro de site_content y respaldo en baseCourses.
   */
  async getCourses(): Promise<Course[]> {
    try {
      // Se seleccionan solo los campos de texto del docente: el JSON completo de `instructor`
      // guarda copias de las imágenes en base64 y multiplica el peso de la consulta.
      const [coursesRes, imagesRes] = await Promise.all([
        supabase.from('courses').select(COURSE_LIST_COLUMNS).order('id', { ascending: true }),
        supabase.from('site_content').select('key, value').like('key', 'course_images_%'),
      ]);

      const siteImagesMap = new Map<string, { image?: string; images?: string[] }>();
      if (!imagesRes.error && imagesRes.data) {
        for (const row of imagesRes.data) {
          if (row.value && typeof row.value === 'object') {
            const v = row.value as { slug?: string; image?: string; images?: string[] };
            if (v.slug) {
              siteImagesMap.set(v.slug, { image: v.image, images: v.images });
            }
          }
        }
      }

      if (!coursesRes.error && coursesRes.data && coursesRes.data.length > 0) {
        const rows = coursesRes.data as unknown as CourseListRow[];

        // Respaldo: imágenes guardadas dentro de `instructor` solo para cursos sin registro en site_content
        const missingImages = rows.filter(r => !siteImagesMap.get(r.slug)?.images?.length).map(r => r.slug);
        if (missingImages.length > 0) {
          const { data: fallback } = await supabase
            .from('courses')
            .select('slug, course_images:instructor->courseImages, course_image:instructor->>courseImage')
            .in('slug', missingImages);
          for (const f of (fallback || []) as { slug: string; course_images: unknown; course_image: string | null }[]) {
            const images = Array.isArray(f.course_images) ? (f.course_images as string[]) : [];
            if (images.length > 0 || f.course_image) {
              siteImagesMap.set(f.slug, { image: f.course_image || images[0], images });
            }
          }
        }

        return rows.map(d => {
          const sc = siteImagesMap.get(d.slug);
          const resolvedImages: string[] = sc?.images && sc.images.length > 0 ? sc.images : sc?.image ? [sc.image] : [];
          const resolvedImage: string = sc?.image || resolvedImages[0] || '';

          return {
            id: d.id,
            slug: d.slug,
            title: d.title,
            category: d.category,
            shortDescription: d.short_description || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            durationHours: Number(d.duration_hours) || 40,
            level: d.level || 'Intermedio',
            gradient: d.gradient || 'linear-gradient(135deg, #0b62dd, #063f9b)',
            instructor: {
              name: d.instructor_name || '',
              role: d.instructor_role || '',
              bio: d.instructor_bio || '',
            },
            outcomes: typeof d.outcomes === 'string' ? JSON.parse(d.outcomes) : d.outcomes || [],
            modules: typeof d.modules === 'string' ? JSON.parse(d.modules) : d.modules || [],
            featured: Boolean(d.featured),
            students: Number(d.students) || 0,
            rating: Number(d.rating) || 4.9,
            image: resolvedImage,
            images: resolvedImages,
          };
        }) as Course[];
      }
    } catch {
      // Fallback
    }
    return baseCourses;
  },

  /**
   * Obtiene la lista de certificados oficiales directamente desde Supabase.
   */
  async getCertificates(): Promise<Certificate[]> {
    try {
      const [certTableRes, siteContentRes] = await Promise.all([
        supabase.from('certificates').select('*').order('created_at', { ascending: false }),
        supabase.from('site_content').select('key, value').like('key', 'certificate_%'),
      ]);

      const map = new Map<string, Certificate>();

      // 1. Semillas base
      for (const bc of baseCertificates) {
        map.set(bc.code.toLowerCase(), bc);
      }

      // 2. Filas de site_content
      if (!siteContentRes.error && siteContentRes.data) {
        for (const row of siteContentRes.data) {
          const val = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
          if (val && val.code) {
            map.set(val.code.toLowerCase(), {
              code: val.code,
              student: val.student || val.studentName,
              documentId: val.documentId,
              courseSlug: val.courseSlug,
              course: val.course || val.courseTitle,
              hours: Number(val.hours) || 40,
              date: val.date || val.issueDate,
              status: val.status || 'Válido',
            });
          }
        }
      }

      // 3. Filas de tabla certificates
      if (!certTableRes.error && certTableRes.data && certTableRes.data.length > 0) {
        for (const d of certTableRes.data) {
          // La tabla certificates no tiene columna de documento: se conserva la cédula registrada en site_content
          map.set(d.code.toLowerCase(), {
            code: d.code,
            student: d.student_name,
            documentId: d.document_id || d.documentId || map.get(d.code.toLowerCase())?.documentId,
            courseSlug: d.course_slug,
            course: d.course_title,
            hours: Number(d.hours) || 40,
            date: d.issue_date,
            status: d.status || 'Válido',
          });
        }
      }

      return Array.from(map.values());
    } catch {
      // Fallback
    }
    return baseCertificates;
  },

  /**
   * Obtiene el contenido institucional y dinámico del sitio desde Supabase.
   */
  async getSiteContent(): Promise<SiteContent> {
    try {
      let localOverride: Partial<SiteContent> = {};
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem('eddip_site_content');
          if (raw) {
            localOverride = JSON.parse(raw);
          }
        } catch {}
      }

      const { data, error } = await supabase
        .from('site_content')
        .select('key, value')
        .in('key', SITE_CONTENT_KEYS);

      if (!error && data && data.length > 0) {
        const parsed: Record<string, unknown> = {};
        for (const row of data) {
          parsed[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        }

        const statsMerged = (parsed.homeStats as HomeStatsContent) || (parsed.stats as any) || localOverride.homeStats || defaultSiteContent.homeStats;

        const resolved: SiteContent = {
          homeHero: (parsed.homeHero as HomeHeroContent) || localOverride.homeHero || defaultSiteContent.homeHero,
          homeStats: statsMerged,
          aboutHero: (parsed.aboutHero as SiteContent['aboutHero']) || localOverride.aboutHero || defaultSiteContent.aboutHero,
          mission: (parsed.mission as SiteContent['mission']) || localOverride.mission || defaultSiteContent.mission,
          vision: (parsed.vision as SiteContent['vision']) || localOverride.vision || defaultSiteContent.vision,
          stats: (parsed.stats as SiteContent['stats']) || {
            students: statsMerged.students || defaultSiteContent.stats.students,
            courses: statsMerged.courses || defaultSiteContent.stats.courses,
            certificates: statsMerged.certificates || defaultSiteContent.stats.certificates,
            countries: statsMerged.countries || defaultSiteContent.stats.countries,
          },
        };

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('eddip_site_content', JSON.stringify(resolved));
          } catch {}
        }

        return resolved;
      }

      if (Object.keys(localOverride).length > 0) {
        return {
          ...defaultSiteContent,
          ...localOverride,
        };
      }
    } catch {
      // Fallback
    }

    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('eddip_site_content');
        if (raw) return { ...defaultSiteContent, ...JSON.parse(raw) };
      } catch {}
    }

    return defaultSiteContent;
  },

  /**
   * Guarda una clave individual en Supabase site_content, actualiza localStorage y emite evento reactivo.
   */
  async updateSiteContent(key: string, value: unknown): Promise<{ success: boolean; error?: string }> {
    try {
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`eddip_site_content_${key}`, JSON.stringify(value));
          const existing = localStorage.getItem('eddip_site_content');
          const merged = existing ? JSON.parse(existing) : {};
          merged[key] = value;
          localStorage.setItem('eddip_site_content', JSON.stringify(merged));
        } catch {}
      }

      const { error } = await supabase
        .from('site_content')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'key' });

      if (error) {
        console.warn(`Aviso al actualizar site_content [${key}]:`, error);
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eddip_site_content_updated', {
          detail: { key, value },
        }));
      }

      return { success: !error, error: error?.message };
    } catch (e: any) {
      console.error(`Error guardando site_content [${key}]:`, e);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('eddip_site_content_updated', {
          detail: { key, value },
        }));
      }
      return { success: false, error: e?.message || 'Error de conexión' };
    }
  },

  /**
   * Guarda de forma concurrente todas las secciones modificadas del sitio en Supabase.
   */
  async saveAllSiteContent(content: Partial<SiteContent>): Promise<{ success: boolean; errors: string[] }> {
    const entries = Object.entries(content);
    const errors: string[] = [];

    // Persistir localmente de inmediato
    if (typeof window !== 'undefined') {
      try {
        const current = localStorage.getItem('eddip_site_content');
        const merged = current ? { ...JSON.parse(current), ...content } : { ...defaultSiteContent, ...content };
        localStorage.setItem('eddip_site_content', JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent('eddip_site_content_updated', { detail: merged }));
      } catch {}
    }

    await Promise.all(
      entries.map(async ([key, value]) => {
        try {
          const { error } = await supabase
            .from('site_content')
            .upsert({
              key,
              value,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'key' });

          if (error) {
            errors.push(`Error en [${key}]: ${error.message}`);
          }
        } catch (e: any) {
          errors.push(`Error en [${key}]: ${e.message}`);
        }
      })
    );

    return {
      success: errors.length === 0,
      errors,
    };
  },
};
