const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// basic security headers
app.disable('x-powered-by');
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer-when-downgrade');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  next();
});

const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir, { maxAge: '7d', extensions: ['html'] }));

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`ACME I-9 site running on http://localhost:${PORT}`);
});
