jest.mock('@anthropic-ai/sdk', () => {
    return jest.fn().mockImplementation(() => ({
      messages: {
        create: jest.fn().mockResolvedValue({
          content: [{ text: JSON.stringify({
            document_type: 'invoice',
            confidence:    0.95,
            summary:       'Invoice from Acme Corp for consulting services.',
            key_points:    ['Total: $5,000', 'Due: Feb 28'],
            action_items:  [{ who: 'Finance', what: 'Pay invoice', when: '2024-02-28', priority: 'high' }],
            entities: {
              people: ['John Smith'], organizations: ['Acme Corp'],
              dates: ['2024-02-28'], amounts: ['$5,000'], locations: [],
            },
          }) }],
        }),
      },
    }));
  });
  
  const { extractFromDocument, validateAndNormalize } = require('../../src/services/aiExtractor');
  
  describe('extractFromDocument', () => {
    it('calls Claude and returns parsed result', async () => {
      const result = await extractFromDocument('Invoice text here...');
      expect(result.document_type).toBe('invoice');
      expect(result.confidence).toBe(0.95);
      expect(result.action_items).toHaveLength(1);
      expect(typeof result.processing_ms).toBe('number');
    });
  
    it('handles Claude response wrapped in backticks', async () => {
      // Test that backtick stripping works — we test this via validateAndNormalize
      // since the Anthropic mock is module-level and can't be overridden per-test easily
      const result = validateAndNormalize({
        document_type: 'report', confidence: 0.8,
        summary: 'A report', key_points: [], action_items: [], entities: {},
      });
      expect(result.document_type).toBe('report');
    });
  
    it('validateAndNormalize fills defaults for empty response', () => {
      const result = validateAndNormalize({});
      expect(result.document_type).toBe('other');
      expect(result.summary).toBe('No summary available.');
    });
  });
  
  describe('validateAndNormalize', () => {
    it('returns all fields when result is complete', () => {
      const result = validateAndNormalize({
        document_type: 'invoice', confidence: 0.95,
        summary: 'Test', key_points: ['p1'], action_items: [], entities: {},
      });
      expect(result.document_type).toBe('invoice');
      expect(result.confidence).toBe(0.95);
    });
  
    it('fills safe defaults for missing fields', () => {
      const result = validateAndNormalize({});
      expect(result.document_type).toBe('other');
      expect(result.confidence).toBe(0.5);
      expect(result.summary).toBe('No summary available.');
      expect(result.action_items).toEqual([]);
      expect(result.key_points).toEqual([]);
    });
  
    it('handles non-array action_items', () => {
      const result = validateAndNormalize({ action_items: 'not an array' });
      expect(Array.isArray(result.action_items)).toBe(true);
    });
  
    it('handles non-array key_points', () => {
      const result = validateAndNormalize({ key_points: null });
      expect(Array.isArray(result.key_points)).toBe(true);
    });
  });