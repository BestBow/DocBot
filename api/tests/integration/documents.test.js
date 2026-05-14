jest.mock('../../src/middleware/upload', () => {
  const multer = require('multer');
  const path   = require('path');
  const os     = require('os');

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, os.tmpdir()),
    filename:    (_req, file, cb) => cb(null, `test-${Date.now()}${path.extname(file.originalname)}`),
  });

  return {
    upload: multer({ storage }),
    ALLOWED_TYPES: {
      'text/plain':       'txt',
      'application/pdf':  'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    },
    UPLOAD_DIR: os.tmpdir(),
  };
});

jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ text: JSON.stringify({
          document_type: 'report',
          confidence:    0.9,
          summary:       'A quarterly sales report for Q4 2023.',
          key_points:    ['Revenue up 15%', 'New markets entered'],
          action_items:  [{ who: 'Sales', what: 'Follow up', when: 'Q1 2024', priority: 'high' }],
          entities: { people: ['Jane'], organizations: ['Acme'], dates: [], amounts: [], locations: [] },
        }) }],
      }),
    },
  }));
});

jest.mock('../../src/services/documentProcessor', () => ({
  extractText:  jest.fn().mockResolvedValue('Extracted document text for testing.'),
  deleteFile:   jest.fn(),
  truncateText: jest.fn(t => t ?? ''),
}));

const request = require('supertest');
const path    = require('path');
const fs      = require('fs');
const os      = require('os');
const app     = require('../../src/app');
const pool    = require('../../src/db/pool');

beforeAll(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_type VARCHAR(10) NOT NULL,
      file_size INTEGER NOT NULL,
      raw_text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      summary TEXT NOT NULL,
      document_type VARCHAR(50) NOT NULL,
      action_items JSONB NOT NULL DEFAULT '[]',
      entities JSONB NOT NULL DEFAULT '{}',
      key_points JSONB NOT NULL DEFAULT '[]',
      confidence NUMERIC(3,2),
      processing_ms INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
});

afterEach(async () => {
  await pool.query('TRUNCATE documents RESTART IDENTITY CASCADE');
});

afterAll(async () => {
  await pool.end();
});

async function seedDocument() {
  const { rows: docRows } = await pool.query(
    `INSERT INTO documents (filename, original_name, file_type, file_size, raw_text)
     VALUES ('test-file.txt', 'my-report.txt', 'txt', 1024, 'Sample document text')
     RETURNING *`
  );
  const doc = docRows[0];
  const { rows: resRows } = await pool.query(
    `INSERT INTO results (document_id, summary, document_type, action_items, entities, key_points, confidence, processing_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [
      doc.id,
      'A quarterly sales report for Q4 2023.',
      'report',
      JSON.stringify([{ who: 'Sales', what: 'Follow up', when: 'Q1 2024', priority: 'high' }]),
      JSON.stringify({ people: ['Jane'], organizations: ['Acme'] }),
      JSON.stringify(['Revenue up 15%']),
      0.9, 1200,
    ]
  );
  return { doc, result: resRows[0] };
}

describe('POST /api/documents/upload', () => {
  it('returns 400 when no file is uploaded', async () => {
    const res = await request(app).post('/api/documents/upload');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No file');
  });

  it('uploads a txt file and returns AI analysis', async () => {
    const filePath = path.join(os.tmpdir(), `test-${Date.now()}.txt`);
    fs.writeFileSync(filePath, 'Quarterly sales report content here.');

    const res = await request(app)
      .post('/api/documents/upload')
      .attach('file', filePath, { contentType: 'text/plain' });

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    expect(res.status).toBe(201);
    expect(res.body.document).toHaveProperty('id');
    expect(res.body.document.fileType).toBe('txt');
    expect(res.body.result.documentType).toBe('report');
    expect(res.body.result.actionItems).toHaveLength(1);
  });

  it('does not return 201 for unsupported file type', async () => {
    const filePath = path.join(os.tmpdir(), `test-${Date.now()}.xyz`);
    fs.writeFileSync(filePath, 'bad content');

    const res = await request(app)
      .post('/api/documents/upload')
      .attach('file', filePath, { contentType: 'application/octet-stream' });

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    expect(res.status).not.toBe(201);
  });
});

describe('GET /api/documents', () => {
  it('returns empty list when no documents exist', async () => {
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(200);
    expect(res.body.documents).toHaveLength(0);
  });

  it('returns seeded documents', async () => {
    await seedDocument();
    const res = await request(app).get('/api/documents');
    expect(res.status).toBe(200);
    expect(res.body.documents).toHaveLength(1);
    expect(res.body.documents[0].original_name).toBe('my-report.txt');
  });
});

describe('GET /api/documents/:id', () => {
  it('returns full document with result', async () => {
    const { doc } = await seedDocument();
    const res     = await request(app).get(`/api/documents/${doc.id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(doc.id);
    expect(res.body.summary).toContain('quarterly');
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).get('/api/documents/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/documents/:id/export', () => {
  it('exports as JSON', async () => {
    const { doc } = await seedDocument();
    const res     = await request(app).get(`/api/documents/${doc.id}/export?format=json`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.body.export_version).toBe('1.0');
  });

  it('exports as CSV', async () => {
    const { doc } = await seedDocument();
    const res     = await request(app).get(`/api/documents/${doc.id}/export?format=csv`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('SUMMARY');
    expect(res.text).toContain('ACTION ITEMS');
  });
});

describe('DELETE /api/documents/:id', () => {
  it('deletes a document', async () => {
    const { doc } = await seedDocument();
    const del     = await request(app).delete(`/api/documents/${doc.id}`);
    expect(del.status).toBe(204);
    const get = await request(app).get(`/api/documents/${doc.id}`);
    expect(get.status).toBe(404);
  });

  it('returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/documents/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});