'use client';

import { useEffect, useMemo, useState } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { Footer } from '@/components/Footer';
import { CourseCard } from '@/components/CourseCard';
import { Icon } from '@/lib/icons';
import { useDemo } from '@/app/providers';

export default function CoursesPage() {
  const { courses } = useDemo();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Todos');
  const [order, setOrder] = useState('popular');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const c = p.get('categoria');
      if (c) setCat(c);
    }
  }, []);

  const cats = useMemo(() => {
    return ['Todos', ...Array.from(new Set(courses.map(c => c.category)))];
  }, [courses]);

  const filtered = useMemo(() => {
    let arr = courses.filter(
      c =>
        (cat === 'Todos' || c.category === cat) &&
        `${c.title} ${c.shortDescription}`.toLowerCase().includes(query.toLowerCase())
    );
    if (order === 'price') {
      arr = [...arr].sort((a, b) => a.price - b.price);
    } else if (order === 'new') {
      arr = [...arr].reverse();
    } else {
      arr = [...arr].sort((a, b) => b.students - a.students);
    }
    return arr;
  }, [courses, query, cat, order]);

  return (
    <>
      <SiteHeader />
      <main>
        <section className="page-hero">
          <div className="container">
            <span className="eyebrow">Oferta Académica EDDIP</span>
            <h1>Encuentra el programa ideal para tu crecimiento</h1>
            <p>
              Programas de formación profesional continua en derecho, seguridad y administración pública,
              con certificación oficial y validez nacional.
            </p>
          </div>
        </section>

        <section className="section" style={{ paddingTop: 34 }}>
          <div className="container">
            <div className="catalog-controls">
              <div className="search-box">
                <Icon name="search" />
                <input
                  aria-label="Buscar cursos en el catálogo"
                  placeholder="Buscar por título, temática o competencia..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
              <select
                aria-label="Ordenar cursos"
                className="select"
                value={order}
                onChange={e => setOrder(e.target.value)}
              >
                <option value="popular">Más destacados</option>
                <option value="new">Más recientes</option>
                <option value="price">Menor inversión</option>
              </select>
            </div>

            <div className="filter-row">
              {cats.map(c => (
                <button
                  type="button"
                  className={cat === c ? 'filter-chip active' : 'filter-chip'}
                  key={c}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>

            {filtered.length > 0 ? (
              <div className="course-grid">
                {filtered.map(c => (
                  <CourseCard course={c} key={c.id || c.slug} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="stat-icon">
                  <Icon name="search" />
                </div>
                <h3>No se encontraron cursos</h3>
                <p>Intenta con otros términos o selecciona una categoría diferente de la oferta académica.</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
