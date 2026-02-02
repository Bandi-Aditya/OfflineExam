const https = require('https');

const data = JSON.stringify({ studentId: 'ADMIN001', password: 'admin123' });

const req = https.request({
    hostname: 'backend-umber-delta.vercel.app',
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
}, (res) => {
    let body = '';
    res.on('data', (c) => body += c);
    res.on('end', () => console.log(res.statusCode, body));
});

req.write(data);
req.end();
