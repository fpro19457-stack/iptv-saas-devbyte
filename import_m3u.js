const http = require('http');

const loginData = JSON.stringify({
  username: 'admin',
  password: 'admin123'
});

const loginOptions = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(loginData)
  }
};

const loginReq = http.request(loginOptions, (loginRes) => {
  let body = '';
  loginRes.on('data', (chunk) => body += chunk);
  loginRes.on('end', () => {
    const loginResult = JSON.parse(body);
    if (!loginResult.success) {
      console.log('Login failed:', loginResult.message);
      return;
    }

    const token = loginResult.data.accessToken;
    console.log('Login successful, token received');

    const fs = require('fs');
    const m3uContent = fs.readFileSync('E:/Proyectos_AI/iptv-saas-devbyte/backend/import_m3u.txt', 'utf8');

    const importData = JSON.stringify({ content: m3uContent });

    const importOptions = {
      hostname: 'localhost',
      port: 3002,
      path: '/api/admin/channels/import-m3u',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(importData),
        'Authorization': `Bearer ${token}`
      }
    };

    const importReq = http.request(importOptions, (importRes) => {
      let importBody = '';
      importRes.on('data', (chunk) => importBody += chunk);
      importRes.on('end', () => {
        console.log('Import response status:', importRes.statusCode);
        console.log('Import response:', importBody);
      });
    });

    importReq.on('error', (e) => console.error('Import request error:', e));
    importReq.write(importData);
    importReq.end();
  });
});

loginReq.on('error', (e) => console.error('Login request error:', e));
loginReq.write(loginData);
loginReq.end();