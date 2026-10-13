const { runCli } = require('./src/cli');

runCli().catch(err => {
  console.error('Application error:', err);
  process.exitCode = 1;
});
