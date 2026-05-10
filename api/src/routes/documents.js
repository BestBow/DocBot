const express   = require('express');
const path      = require('path');
const { upload, ALLOWED_TYPES } = require('../middleware/upload');
const { extractText, deleteFile, truncateText } = require('../services/documentProcessor');
const { extractFromDocument, validateAndNormalize } = require('../services/aiExtractor');
const { saveDocument, saveResult, listDocuments, getDocumentById, deleteDocument } = require('../services/documentService');
const { toJSON, toCSV } = require('../utils/exportFormatter');

const router = express.Router();

// POST /api/documents/upload
// Uploads a file, extracts text, runs Claude analysis, saves to DB
router.post('/upload', upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;

  try {
    const fileType = ALLOWED_TYPES[req.file.mimetype];

    // 1. Extract raw text from file
    const rawText = await extractText(filePath, fileType);

    if (!rawText || rawText.length < 10) {
      deleteFile(filePath);
      return res.status(400).json({ error: 'Could not extract text from this file. Is it empty or scanned?' });
    }

    // 2. Save document to DB
    const document = await saveDocument({
      filename:     req.file.filename,
      originalName: req.file.originalname,
      fileType,
      fileSize:     req.file.size,
      rawText:      truncateText(rawText),
    });

    // 3. Run Claude AI extraction
    const truncated  = truncateText(rawText);
    const rawResult  = await extractFromDocument(truncated);
    const result     = validateAndNormalize(rawResult);

    // 4. Save result to DB
    const savedResult = await saveResult(document.id, result);

    // 5. Clean up uploaded file — we have the text, don't need the file
    deleteFile(filePath);

    res.status(201).json({
      document: {
        id:           document.id,
        filename:     document.original_name,
        fileType:     document.file_type,
        fileSizeKb:   Math.round(document.file_size / 1024),
        uploadedAt:   document.created_at,
      },
      result: {
        id:            savedResult.id,
        documentType:  result.document_type,
        confidence:    result.confidence,
        summary:       result.summary,
        keyPoints:     result.key_points,
        actionItems:   result.action_items,
        entities:      result.entities,
        processingMs:  result.processing_ms,
      },
    });
  } catch (err) {
    deleteFile(filePath);
    next(err);
  }
});

// GET /api/documents — list all documents
router.get('/', async (req, res, next) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = parseInt(req.query.offset) || 0;
    const docs   = await listDocuments({ limit, offset });
    res.json({ documents: docs });
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id — get one document with full result
router.get('/:id', async (req, res, next) => {
  try {
    const doc = await getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/:id/export?format=json|csv
router.get('/:id/export', async (req, res, next) => {
  try {
    const doc = await getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const result = {
      document_type: doc.document_type,
      summary:       doc.summary,
      key_points:    doc.key_points,
      action_items:  doc.action_items,
      entities:      doc.entities,
      confidence:    doc.confidence,
      processing_ms: doc.processing_ms,
      created_at:    doc.result_created_at,
    };

    if (format === 'csv') {
      const csv      = toCSV(doc, result);
      const filename = `${doc.original_name.replace(/\.[^.]+$/, '')}-docbot.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      return res.send(csv);
    }

    const json     = toJSON(doc, result);
    const filename = `${doc.original_name.replace(/\.[^.]+$/, '')}-docbot.json`;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.json(json);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const deleted = await deleteDocument(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Document not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;