const { toJSON, toCSV } = require('../../src/utils/exportFormatter');

const mockDocument = {
  id:            'doc-123',
  original_name: 'invoice.pdf',
  file_type:     'pdf',
  file_size:     51200,
  created_at:    '2024-01-15T10:00:00Z',
};

const mockResult = {
  document_type: 'invoice',
  confidence:    0.95,
  summary:       'Invoice for consulting services.',
  key_points:    ['Amount: $5,000', 'Due: Feb 28'],
  action_items:  [{ who: 'Finance', what: 'Pay invoice', when: '2024-02-28', priority: 'high' }],
  entities:      { people: ['John'], organizations: ['Acme'], dates: ['2024-02-28'], amounts: ['$5,000'], locations: [] },
  created_at:    '2024-01-15T10:01:00Z',
  processing_ms: 1230,
};

describe('toJSON', () => {
  it('returns correct top-level shape', () => {
    const result = toJSON(mockDocument, mockResult);
    expect(result).toHaveProperty('export_version', '1.0');
    expect(result).toHaveProperty('document');
    expect(result).toHaveProperty('analysis');
  });

  it('includes document metadata', () => {
    const result = toJSON(mockDocument, mockResult);
    expect(result.document.filename).toBe('invoice.pdf');
    expect(result.document.file_size_kb).toBe(50);
  });

  it('includes analysis fields', () => {
    const result = toJSON(mockDocument, mockResult);
    expect(result.analysis.document_type).toBe('invoice');
    expect(result.analysis.action_items).toHaveLength(1);
    expect(result.analysis.confidence).toBe(0.95);
  });
});

describe('toCSV', () => {
  it('contains summary section', () => {
    const csv = toCSV(mockDocument, mockResult);
    expect(csv).toContain('SUMMARY');
    expect(csv).toContain('Invoice for consulting services.');
  });

  it('contains action items with headers', () => {
    const csv = toCSV(mockDocument, mockResult);
    expect(csv).toContain('who,what,when,priority');
    expect(csv).toContain('Finance');
    expect(csv).toContain('Pay invoice');
  });

  it('contains entities section', () => {
    const csv = toCSV(mockDocument, mockResult);
    expect(csv).toContain('ENTITIES');
    expect(csv).toContain('people');
    expect(csv).toContain('John');
  });

  it('wraps cells with commas in quotes', () => {
    const resultWithComma = {
      ...mockResult,
      action_items: [{ who: 'Smith, John', what: 'Review', when: null, priority: 'low' }],
    };
    const csv = toCSV(mockDocument, resultWithComma);
    expect(csv).toContain('"Smith, John"');
  });
});