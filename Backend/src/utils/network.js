import os from 'os';
import fs from 'fs';
import path from 'path';

/**
 * Get the first non-internal IPv4 address (LAN IP)
 */
export function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal (loopback) and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

/**
 * Get all non-internal IPv4 addresses
 */
export function getAllLocalIPs() {
  const interfaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    }
  }
  return ips;
}

/**
 * Write server config to a JSON file that the frontend can read
 */
export function writeServerConfig(port, host, localIP) {
  const config = {
    host,
    port,
    localIP,
    apiBase: `http://${localIP}:${port}`,
    timestamp: new Date().toISOString(),
  };

  // Write to Backend directory
  const backendConfigPath = path.resolve(process.cwd(), 'server-config.json');
  fs.writeFileSync(backendConfigPath, JSON.stringify(config, null, 2));

  // Also write to frontend directory if it exists
  const frontendDir = path.resolve(process.cwd(), '..', 'CampusLink-main');
  if (fs.existsSync(frontendDir)) {
    const frontendConfigPath = path.join(frontendDir, 'server-config.json');
    fs.writeFileSync(frontendConfigPath, JSON.stringify(config, null, 2));
  }

  return config;
}
