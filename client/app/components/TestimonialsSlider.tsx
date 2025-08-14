"use client";

import { useState, useEffect } from 'react';
import styles from '../Home.module.css';

export interface Testimonial {
  quote: string;
  author: string;
}

/**
 * Renders a simple testimonial slider with navigation dots.  The slider
 * automatically cycles through the provided testimonials every 5 seconds.
 *
 * This component is marked as a client component because it uses React
 * hooks for state and effects.  It receives its data via props from the
 * server component.  The surrounding HTML structure and styling live in
 * Home.module.css.
 */
export default function TestimonialsSlider({ testimonials }: { testimonials: Testimonial[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Advance the slider every five seconds.
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <div className={styles.testimonialSlider}>
      {testimonials.map((t, idx) => (
        <div
          key={idx}
          className={`${styles.testimonialItem} ${idx === activeIndex ? styles.active : ''}`}
        >
          <p className={styles.testimonialQuote}>“{t.quote}”</p>
          <p className={styles.testimonialAuthor}>— {t.author}</p>
        </div>
      ))}
      <div className={styles.testimonialNav}>
        {testimonials.map((_, idx) => (
          <span
            key={idx}
            className={`${styles.testimonialNavButton} ${idx === activeIndex ? styles.active : ''}`}
            onClick={() => setActiveIndex(idx)}
            role="button"
            tabIndex={0}
          />
        ))}
      </div>
    </div>
  );
}