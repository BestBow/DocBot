const pool = require('../db/pool');

/**
 * Saves a document record and its AI analysis result to the database.
 */
async function saveDocument({ filename, originalName, fileType, fileSize, rawText }) {
  const { rows } = await pool.query(
    `INSERT INTO documents (filename, original_name, file_type, file_size, raw_text)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [filename, originalName, fileType, fileSize, rawText]
  );
  return rows[0];
}

async function saveResult(documentId, {
  summary, document_type, action_items,
  entities, key_points, confidence, processing_ms
}) {
  const { rows } = await pool.query(
    `INSERT INTO results
       (document_id, summary, document_type, action_items, entities, key_points, confidence, processing_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      documentId,
      summary,
      document_type,
      JSON.stringify(action_items),
      JSON.stringify(entities),
      JSON.stringify(key_points),
      confidence,
      processing_ms,
    ]
  );
  return rows[0];
}

/**
 * Returns all documents with their results, newest first.
 */
async function listDocuments({ limit = 20, offset = 0 } = {}) {
  const { rows } = await pool.query(
    `SELECT
       d.id, d.original_name, d.file_type, d.file_size, d.created_at,
       r.summary, r.document_type, r.confidence, r.processing_ms
     FROM documents d
     LEFT JOIN results r ON r.document_id = d.id
     ORDER BY d.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return rows;
}

/**
 * Returns a single document with its full result.
 */
async function getDocumentById(id) {
  const { rows } = await pool.query(
    `SELECT
       d.*,
       r.id          AS result_id,
       r.summary,
       r.document_type,
       r.action_items,
       r.entities,
       r.key_points,
       r.confidence,
       r.processing_ms,
       r.created_at  AS result_created_at
     FROM documents d
     LEFT JOIN results r ON r.document_id = d.id
     WHERE d.id = $1`,
    [id]
  );
  return rows[0] ?? null;
}

async function deleteDocument(id) {
  const { rowCount } = await pool.query(
    'DELETE FROM documents WHERE id = $1',
    [id]
  );
  return rowCount > 0;
}

module.exports = { saveDocument, saveResult, listDocuments, getDocumentById, deleteDocument };