const fs      = require('fs');
const path    = require('path');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');

/**
 * Extracts raw text from a file based on its type.
 * Supports PDF, DOCX, and plain text.
 */
async function extractText(filePath, fileType) {
  const buffer = fs.readFileSync(filePath);

  switch (fileType) {
    case 'pdf': {
      const data = await pdfParse(buffer);
      return data.text.trim();
    }

    case 'docx': {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }

    case 'txt': {
      return buffer.toString('utf-8').trim();
    }

    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}

/**
 * Cleans up an uploaded file after processing.
 */
function deleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Failed to delete file:', filePath, err);
  }
}

/**
 * Truncates text to a safe length for the Claude API.
 * Claude's context window is large but we keep costs predictable.
 */
function truncateText(text, maxChars = 15000) {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Document truncated for processing...]';
}

module.exports = { extractText, deleteFile, truncateText };