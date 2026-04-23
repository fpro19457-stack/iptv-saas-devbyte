const http = require('http');

const post = (path, body) => {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3002,
      path: path,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    };
    const req = http.request(options, (res) => {
      let respBody = '';
      res.on('data', (chunk) => respBody += chunk);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(respBody) }); } catch { resolve({ status: res.statusCode, data: respBody }); } });
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
      headers: { ...(token && { 'Authorization': `Bearer ${token}` }) }
    };
    const req = http.request(options, (res) => {
      let respBody = '';
      res.on('data', (chunk) => respBody += chunk);
      res.on('end', () => { try { resolve({ status: res.statusCode, data: JSON.parse(respBody) }); } catch { resolve({ status: res.statusCode, data: respBody }); } });
    });
    req.on('error', reject);
    req.end();
  });
};

(async () => {
  const login = await post('/api/admin/login', { username: 'admin', password: 'admin123' });
  const token = login.data.data.accessToken;

  console.log('1. Get all users...');
  const users = await get('/api/admin/users', token);
  console.log('   Total users:', users.data.data?.total);
  console.log('   Users list:');
  users.data.data?.users?.forEach(u => {
    console.log(`   - ${u.username} | ${u.fullName} | ${u.status} | created: ${new Date(u.createdAt).toLocaleString('es-AR')}`);
  });

  console.log('\n2. Get metrics...');
  const metrics = await get('/api/admin/metrics', token);
  console.log('   Total users:', metrics.data.data?.totalUsers);
  console.log('   Active:', metrics.data.data?.totalUsers?.active);
  console.log('   New this month:', metrics.data.data?.newUsersThisMonth);
})();