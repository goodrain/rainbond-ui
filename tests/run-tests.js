const { spawn } = require('child_process');
const { kill } = require('cross-port-killer');

const env = Object.create(process.env);
env.BROWSER = 'none';
const startServer = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['start'], {
  env,
});

startServer.stderr.on('data', (data) => {
  process.stderr.write(data);
});

startServer.on('exit', () => {
  kill(process.env.PORT || 8000);
});

process.stdout.write('Starting development server for e2e tests...\n');
startServer.stdout.on('data', (data) => {
  process.stdout.write(data);
  if (data.toString().indexOf('Compiled successfully') >= 0 ||
      data.toString().indexOf('Compiled with warnings') >= 0) {
    process.stdout.write('Development server is started, ready to run tests.\n');
    const testCmd = spawn(/^win/.test(process.platform) ? 'npm.cmd' : 'npm', ['test'], {
      stdio: 'inherit',
    });
    testCmd.on('exit', () => {
      startServer.kill();
    });
  }
});
