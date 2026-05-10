CREATE TABLE IF NOT EXISTS documents (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  filename      VARCHAR(255)  NOT NULL,
  original_name VARCHAR(255)  NOT NULL,
  file_type     VARCHAR(10)   NOT NULL,   -- 'pdf' | 'docx' | 'txt'
  file_size     INTEGER       NOT NULL,   -- bytes
  raw_text      TEXT          NOT NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS results (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id     UUID          NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  summary         TEXT          NOT NULL,
  document_type   VARCHAR(50)   NOT NULL,   -- invoice | contract | report | email | other
  action_items    JSONB         NOT NULL DEFAULT '[]',
  entities        JSONB         NOT NULL DEFAULT '{}',
  key_points      JSONB         NOT NULL DEFAULT '[]',
  confidence      NUMERIC(3,2),             -- 0.00 to 1.00
  processing_ms   INTEGER,                  -- how long Claude took
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_created  ON documents (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_results_doc_id     ON results (document_id);