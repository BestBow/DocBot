const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * The core prompt that tells Claude exactly what to extract
 * and how to format the response.
 * Structured output — Claude always returns valid JSON.
 */
const EXTRACTION_PROMPT = (text) => `
You are a document analysis AI. Analyze the following document and extract structured information.

You MUST respond with ONLY a valid JSON object — no explanation, no markdown, no backticks.
The JSON must follow this exact schema:

{
  "document_type": "one of: invoice | contract | report | email | memo | proposal | resume | other",
  "confidence": 0.95,
  "summary": "2-4 sentence summary of what this document is about",
  "key_points": [
    "Most important point 1",
    "Most important point 2",
    "Most important point 3"
  ],
  "action_items": [
    {
      "who": "person or team responsible",
      "what": "what needs to be done",
      "when": "deadline or timeframe, or null if not specified",
      "priority": "high | medium | low"
    }
  ],
  "entities": {
    "people": ["name1", "name2"],
    "organizations": ["org1", "org2"],
    "dates": ["date1", "date2"],
    "amounts": ["$1,000", "$2,500"],
    "locations": ["city1", "city2"]
  }
}

Rules:
- confidence is a number between 0 and 1 representing how confident you are in the classification
- If no action items exist, return an empty array []
- If no entities of a type exist, return an empty array []
- key_points should have 3-5 items
- All fields are required

Document to analyze:
---
${text}
---

Respond with ONLY the JSON object:`;

/**
 * Sends document text to Claude and returns structured extraction results.
 * @param {string} text - The raw text extracted from the document
 * @returns {Promise<object>} - Structured extraction result
 */
async function extractFromDocument(text) {
  const startTime = Date.now();

  const message = await client.messages.create({
    model:      'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [
      {
        role:    'user',
        content: EXTRACTION_PROMPT(text),
      },
    ],
  });

  const processingMs = Date.now() - startTime;
  const rawResponse  = message.content[0].text;

  let parsed;
  try {
    parsed = JSON.parse(rawResponse);
  } catch {
    // Claude occasionally wraps in backticks despite instructions — strip them
    const cleaned = rawResponse
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();
    parsed = JSON.parse(cleaned);
  }

  return { ...parsed, processing_ms: processingMs };
}

/**
 * Validates that Claude's response has all required fields.
 * Fills in safe defaults for any missing ones.
 */
function validateAndNormalize(result) {
  return {
    document_type:  result.document_type  ?? 'other',
    confidence:     result.confidence     ?? 0.5,
    summary:        result.summary        ?? 'No summary available.',
    key_points:     Array.isArray(result.key_points)    ? result.key_points    : [],
    action_items:   Array.isArray(result.action_items)  ? result.action_items  : [],
    entities:       result.entities       ?? {},
    processing_ms:  result.processing_ms  ?? 0,
  };
}

module.exports = { extractFromDocument, validateAndNormalize, EXTRACTION_PROMPT };