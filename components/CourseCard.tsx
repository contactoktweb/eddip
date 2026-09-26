import Link from 'next/link';
import type { Course } from '@/lib/types';
import { money } from '@/lib/data';
import { Icon } from '@/lib/icons';
import { CourseImageSlider } from './CourseImageSlider';

function getLevelBadge(level: string) {
  const l = level.toLowerCase();
  if (l.includes('avanzado')) {
    return { className: 'badge-emerald', dotColor: '#10b981', label: 'Avanzado' };
  }
  if (l.includes('intermedio')) {
    return { className: 'badge-indigo', dotColor: '#6366f1', label: 'Intermedio' };
  }
  return { className: 'badge-sky', dotColor: '#0ea5e9', label: 'Básico' };
}

export function CourseCard({ course }: { course: Course }) {
  const levelBadge = getLevelBadge(course.level);
  const images = (course.images && course.images.length > 0)
    ? course.images
    : (course.image ? [course.image] : ['/images/courses/seguridad.jpg']);

  return (
    <article className="course-card modern-course-card">
      <div className="card-media-chamber">
        <div className="media-inner">
          <CourseImageSlider
            images={images}
            alt={course.title}
            overlayChildren={
              <div className="media-chips-top">
                <span className={`glass-chip ${levelBadge.className}`}>
                  <span className="live-dot" style={{ backgroundColor: levelBadge.dotColor }} />
                  {levelBadge.label}
                </span>

                <span className="glass-chip chip-duration">
                  <Icon name="clock" size={12} />
                  <span>{course.durationHours}h</span>
                </span>
              </div>
            }
          />
        </div>
      </div>

      <div className="card-content-chamber">
        {/* Category & Rating Bar */}
        <div className="card-kicker-bar">
          <span className="category-micro-tag">{course.category}</span>
          <span className="rating-micro-pill">
            <Icon name="star" size={11} />
            <strong>{course.rating}</strong>
          </span>
        </div>

        {/* Title */}
        <h3 className="course-heading">
          <Link href={`/cursos/${course.slug}`}>
            {course.title}
          </Link>
        </h3>

        {/* Modern Minimalist Footer */}
        <div className="card-action-bar">
          <div className="price-stack">
            <span className="price-caption">Inversión</span>
            <div className="price-value-row">
              <strong className="price-numeric">{money(course.price)}</strong>
              <span className="currency-pill">COP</span>
            </div>
          </div>

          <Link
            href={`/cursos/${course.slug}`}
            className="modern-cta-btn"
            aria-label={`Inscribirme en ${course.title}`}
          >
            <span className="cta-label">Explorar</span>
            <span className="cta-icon-wrap">
              <Icon name="arrow" size={13} />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
