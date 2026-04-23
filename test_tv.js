const http = require('http');

const post = (path, body) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };
    const req = http.request(options, (res) => {
      let respBody = '';
      res.on('data', (chunk) => respBody += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(respBody) }); }
        catch { resolve({ status: res.statusCode, data: respBody }); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

const get = (path, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'GET',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    };
    const req = http.request(options, (res) => {
      let respBody = '';
      res.on('data', (chunk) => respBody += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(respBody) }); }
        catch { resolve({ status: res.statusCode, data: respBody }); }
      });
    });
    req.on('error', reject);
    req.end();
  });
};

(async () => {
  console.log('1. Login as usuario1...');
  const login = await post('/api/auth/login', { username: 'usuario1', password: 'usuario123' });
  console.log('   Login status:', login.status);
  if (!login.data.success) { console.log('   Login failed:', login.data.message); return; }
  const token = login.data.data.accessToken;

  console.log('\n2. Get channels...');
  const channels = await get('/api/channels', token);
  console.log('   Response structure:', JSON.stringify(channels.data).substring(0, 500));

  const actualChannels = channels.data.data;
  console.log('\n   Is array?', Array.isArray(actualChannels));
  console.log('   Has length?', actualChannels?.length);

  if (Array.isArray(actualChannels)) {
    console.log('\n   Total channels:', actualChannels.length);
    console.log('   First 10 channels:');
    actualChannels.slice(0, 10).forEach(ch => {
      console.log(`   - ${ch.number}. ${ch.name} (${ch.category})`);
    });
  }
})();