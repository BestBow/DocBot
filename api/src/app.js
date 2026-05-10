const express           = require('express');
const cors              = require('cors');
const documentsRouter   = require('./routes/documents');
const errorHandler      = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/documents', documentsRouter);

app.get('/health', (_req, res) => res.json({ status: 'ok', version: '1.0.0' }));

app.use(errorHandler);

module.exports = app;