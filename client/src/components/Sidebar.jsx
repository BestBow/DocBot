import { useState } from 'react';
import styles from './Sidebar.module.css';

const TYPE_COLORS = {
  report:   styles.dotTeal,
  contract: styles.dotTeal,
  invoice:  styles.dotAmber,
  email:    styles.dotGray,
  memo:     styles.dotGray,
  proposal: styles.dotBlue,
  resume:   styles.dotBlue,
  other:    styles.dotGray,
};

const TYPE_BADGE = {
  report:   styles.badgeReport,
  contract: styles.badgeContract,
  invoice:  styles.badgeInvoice,
  email:    styles.badgeMemo,
  memo:     styles.badgeMemo,
  proposal: styles.badgeContract,
  resume:   styles.badgeBlue,
  other:    styles.badgeMemo,
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)   return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function fileSizeKb(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

export default function Sidebar({ documents, selectedId, onSelect, loading }) {
  const [search, setSearch] = useState('');

  const filtered = documents.filter(d =>
    d.original_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.document_type ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const totalSize = documents.reduce((sum, d) => sum + (d.file_size ?? 0), 0);
  const storageGB = (totalSize / 1024 / 1024 / 1024).toFixed(1);
  const storagePct = Math.min((storageGB / 10) * 100, 100);

  return (
    <div className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.brandIcon}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a8fa8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <polyline points="10 9 9 9 8 9"/>
          </svg>
        </div>
        <div>
          <div className={styles.brandName}>DocBot</div>
          <div className={styles.brandSub}>V1.0 · DOCUMENT INTELLIGENCE</div>
        </div>
      </div>

      <div className={styles.libRow}>
        <span className={styles.libLabel}>LIBRARY · {documents.length}</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.filterIcon}>
          <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
        </svg>
      </div>

      <div className={styles.searchWrap}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={styles.searchIcon}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className={styles.searchInput}
          placeholder="Search documents"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.docList}>
        {loading && (
          <div className={styles.emptyState}>Loading...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className={styles.emptyState}>No documents yet</div>
        )}
        {filtered.map(doc => (
          <div
            key={doc.id}
            className={`${styles.docItem} ${doc.id === selectedId ? styles.active : ''}`}
            onClick={() => onSelect(doc.id)}
          >
            <div className={`${styles.dot} ${TYPE_COLORS[doc.document_type] ?? styles.dotGray}`} />
            <div className={styles.docInfo}>
              <div className={styles.docName}>{doc.original_name}</div>
              <div className={styles.docMeta}>
                <span className={`${styles.badge} ${TYPE_BADGE[doc.document_type] ?? styles.badgeMemo}`}>
                  {doc.document_type ? doc.document_type.charAt(0).toUpperCase() + doc.document_type.slice(1) : 'Other'}
                </span>
                <span className={styles.metaText}>{timeAgo(doc.created_at)}</span>
                <span className={styles.sep}>·</span>
                <span className={styles.metaText}>{fileSizeKb(doc.file_size)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.storageRow}>
        <div className={styles.storageLabel}>STORAGE</div>
        <div className={styles.storageBar}>
          <div className={styles.storageFill} style={{ width: `${storagePct}%` }} />
        </div>
        <div className={styles.storageText}>{storageGB} / 10 GB</div>
      </div>
    </div>
  );
}