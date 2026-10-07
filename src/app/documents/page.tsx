'use client';

import { useState, useEffect } from 'react';
import { getEmployees, Employee } from '@/lib/services/employeeService';
import { getDocuments, createFolder, uploadFile, deleteDocument, HRDocument } from '@/lib/services/documentService';
import styles from '../expenses/expenses.module.css';

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  
  const [documents, setDocuments] = useState<HRDocument[]>([]);
  const [currentFolder, setCurrentFolder] = useState<HRDocument | null>(null);
  const [folderPath, setFolderPath] = useState<HRDocument[]>([]);

  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const emps = await getEmployees();
      setEmployees(emps || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (emp: Employee, parentFolder: HRDocument | null = null) => {
    setLoading(true);
    try {
      const docs = await getDocuments(emp.id!, parentFolder?.id || null);
      setDocuments(docs || []);
      setCurrentEmployee(emp);
      setCurrentFolder(parentFolder);
      
      // Update breadcrumbs
      if (!parentFolder) {
        setFolderPath([]);
      } else {
        const idx = folderPath.findIndex(f => f.id === parentFolder.id);
        if (idx !== -1) {
          setFolderPath(folderPath.slice(0, idx + 1));
        } else {
          setFolderPath([...folderPath, parentFolder]);
        }
      }
    } catch (e: any) {
      console.error(e);
      alert('Failed to open: ' + (e.message || JSON.stringify(e)));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEmployee || !folderName.trim()) return;
    try {
      await createFolder(folderName, currentEmployee.id!, currentFolder?.id || null);
      setFolderName('');
      setShowFolderModal(false);
      loadDocuments(currentEmployee, currentFolder);
    } catch (e: any) {
      alert('Failed to create folder: ' + (e.message || JSON.stringify(e)));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentEmployee || !e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    try {
      for (let i = 0; i < e.target.files.length; i++) {
        await uploadFile(e.target.files[i], currentEmployee.id!, currentFolder?.id || null);
      }
      loadDocuments(currentEmployee, currentFolder);
    } catch (err: any) {
      console.error(err);
      alert('Failed to upload file(s): ' + (err.message || JSON.stringify(err)));
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (doc: HRDocument) => {
    if (!confirm(`Delete ${doc.type} "${doc.name}"?`)) return;
    try {
      await deleteDocument(doc.id);
      loadDocuments(currentEmployee!, currentFolder);
    } catch (e) {
      alert('Failed to delete');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Employee Documents</h1>
          <p className={styles.subtitle}>Manage files and folders by employee</p>
        </div>
      </header>

      <div className={styles.tableCard} style={{ padding: '20px' }}>
        {/* Breadcrumbs */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', fontSize: '14px' }}>
          <button 
            onClick={() => { setCurrentEmployee(null); setDocuments([]); setFolderPath([]); }}
            style={{ background: 'none', border: 'none', color: currentEmployee ? '#6366f1' : '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
          >
            🏠 Root (All Employees)
          </button>
          
          {currentEmployee && (
            <>
              <span style={{ color: '#64748b' }}>/</span>
              <button 
                onClick={() => loadDocuments(currentEmployee, null)}
                style={{ background: 'none', border: 'none', color: currentFolder ? '#6366f1' : '#f8fafc', cursor: 'pointer', fontWeight: 500 }}
              >
                {currentEmployee.name}
              </button>
            </>
          )}

          {folderPath.map(folder => (
            <div key={folder.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ color: '#64748b' }}>/</span>
              <button 
                onClick={() => loadDocuments(currentEmployee!, folder)}
                style={{ background: 'none', border: 'none', color: currentFolder?.id === folder.id ? '#f8fafc' : '#6366f1', cursor: 'pointer', fontWeight: 500 }}
              >
                {folder.name}
              </button>
            </div>
          ))}

          {/* Action Buttons */}
          {currentEmployee && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowFolderModal(true)} className={styles.newBtn} style={{ padding: '6px 12px', fontSize: '13px' }}>
                + New Folder
              </button>
              <label className={styles.newBtn} style={{ padding: '6px 12px', fontSize: '13px', cursor: 'pointer', background: '#10b981' }}>
                {uploading ? 'Uploading...' : '+ Upload File'}
                <input type="file" multiple style={{ display: 'none' }} onChange={handleFileUpload} disabled={uploading} />
              </label>
            </div>
          )}
        </div>

        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : !currentEmployee ? (
          // List Employees (Root View)
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {employees.map(emp => (
              <div 
                key={emp.id} 
                onClick={() => loadDocuments(emp)}
                style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', transition: 'background 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(30,41,59,0.8)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(30,41,59,0.5)'}
              >
                <div style={{ fontSize: '24px' }}>👤</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#f8fafc' }}>{emp.name}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{emp.employee_id}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // List Documents inside Employee/Folder
          <div>
            {documents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(30,41,59,0.3)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
                <h3 style={{ color: '#f8fafc', marginBottom: '8px' }}>This folder is currently empty.</h3>
                <p style={{ color: '#94a3b8' }}>Click "+ New Folder" or "+ Upload File" above to add something here.</p>
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Size</th>
                    <th>Uploaded</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map(doc => (
                    <tr 
                      key={doc.id} 
                      onClick={() => doc.type === 'folder' && loadDocuments(currentEmployee!, doc)}
                      style={{ cursor: doc.type === 'folder' ? 'pointer' : 'default', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => { if (doc.type === 'folder') e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (doc.type === 'folder') e.currentTarget.style.background = 'transparent' }}
                    >
                      <td style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {doc.type === 'folder' ? '📁' : '📄'}
                        {doc.type === 'folder' ? (
                          <span style={{ color: '#6366f1', fontWeight: 600 }}>{doc.name}</span>
                        ) : (
                          <a href={doc.file_url} target="_blank" rel="noreferrer" style={{ color: '#e2e8f0', textDecoration: 'none' }}>
                            {doc.name}
                          </a>
                        )}
                      </td>
                      <td style={{ color: '#94a3b8' }}>
                        {doc.type === 'file' && doc.file_size ? (doc.file_size / 1024 / 1024).toFixed(2) + ' MB' : '--'}
                      </td>
                      <td style={{ color: '#94a3b8' }}>
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {doc.type === 'folder' ? (
                          <button onClick={(e) => { e.stopPropagation(); loadDocuments(currentEmployee!, doc); }} className={styles.newBtn} style={{ padding: '4px 12px', fontSize: '12px', background: '#6366f1', color: 'white', marginRight: '8px', border: 'none' }}>
                            Open ➡️
                          </button>
                        ) : (
                          <a href={doc.file_url} download onClick={(e) => e.stopPropagation()} className={styles.newBtn} style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: '1px solid #6366f1', color: '#6366f1', marginRight: '8px', textDecoration: 'none' }}>
                            Download
                          </a>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(doc); }} className={styles.newBtn} style={{ padding: '4px 8px', fontSize: '12px', background: 'transparent', border: '1px solid #ef4444', color: '#ef4444' }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {showFolderModal && (
        <div className={styles.overlay} onClick={() => setShowFolderModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>New Folder</h2>
              <button className={styles.closeBtn} onClick={() => setShowFolderModal(false)}>?</button>
            </div>
            <form onSubmit={handleCreateFolder} className={styles.modalForm}>
              <div className={styles.formGrid}>
                <div className={styles.fg} style={{ gridColumn: '1 / -1' }}>
                  <label className={styles.fl}>Folder Name</label>
                  <input autoFocus required type="text" value={folderName} onChange={e => setFolderName(e.target.value)} className={styles.fi} placeholder="e.g. Contracts" />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" onClick={() => setShowFolderModal(false)} className={styles.cancelBtn}>Cancel</button>
                <button type="submit" className={styles.submitBtn}>Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
