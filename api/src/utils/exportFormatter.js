/**
 * Formats a document result as a flat JSON export.
 */
function toJSON(document, result) {
    return {
      export_version: '1.0',
      exported_at:    new Date().toISOString(),
      document: {
        id:            document.id,
        filename:      document.original_name,
        file_type:     document.file_type,
        file_size_kb:  Math.round(document.file_size / 1024),
        uploaded_at:   document.created_at,
      },
      analysis: {
        document_type: result.document_type,
        confidence:    result.confidence,
        summary:       result.summary,
        key_points:    result.key_points,
        action_items:  result.action_items,
        entities:      result.entities,
        processed_at:  result.created_at,
        processing_ms: result.processing_ms,
      },
    };
  }
  
  /**
   * Formats action items as CSV rows.
   */
  function toCSV(document, result) {
    const lines = [
      '# DocBot Export',
      `# Document: ${document.original_name}`,
      `# Type: ${result.document_type}`,
      `# Exported: ${new Date().toISOString()}`,
      '',
      '## SUMMARY',
      result.summary,
      '',
      '## ACTION ITEMS',
      'who,what,when,priority',
    ];
  
    const items = result.action_items ?? [];
    for (const item of items) {
      const row = [
        csvCell(item.who   ?? ''),
        csvCell(item.what  ?? ''),
        csvCell(item.when  ?? ''),
        csvCell(item.priority ?? ''),
      ].join(',');
      lines.push(row);
    }
  
    lines.push('');
    lines.push('## KEY POINTS');
    (result.key_points ?? []).forEach((p, i) => lines.push(`${i + 1}. ${p}`));
  
    lines.push('');
    lines.push('## ENTITIES');
    lines.push('type,value');
    const entities = result.entities ?? {};
    for (const [type, values] of Object.entries(entities)) {
      const list = Array.isArray(values) ? values : [values];
      list.forEach(v => lines.push(`${csvCell(type)},${csvCell(String(v))}`));
    }
  
    return lines.join('\n');
  }
  
  function csvCell(val) {
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }
  
  module.exports = { toJSON, toCSV };