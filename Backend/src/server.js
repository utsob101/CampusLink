import http from 'http';
import app from './app.js';
import { connectDB } from './utils/db.js';
import { loadEnv } from './utils/env.js';
import { getLocalIP, getAllLocalIPs, writeServerConfig } from './utils/network.js';

loadEnv();
const PORT = parseInt(process.env.PORT, 10) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

async function start() {
  await connectDB();
  const server = http.createServer(app);
  server.listen(PORT, HOST, async () => {
    const hostDisplay = HOST === '0.0.0.0' ? '0.0.0.0 (all interfaces)' : HOST;
    const localIP = getLocalIP();
    const allIPs = getAllLocalIPs();

    console.log(`CampusLink backend listening on http://localhost:${PORT}`);
    console.log(`Bound to: ${hostDisplay}:${PORT}`);

    // Write server config for frontend
    const config = writeServerConfig(PORT, HOST, localIP);
    console.log(`📝 Server config written to server-config.json`);
    console.log(`📱 Frontend should use: ${config.apiBase}`);

    if (allIPs.length > 0) {
      console.log('Accessible on your LAN at:');
      allIPs.forEach(ip => console.log(`  http://${ip}:${PORT}`));
    }
  });
}

start().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
