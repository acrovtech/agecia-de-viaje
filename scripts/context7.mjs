import { spawn } from 'child_process';

const API_KEY = process.env.CONTEXT7_API_KEY || '';

function runMCP(toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['-y', '@upstash/context7-mcp'], {
      shell: true,
      env: { ...process.env, CONTEXT7_API_KEY: API_KEY },
      stdio: ['pipe', 'pipe', 'inherit']
    });

    let stdoutData = '';
    child.stdout.on('data', chunk => {
      stdoutData += chunk.toString();
    });

    // 1. Handshake
    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'antigravity-client', version: '1.0' }
      }
    }) + '\n');

    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');

    // 2. Execute tool
    child.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    }) + '\n');

    const timeout = setTimeout(() => {
      child.kill();
      resolve(stdoutData);
    }, 15000);

    child.on('close', () => {
      clearTimeout(timeout);
      resolve(stdoutData);
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

const command = process.argv[2];

async function main() {
  if (command === 'search') {
    const libraryName = process.argv[3];
    const query = process.argv[4] || libraryName;
    const raw = await runMCP('resolve-library-id', { libraryName, query });
    const match = raw.split('\n').filter(line => line.trim().startsWith('{')).pop();
    if (match) {
      try {
        const json = JSON.parse(match);
        console.log(json.result?.content?.[0]?.text || JSON.stringify(json, null, 2));
      } catch {
        console.log(raw);
      }
    } else {
      console.log(raw);
    }
  } else if (command === 'query') {
    const libraryId = process.argv[3];
    const query = process.argv[4];
    const raw = await runMCP('query-docs', { libraryId, query });
    const match = raw.split('\n').filter(line => line.trim().startsWith('{')).pop();
    if (match) {
      try {
        const json = JSON.parse(match);
        console.log(json.result?.content?.[0]?.text || JSON.stringify(json, null, 2));
      } catch {
        console.log(raw);
      }
    } else {
      console.log(raw);
    }
  } else {
    console.log('Usage:');
    console.log('  node scripts/context7.mjs search "<libraryName>" "<query>"');
    console.log('  node scripts/context7.mjs query "<libraryId>" "<query>"');
  }
}

main();
