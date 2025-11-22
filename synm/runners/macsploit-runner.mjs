import { fileURLToPath } from 'url';
import path from 'path';

// Usage: node runners/macsploit-runner.mjs <port> <scriptBase64>
(async () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const [, , portArg, scriptB64] = process.argv;
    const port = Number(portArg || 5553);
    const script = scriptB64 ? Buffer.from(scriptB64, 'base64').toString('utf8') : '';

    const modPath = new URL('../macsploit.mjs', import.meta.url);
    const mod = await import(modPath);
    const Client = mod.Client || mod.default?.Client;
    if (!Client) throw new Error('Client export not found in macsploit.js');

    const client = new Client();
    await client.attach(port);

    // execute script
    try {
      client.executeScript(script);
      // allow a brief window for data to flow back through the socket
      await new Promise((res) => setTimeout(res, 200));
    } finally {
      try { await client.detach(); } catch (e) { /* ignore */ }
    }

    console.log('Executed');
    process.exit(0);
  } catch (err) {
    console.error('Runner error:', err && (err.stack || err.message || String(err)));
    process.exit(1);
  }
})();
