import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const services = [
  {
    name: 'backend',
    cwd: path.join(root, 'apps', 'backend'),
    entry: path.join(root, 'apps', 'backend', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    args: ['src/server.ts'],
    port: 5101,
  },
  {
    name: 'api-gateway',
    cwd: path.join(root, 'apps', 'api-gateway'),
    entry: path.join(root, 'apps', 'api-gateway', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    args: ['src/server.ts'],
    port: 5001,
  },
  {
    name: 'mobile',
    cwd: path.join(root, 'apps', 'mobile'),
    entry: path.join(root, 'apps', 'mobile', 'node_modules', 'expo', 'bin', 'cli'),
    args: ['start'],
    port: 8081,
  },
];

const children = [];
let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;

  for (const child of children) {
    if (!child.killed) child.kill('SIGTERM');
  }

  setTimeout(() => process.exit(exitCode), 500).unref();
}

console.log('Starting CoRide mobile development stack:');
console.log('  Backend:     http://localhost:5101');
console.log('  API Gateway: http://localhost:5001');
console.log('  Expo:        Metro development server');

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(500);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => resolve(false));
  });
}

for (const service of services) {
  if (await isPortOpen(service.port)) {
    console.log(`[${service.name}] Port ${service.port} is already running; reusing it.`);
    continue;
  }

  const child = spawn(process.execPath, [service.entry, ...service.args], {
    cwd: service.cwd,
    env: process.env,
    stdio: 'inherit',
  });

  children.push(child);

  child.on('error', (error) => {
    console.error(`[${service.name}] Could not start: ${error.message}`);
    stop(1);
  });

  child.on('exit', (code, signal) => {
    if (stopping) return;
    console.error(`[${service.name}] Stopped (${signal ?? `exit code ${code}`}).`);
    stop(code || 1);
  });
}

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));

if (children.length === 0) {
  console.log('All CoRide mobile development services are already running.');
}
