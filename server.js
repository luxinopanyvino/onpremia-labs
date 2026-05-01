const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const PUBLIC_DIR = path.join(__dirname, 'public_html');

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Handle /data-files
  if (pathname === '/data-files') {
    const dataDir = path.join(PUBLIC_DIR, 'data');
    fs.readdir(dataDir, (err, files) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Error leyendo lista de archivos de datos' }));
        return;
      }
      const jsonFiles = files.filter((filename) => filename.toLowerCase().endsWith('.json'));
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(jsonFiles));
    });
    return;
  }

  // Handle /benchmarks
  if (pathname === '/benchmarks') {
    const filePath = path.join(PUBLIC_DIR, 'data', 'benchmarks.json');
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Error reading benchmarks data');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(data);
    });
    return;
  }

  // Handle /contact.php
  if (pathname === '/contact.php' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, message: 'Contact form submitted (mock)' }));
    });
    return;
  }

  // Serve static files
  let filePath = path.join(PUBLIC_DIR, pathname);
  if (pathname === '/') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    // Set content type based on extension
    const ext = path.extname(filePath);
    let contentType = 'text/plain';
    switch (ext) {
      case '.html':
        contentType = 'text/html';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.js':
        contentType = 'application/javascript';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.php':
        contentType = 'text/html'; // Treat as HTML
        break;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});