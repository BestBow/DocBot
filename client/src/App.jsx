import { useState, useEffect } from 'react';
import Sidebar        from './components/Sidebar';
import UploadZone     from './components/UploadZone';
import ProcessingView from './components/ProcessingView';
import ResultsPanel   from './components/ResultsPanel';
import { useDocuments } from './hooks/useDocuments';
import { getDocument }  from './api/documents';
import styles from './App.module.css';

export default function App() {
  const { documents, loading, processing, error, upload, remove } = useDocuments();
  const [selectedId,  setSelectedId]  = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [procStep,    setProcStep]     = useState(0);
  const [loadingDoc,  setLoadingDoc]   = useState(false);

  useEffect(() => {
    if (!selectedId) { setSelectedDoc(null); return; }
    setLoadingDoc(true);
    getDocument(selectedId)
      .then(setSelectedDoc)
      .finally(() => setLoadingDoc(false));
  }, [selectedId]);

  useEffect(() => {
    if (!processing) { setProcStep(0); return; }
    const interval = setInterval(() => {
      setProcStep(s => Math.min(s + 1, 5));
    }, 700);
    return () => clearInterval(interval);
  }, [processing]);

  async function handleUpload(file) {
    try {
      const result = await upload(file);
      setSelectedId(result.document.id);
    } catch {}
  }

  async function handleDelete(id) {
    await remove(id);
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedDoc(null);
    }
  }

  return (
    <div className={styles.app}>
      <div className={styles.sidebarWrap}>
        <Sidebar
          documents={documents}
          selectedId={selectedId}
          onSelect={setSelectedId}
          loading={loading}
        />
      </div>

      <div className={styles.main}>
        <div className={styles.topbar}>
          <div className={styles.shortcuts}>
            <span className={styles.kbd}>⌘K</span>
          </div>
          <div className={styles.topActions}>
            <button className={styles.askBtn}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3a8fa8" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
              Ask DocBot
            </button>
            <label className={styles.newBtn}>
              <input type="file" accept=".pdf,.docx,.txt" style={{ display: 'none' }} onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
              + New document
            </label>
            <div className={styles.avatar}>SG</div>
          </div>
        </div>

        <UploadZone onUpload={handleUpload} processing={processing} />

        {error && (
          <div className={styles.error}>{error}</div>
        )}

        {processing && <ProcessingView step={procStep} />}

        {!processing && !selectedDoc && !loadingDoc && (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3a4455" strokeWidth="1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
            <div className={styles.emptyTitle}>No document selected</div>
            <div className={styles.emptySub}>Upload a document or select one from the library</div>
          </div>
        )}

        {!processing && (selectedDoc || loadingDoc) && (
          <ResultsPanel
            doc={selectedDoc}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}