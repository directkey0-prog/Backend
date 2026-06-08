const app = require('./app');
const keepAlive = require('./services/keepAlive');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  keepAlive.start();
});