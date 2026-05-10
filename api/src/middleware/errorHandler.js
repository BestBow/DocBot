function errorHandler(err, _req, res, _next) {
    console.error(err);
  
    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `File too large. Maximum size is ${process.env.MAX_FILE_SIZE_MB || 10}MB`,
      });
    }
  
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error',
    });
  }
  
  module.exports = errorHandler;