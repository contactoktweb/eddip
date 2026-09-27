'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import {
  contentService,
  defaultHomeStats,
  type HomeStatsContent,
} from '@/lib/supabase/contentService';

type Props = {
  initialStats?: HomeStatsContent;
};

export function HomeStatsSection({ initialStats = defaultHomeStats }: Props) {
  const [stats, setStats] = useState<HomeStatsContent>(initialStats);

  useEffect(() => {
    let mounted = true;
    contentService.getSiteContent().then(res => {
      if (mounted && res?.homeStats) {
        setStats(res.homeStats);
      } else if (mounted && res?.stats) {
        setStats(prev => ({
          ...prev,
          students: res.stats.students || prev.students,
          courses: res.stats.courses || prev.courses,
          certificates: res.stats.certificates || prev.certificates,
          countries: res.stats.countries || prev.countries,
        }));
      }
    });

    const handleUpdate = (e: Event) => {
      const custom = e as CustomEvent;
      if (!mounted) return;
      if (custom.detail?.homeStats) {
        setStats(custom.detail.homeStats);
      } else if (custom.detail?.key === 'homeStats' && custom.detail?.value) {
        setStats(custom.detail.value);
      } else if (custom.detail?.stats) {
        setStats(prev => ({
          ...prev,
          students: custom.detail.stats.students || prev.students,
          courses: custom.detail.stats.courses || prev.courses,
          certificates: custom.detail.stats.certificates || prev.certificates,
          countries: custom.detail.stats.countries || prev.countries,
        }));
      } else {
        contentService.getSiteContent().then(res => {
          if (mounted && res?.homeStats) setStats(res.homeStats);
        });
      }
    };

    window.addEventListener('eddip_site_content_updated', handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener('eddip_site_content_updated', handleUpdate);
    };
  }, []);

  return (
    <section className="blue-stats-cta" aria-label="Estadísticas de la plataforma">
      <div className="container stats-cta-grid">
        <div className="stats-copy">
          <h3 className="stats-heading">
            Miles de profesionales
            <br />
            confían en EDDIP
          </h3>
          <p className="stats-subtext">Educación de calidad que genera impacto real.</p>
        </div>

        <div className="stat-item">
          <Icon name="users" size={28} />
          <div>
            <strong>{stats.students || '12.500+'}</strong>
            <span>Estudiantes</span>
          </div>
        </div>

        <div className="stat-item">
          <Icon name="cap" size={28} />
          <div>
            <strong>{stats.courses || '250+'}</strong>
            <span>Cursos disponibles</span>
          </div>
        </div>

        <div className="stat-item">
          <Icon name="award" size={28} />
          <div>
            <strong>{stats.certificates || '8.900+'}</strong>
            <span>Certificados emitidos</span>
          </div>
        </div>

        <div className="stat-item">
          <Icon name="globe" size={28} />
          <div>
            <strong>{stats.countries || '15+'}</strong>
            <span>Países</span>
          </div>
        </div>

        <div className="stats-cta-action">
          <Link className="btn stats-cta-button" href="/cursos">
            <span>Comienza ahora</span>
            <span className="btn-orb light">
              <Icon name="arrow" size={14} />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
