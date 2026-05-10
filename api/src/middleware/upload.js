function errorHandler(err, _req, res, _next) {
  console.error(err);

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB`,
    });
  }

  // Multer file type error (thrown in fileFilter)
  if (err.message && err.message.includes('Only PDF')) {
    return res.status(400).json({ error: err.message });
  }

  // Any other multer error
  if (err.storageErrors !== undefined) {
    return res.status(400).json({ error: err.message || 'File upload error' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;