const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3001,
  path: '/health',
  method: 'GET',
  timeout: 2000
};

const request = http.request(options, (res) => {
  console.log(`Health check status: ${res.statusCode}`);
  if (res.statusCode === 200) {
    console.log('✅ Health check passed');
    process.exit(0);
  } else {
    console.error(`❌ Health check failed with status: ${res.statusCode}`);
    process.exit(1);
  }
});

request.on('error', (err) => {
  console.error('❌ Health check request failed:', err.message);
  process.exit(1);
});

request.on('timeout', () => {
  console.error('❌ Health check request timed out');
  request.destroy();
  process.exit(1);
});

request.setTimeout(3000);
request.end();

request.end();
