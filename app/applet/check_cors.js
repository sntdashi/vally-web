const https = require('https');

https.get('https://www.solarsystemscope.com/textures/download/2k_mercury.jpg', (res) => {
  console.log('Headers:', res.headers);
}).on('error', (e) => {
  console.error(e);
});
