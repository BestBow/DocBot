import { useState } from 'react';
import styles from './ResultsPanel.module.css';
import { exportDocument } from '../api/documents';

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} days ago`;
}

const PRIORITY_CLASS = {
  high:   styles.priHigh,
  medium: styles.priMed,
  low:    styles.priLow,
};

const TYPE_DOT = {
  report:   '#1D9E75',
  contract: '#1D9E75',
  invoice:  '#BA7517',
  email:    '#4a5568',
  memo:     '#4a5568',
  proposal: '#378ADD',
  resume:   '#378ADD',
  other:    '#4a5568',
};

async function handleExport(id, format, filename) {
  const blob = await exportDocument(id, format);
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `${filename.replace(/\.[^.]+$/, '')}-docbot.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPanel({ doc, onDelete }) {
  const [tab, setTab] = useState('summary');

  if (!doc) return null;

  const dotColor  = TYPE_DOT[doc.document_type] ?? '#4a5568';
  const entCount  = Object.values(doc.entities ?? {}).flat().length;
  const confidence = doc.confidence ? `${Math.round(doc.confidence * 100)}%` : '—';
  const procTime  = doc.processing_ms ? `${(doc.processing_ms / 1000).toFixed(1)}s` : '—';

  return (
    <div className={styles.panel} style={{ animation: 'fadeIn 0.2s ease' }}>
      <div className={styles.docHeader}>
        <div className={styles.docHeaderRow}>
          <div>
            <div className={styles.metaRow}>
              <span className={styles.dot} style={{ background: dotColor }} />
              <span className={styles.metaTag}>{(doc.document_type ?? 'other').toUpperCase()}</span>
              <span className={styles.sep}>·</span>
              <span className={styles.metaTag}>{Math.round((doc.file_size ?? 0) / 1024)}KB</span>
            </div>
            <div className={`${styles.docTitle} font-serif`}>{doc.original_name}</div>
            <div className={styles.docSub}>
              Analyzed {timeAgo(doc.created_at)} · model{' '}
              <span className={`${styles.modelName} font-mono`}>claude-sonnet-4-20250514</span>
            </div>
          </div>
          <div className={styles.actions}>
            <button className={styles.expBtn} onClick={() => handleExport(doc.id, 'json', doc.original_name)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              JSON
            </button>
            <button className={styles.expBtn} onClick={() => handleExport(doc.id, 'csv', doc.original_name)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              CSV
            </button>
            <button className={styles.deleteBtn} onClick={() => onDelete(doc.id)} title="Delete document">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.statsRow}>
        {[
          { label: 'CONFIDENCE',   value: confidence,              color: '#3a8fa8' },
          { label: 'PROCESSED IN', value: procTime,                color: '#e8eaed' },
          { label: 'ACTION ITEMS', value: (doc.action_items ?? []).length, color: '#e8eaed' },
          { label: 'ENTITIES',     value: entCount,                color: '#3a8fa8' },
        ].map(({ label, value, color }) => (
          <div key={label} className={styles.statCard}>
            <div className={styles.statLabel}>{label}</div>
            <div className={styles.statValue} style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className={styles.tabBar}>
        {['summary', 'action items', 'entities', 'raw text'].map(t => (
          <button
            key={t}
            className={`${styles.tab} ${tab === t ? styles.active : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className={styles.content}>
        {tab === 'summary' && (
          <div className={styles.twoCol}>
            <div className={styles.summaryCard}>
              <div className={styles.secLabel}>EXECUTIVE SUMMARY</div>
              <div className={`${styles.summaryHeadline} font-serif`}>
                {doc.summary}
              </div>
              <div className={styles.keyPointsLabel}>KEY POINTS</div>
              {(doc.key_points ?? []).map((pt, i) => (
                <div key={i} className={styles.kpRow}>
                  <div className={styles.kpDot} />
                  <span className={styles.kpText}>{pt}</span>
                </div>
              ))}
            </div>
            <div className={styles.entitiesCard}>
              <div className={styles.secLabel}>ENTITIES</div>
              {Object.entries(doc.entities ?? {}).map(([type, values]) => {
                const list = Array.isArray(values) ? values : [values];
                if (list.length === 0) return null;
                return (
                  <div key={type} className={styles.entityGroup}>
                    <div className={styles.entityType}>{type}</div>
                    {list.map((v, i) => (
                      <div key={i} className={styles.entityRow}>
                        <div className={styles.kpDot} />
                        <span className={styles.entityVal}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'action items' && (
          <div className={styles.actionTable}>
            <div className={styles.actionHeader}>
              <span>Who</span><span>What</span><span>When</span><span>Priority</span>
            </div>
            {(doc.action_items ?? []).length === 0 && (
              <div className={styles.empty}>No action items found</div>
            )}
            {(doc.action_items ?? []).map((item, i) => (
              <div key={i} className={styles.actionRow}>
                <span className={styles.actionWho}>{item.who ?? '—'}</span>
                <span className={styles.actionWhat}>{item.what ?? '—'}</span>
                <span className={styles.actionWhen}>{item.when ?? '—'}</span>
                <span className={`${styles.priority} ${PRIORITY_CLASS[item.priority] ?? styles.priLow}`}>
                  {item.priority ?? 'low'}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'entities' && (
          <div className={styles.entitiesGrid}>
            {Object.entries(doc.entities ?? {}).map(([type, values]) => {
              const list = Array.isArray(values) ? values : [values];
              if (list.length === 0) return null;
              return (
                <div key={type} className={styles.entityCard}>
                  <div className={styles.entityCardLabel}>{type}</div>
                  <div className={styles.entityTags}>
                    {list.map((v, i) => (
                      <span key={i} className={styles.entityTag}>{v}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'raw text' && (
          <div className={styles.rawText}>
            <pre className={`font-mono ${styles.rawPre}`}>{doc.raw_text ?? 'No text available'}</pre>
          </div>
        )}
      </div>
    </div>
  );
}