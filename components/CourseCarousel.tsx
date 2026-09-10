'use client';

import { useRef, useState } from 'react';
import type { Course } from '@/lib/types';
import { CourseCard } from './CourseCard';

export function CourseCarousel({ courses }: { courses: Course[] }) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / (clientWidth * 0.85));
      setActiveSlide(Math.min(index, courses.length - 1));
    }
  };

  const scrollToSlide = (index: number) => {
    if (!carouselRef.current) return;
    const itemWidth = carouselRef.current.clientWidth * 0.85;
    carouselRef.current.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth',
    });
    setActiveSlide(index);
  };

  return (
    <>
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="premium-course-grid swipeable-carousel"
        aria-label="Lista de cursos destacados"
      >
        {courses.map((course) => (
          <div key={course.id} className="carousel-slide-item">
            <CourseCard course={course} />
          </div>
        ))}
      </div>

      <div className="mobile-carousel-dots" aria-hidden="true">
        {courses.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => scrollToSlide(idx)}
            className={activeSlide === idx ? 'carousel-dot active' : 'carousel-dot'}
            aria-label={`Ir al curso ${idx + 1}`}
          />
        ))}
      </div>
    </>
  );
}
