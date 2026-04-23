const http = require('http');

const post = (path, body, token) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
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
  console.log('1. Login...');
  const login = await post('/api/admin/login', { username: 'admin', password: 'admin123' });
  console.log('   Login status:', login.status);
  if (!login.data.success) { console.log('   Login failed:', login.data.message); return; }
  const token = login.data.data.accessToken;

  console.log('\n2. Get channels...');
  const channels = await get('/api/admin/channels?limit=300', token);
  console.log('   Total channels:', channels.data.data.total);
  const channelIds = channels.data.data.channels.map(ch => ch.id);

  console.log('\n3. Create "Argentina Completo" pack...');
  const createPack = await post('/api/admin/packs', {
    name: 'Argentina Completo',
    description: 'Todos los canales argentinos',
    color: '#3b82f6',
    icon: 'tv'
  }, token);
  console.log('   Create pack status:', createPack.status);
  console.log('   Create pack response:', createPack.data.message);
  console.log('   Pack ID:', createPack.data.data?.id);

  if (createPack.data.data?.id) {
    const packId = createPack.data.data.id;

    console.log('\n4. Assign all', channelIds.length, 'channels to pack...');
    const assign = await post(`/api/admin/packs/${packId}/channels`, {
      channelIds: channelIds
    }, token);
    console.log('   Assign response:', assign.data.message);

    console.log('\n5. Get usuario1 ID...');
    const users = await get('/api/admin/users', token);
    const usuario1 = users.data.data.users?.find(u => u.username === 'usuario1');
    console.log('   usuario1 found:', usuario1?.id);

    if (usuario1) {
      console.log('\n6. Assign pack to usuario1...');
      const userPack = await post(`/api/admin/users/${usuario1.id}/packs`, {
        packId: packId
      }, token);
      console.log('   Assign response:', userPack.data.message);
    }
  }

  console.log('\nDone!');
})();