import { supabase } from './client';
import type { Course, Certificate } from '@/lib/types';
import { baseCourses, certificates as baseCertificates } from '@/lib/data';

export type SiteContent = {
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

export const defaultSiteContent: SiteContent = {
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
    courses: '25+',
    certificates: '8.900+',
    countries: '15+',
  },
};

export const contentService = {
  /**
   * Obtiene la oferta de cursos directamente desde Supabase si la tabla existe,
   * con respaldo resiliente en baseCourses.
   */
  async getCourses(): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('id', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((d: any) => ({
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
          instructor: typeof d.instructor === 'string' ? JSON.parse(d.instructor) : d.instructor,
          outcomes: typeof d.outcomes === 'string' ? JSON.parse(d.outcomes) : d.outcomes,
          modules: typeof d.modules === 'string' ? JSON.parse(d.modules) : d.modules,
          featured: Boolean(d.featured),
          students: Number(d.students) || 0,
          rating: Number(d.rating) || 4.9,
        })) as Course[];
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
      const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(d => ({
          code: d.code,
          student: d.student_name,
          courseSlug: d.course_slug,
          course: d.course_title,
          hours: d.hours,
          date: d.issue_date,
          status: d.status,
        }));
      }
    } catch {
      // Fallback
    }
    return baseCertificates;
  },

  /**
   * Obtiene el contenido institucional desde Supabase.
   */
  async getSiteContent(): Promise<SiteContent> {
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('key, value');

      if (!error && data && data.length > 0) {
        const parsed: Record<string, unknown> = {};
        for (const row of data) {
          parsed[row.key] = typeof row.value === 'string' ? JSON.parse(row.value) : row.value;
        }
        return {
          aboutHero: (parsed.aboutHero as SiteContent['aboutHero']) || defaultSiteContent.aboutHero,
          mission: (parsed.mission as SiteContent['mission']) || defaultSiteContent.mission,
          vision: (parsed.vision as SiteContent['vision']) || defaultSiteContent.vision,
          stats: (parsed.stats as SiteContent['stats']) || defaultSiteContent.stats,
        };
      }
    } catch {
      // Fallback
    }
    return defaultSiteContent;
  },
};
