import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styles from './UploadZone.module.css';

const ACCEPTED = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
};

export default function UploadZone({ onUpload, processing }) {
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles.length > 0) onUpload(acceptedFiles[0]);
  }, [onUpload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false),
    disabled: processing,
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.zone} ${dragActive ? styles.active : ''} ${processing ? styles.disabled : ''}`}
    >
      <input {...getInputProps()} />
      <div className={styles.iconBox}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a8fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
          <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
      </div>
      <div className={styles.text}>
        <span className={styles.main}>Drop a document, or <span className={styles.link}>browse files</span></span>
        <span className={styles.sub}>PDF · DOCX · TXT · up to 10 MB</span>
      </div>
      <div className={styles.kbd}>⌘ U</div>
    </div>
  );
}