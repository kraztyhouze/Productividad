import http from 'http';

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/dashboard/stats',
  method: 'GET',
  headers: {
    'x-store-id': 'store_1'
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.setEncoding('utf8');
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk}`);
  });
});

req.on('error', (e) => {
  console.error(`problem with request: ${e.message}`);
});

req.end();
