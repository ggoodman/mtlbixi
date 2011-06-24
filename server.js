require('coffee-script');
var app = require('./app');

console.log("APP2", app);

app.listen(process.env.C9_PORT || 80);