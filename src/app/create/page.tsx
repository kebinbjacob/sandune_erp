"use client";

import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from "@/components/Card";
import styles from "../employees/page.module.css";
import React, { Suspense } from 'react';

function CreateForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const type = searchParams.get('type') || 'Record';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Successfully created new ${type}!`);
    router.back();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1>Create New {type}</h1>
          <p className={styles.subtitle}>Fill in the details below to add a new {type.toLowerCase()} to the system.</p>
        </div>
      </header>
      
      <Card title={`${type} Information`}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Name / Title</label>
              <input type="text" required className={styles.searchInput} placeholder={`Enter ${type.toLowerCase()} name`} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Category / Type</label>
              <select className={styles.selectInput}>
                <option>Standard</option>
                <option>Premium</option>
                <option>Urgent</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Notes / Description</label>
            <textarea className={styles.searchInput} rows={4} style={{ resize: 'vertical' }}></textarea>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            <button type="submit" className={styles.primaryButton}>Save {type}</button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div>Loading form...</div>}>
      <CreateForm />
    </Suspense>
  );
}
