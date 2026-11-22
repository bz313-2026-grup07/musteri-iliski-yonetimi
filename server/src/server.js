const app = require('./app');
const config = require('./config');

app.listen(config.port, () => {
  console.log(`Rosebud API http://localhost:${config.port} (${config.env})`);
});
