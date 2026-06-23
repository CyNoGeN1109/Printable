const http = require('http');

http.get('http://127.0.0.1:4000/api/orders', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const orders = JSON.parse(data);
    const latest = orders[0];
    console.log("Latest Order:");
    console.log(JSON.stringify(latest.files, null, 2));
  });
}).on("error", (err) => {
  console.log("Error: " + err.message);
});
