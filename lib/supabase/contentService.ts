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
      'La Escuela de Desarrollo y Doctrina Policial (EDDIP) lidera programas de educación continua, doctrina normativa y actualización profesional orientados a servidores públicos, personal de seguridad y juristas en todo el territorio nacional.',
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

export const contentService = {
  /**
   * Obtiene la oferta de cursos directamente desde Supabase si la tabla existe,
   * unificando imágenes desde la tabla courses, el registro de site_content y respaldo en baseCourses.
   */
  async getCourses(): Promise<Course[]> {
    try {
      const [coursesRes, imagesRes] = await Promise.all([
        supabase.from('courses').select('*').order('id', { ascending: true }),
        supabase.from('site_content').select('key, value').like('key', 'course_images_%'),
      ]);

      const siteImagesMap = new Map<string, { image?: string; images?: string[] }>();
      if (!imagesRes.error && imagesRes.data) {
        for (const row of imagesRes.data) {
          if (row.value && typeof row.value === 'object') {
            const v = row.value as any;
            if (v.slug) {
              siteImagesMap.set(v.slug, { image: v.image, images: v.images });
            }
          }
        }
      }

      if (!coursesRes.error && coursesRes.data && coursesRes.data.length > 0) {
        return coursesRes.data.map((d: any) => {
          const instructorObj = typeof d.instructor === 'string' ? JSON.parse(d.instructor) : (d.instructor || {});
          const sc = siteImagesMap.get(d.slug);

          const resolvedImages: string[] =
            (sc?.images && sc.images.length > 0 ? sc.images : null) ||
            (Array.isArray(d.images) && d.images.length > 0 ? d.images : null) ||
            (typeof d.images === 'string' ? JSON.parse(d.images) : null) ||
            (Array.isArray(instructorObj.courseImages) && instructorObj.courseImages.length > 0 ? instructorObj.courseImages : null) ||
            (Array.isArray(instructorObj.images) && instructorObj.images.length > 0 ? instructorObj.images : null) ||
            (d.image ? [d.image] : null) ||
            (instructorObj.courseImage ? [instructorObj.courseImage] : null) ||
            [];

          const resolvedImage: string =
            sc?.image ||
            d.image ||
            (resolvedImages.length > 0 ? resolvedImages[0] : '') ||
            instructorObj.courseImage ||
            instructorObj.image ||
            '';

          return {
            id: d.id,
            slug: d.slug,
            title: d.title,
            category: d.category,
            shortDescription: d.short_description || d.shortDescription || '',
            description: d.description || '',
            price: Number(d.price) || 0,
            durationHours: Number(d.duration_hours || d.durationHours) || 40,
            level: d.level || 'Intermedio',
            gradient: d.gradient || 'linear-gradient(135deg, #0b62dd, #063f9b)',
            instructor: instructorObj,
            outcomes: typeof d.outcomes === 'string' ? JSON.parse(d.outcomes) : d.outcomes,
            modules: typeof d.modules === 'string' ? JSON.parse(d.modules) : d.modules,
            featured: Boolean(d.featured),
            students: Number(d.students) || 0,
            rating: Number(d.rating) || 4.9,
            image: resolvedImage,
            images: resolvedImages.length > 0 ? resolvedImages : (resolvedImage ? [resolvedImage] : []),
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
          map.set(d.code.toLowerCase(), {
            code: d.code,
            student: d.student_name,
            documentId: d.document_id || d.documentId,
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
        .select('key, value');

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
