const fs       = require('fs');
const pdfParse = require('pdf-parse');
const mammoth  = require('mammoth');

/**
 * Extracts raw text from a file path or buffer.
 */
async function extractText(filePathOrBuffer, fileType) {
  const buffer = Buffer.isBuffer(filePathOrBuffer)
    ? filePathOrBuffer
    : fs.readFileSync(filePathOrBuffer);

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

function deleteFile(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('Failed to delete file:', filePath, err);
  }
}

function truncateText(text, maxChars = 15000) {
  if (!text) return '';
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + '\n\n[Document truncated for processing...]';
}

module.exports = { extractText, deleteFile, truncateText };