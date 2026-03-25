import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

/**
 * Filter non-JSON lines from Stitch MCP stdout to prevent client crashes.
 * Many MCP clients fail if they see [stitch-proxy] logs on stdout.
 */
const child = spawn('npx', ['-y', '@_davideast/stitch-mcp', 'proxy'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  env: process.env,
  shell: true
});

child.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      process.stdout.write(line + '\n');
    } else if (trimmed) {
      process.stderr.write(`[wrapper] ${line}\n`);
    }
  }
});

process.stdin.on('data', (data) => {
  child.stdin.write(data);
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
