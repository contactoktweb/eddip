'use client';
import Link from 'next/link';
import { useCourseCategories } from '@/lib/useSiteSettings';

const MAX_FOOTER_CATEGORIES = 4;

export function FooterCategoryLinks() {
  const { categories } = useCourseCategories();

  return (
    <ul className="footer-nav-list">
      {categories.slice(0, MAX_FOOTER_CATEGORIES).map(category => (
        <li key={category}>
          <Link href={`/cursos?categoria=${encodeURIComponent(category)}`}>{category}</Link>
        </li>
      ))}
      <li><Link href="/cursos">Todas las categorías</Link></li>
    </ul>
  );
}
