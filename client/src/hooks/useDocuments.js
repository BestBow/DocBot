import { useState, useEffect, useCallback } from 'react';
import { listDocuments, uploadDocument, deleteDocument } from '../api/documents';

export function useDocuments() {
  const [documents,   setDocuments]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [processing,  setProcessing]  = useState(false);
  const [error,       setError]       = useState(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  async function upload(file, onProgress) {
    setProcessing(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const result = await uploadDocument(formData, onProgress);
      await fetchDocuments();
      return result;
    } catch (err) {
      const msg = err.response?.data?.error ?? 'Upload failed';
      setError(msg);
      throw new Error(msg);
    } finally {
      setProcessing(false);
    }
  }

  async function remove(id) {
    try {
      await deleteDocument(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
    } catch {
      setError('Failed to delete document');
    }
  }

  return { documents, loading, processing, error, upload, remove, fetchDocuments };
}