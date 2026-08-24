'use client';

import { useState, useEffect } from 'react';
import { AIChatDrawer } from './AIChatDrawer';
import styles from './AIChat.module.css';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  // Keyboard shortcut listener: Ctrl+K or Cmd+K or Ctrl+/
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === '/')) {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <button
        className={styles.floatingTrigger}
        onClick={() => setIsOpen(true)}
        aria-label="Open AI Assistant"
        title="SanDune Smart AI Assistant (Ctrl+K)"
      >
        <span className={styles.triggerIcon}>✨</span>
        <span>Ask AI Assistant</span>
        <span className={styles.shortcutBadge}>Ctrl+K</span>
      </button>

      <AIChatDrawer isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
