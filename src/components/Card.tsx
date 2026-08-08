import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
}

export function Card({ title, children, className = '', glass = true }: CardProps) {
  return (
    <div className={`${styles.card} ${glass ? 'glass' : ''} hover-lift ${className}`}>
      {title && <h3 className={styles.title}>{title}</h3>}
      <div className={styles.content}>
        {children}
      </div>
    </div>
  );
}
