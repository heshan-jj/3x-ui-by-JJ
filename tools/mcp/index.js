#!/usr/bin/env node

/**
 * 3X-UI by JJ — Model Context Protocol (MCP) Server
 *
 * Exposes 3X-UI management capabilities to Claude Desktop, Claude Code, Cursor,
 * and any other MCP-compatible AI agent over standard stdio JSON-RPC.
 *
 * Zero external dependencies: runs on Node.js 18+ out of the box.
 */

const readline = require('readline');
const crypto = require('crypto');

// Configuration from environment variables
const XUI_BASE_URL = (process.env.XUI_BASE_URL || 'http://127.0.0.1:2053').replace(/\/+$/, '');
const XUI_API_TOKEN = process.env.XUI_API_TOKEN || process.env.XUI_API_KEY || '';
const XUI_USERNAME = process.env.XUI_USERNAME || '';
const XUI_PASSWORD = process.env.XUI_PASSWORD || '';

let sessionCookie = '';

/**
 * Normalizes URL to target the /panel/api prefix properly.
 */
function getApiUrl(endpoint) {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  // If base URL already includes /panel, avoid duplicating it
  if (XUI_BASE_URL.endsWith('/panel')) {
    return `${XUI_BASE_URL}/api${cleanEndpoint}`;
  }
  return `${XUI_BASE_URL}/panel/api${cleanEndpoint}`;
}

/**
 * Perform login when username and password are provided and token is missing.
 */
async function ensureAuthenticated() {
  if (XUI_API_TOKEN || sessionCookie) {
    return;
  }
  if (!XUI_USERNAME || !XUI_PASSWORD) {
    throw new Error('Authentication required: please set XUI_API_TOKEN or both XUI_USERNAME and XUI_PASSWORD');
  }

  const loginUrl = XUI_BASE_URL.endsWith('/panel')
    ? `${XUI_BASE_URL}/login`
    : `${XUI_BASE_URL}/login`;

  const body = new URLSearchParams({
    username: XUI_USERNAME,
    password: XUI_PASSWORD,
  });

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    throw new Error(`Failed to login with username/password (HTTP ${res.status})`);
  }

  const cookieHeader = res.headers.get('set-cookie');
  if (cookieHeader) {
    sessionCookie = cookieHeader.split(';')[0];
  }
}

/**
 * Send an API request to 3X-UI.
 */
async function xuiFetch(endpoint, options = {}) {
  await ensureAuthenticated();

  const url = getApiUrl(endpoint);
  const headers = {
    Accept: 'application/json',
    ...(options.headers || {}),
  };

  if (XUI_API_TOKEN) {
    headers['Authorization'] = `Bearer ${XUI_API_TOKEN}`;
  } else if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return { success: true, raw: text };
  }

  const data = await res.json();
  if (data.success === false) {
    throw new Error(data.msg || 'API returned success=false');
  }
  return data.obj !== undefined ? data.obj : data;
}

/**
 * Format bytes to readable string (KB, MB, GB, TB).
 */
function formatBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

// Tool definitions for MCP
const TOOLS = [
  {
    name: 'get_system_status',
    description: 'Retrieve real-time VPS vitals: CPU usage, RAM consumption, disk usage, network throughput, uptime, and Xray core running status.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_xray_version',
    description: 'Get the currently running version of the Xray-core proxy engine.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'list_inbounds',
    description: 'List all inbounds configured on the 3X-UI server including protocol (VLESS, VMess, Trojan, etc.), port, listen host, client counts, and total upload/download traffic.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_inbound',
    description: 'Get complete configuration, transport settings, stream security, and clients for a specific inbound by its ID.',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'The numeric ID of the inbound to inspect.',
        },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_clients',
    description: 'List all clients configured across inbounds or within a specific inbound, including email, UUID/password, upload/download traffic used, traffic quota, and expiry date.',
    inputSchema: {
      type: 'object',
      properties: {
        inboundId: {
          type: 'number',
          description: 'Optional inbound ID filter. If omitted, lists clients across all inbounds.',
        },
      },
      required: [],
    },
  },
  {
    name: 'add_client',
    description: 'Add a new client to an existing inbound. Supports specifying traffic quota in GB, expiry in days, and custom or auto-generated UUID.',
    inputSchema: {
      type: 'object',
      properties: {
        inboundId: {
          type: 'number',
          description: 'Numeric ID of the inbound to add the client to.',
        },
        email: {
          type: 'string',
          description: 'Unique email tag/identifier for the client.',
        },
        totalGB: {
          type: 'number',
          description: 'Total traffic limit in gigabytes (e.g. 50 for 50GB, 0 for unlimited).',
        },
        expiryDays: {
          type: 'number',
          description: 'Expiry duration in days from now (0 or omitted for no expiry).',
        },
        uuid: {
          type: 'string',
          description: 'Custom UUID or password (optional, auto-generated if omitted).',
        },
        flow: {
          type: 'string',
          description: 'Optional flow for VLESS Reality (e.g. "xtls-rprx-vision").',
        },
      },
      required: ['inboundId', 'email'],
    },
  },
  {
    name: 'delete_client',
    description: 'Remove/delete a client from an inbound by their email address.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The email identifier of the client to remove.',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'reset_client_traffic',
    description: 'Reset the upload and download traffic consumption counters for a specific client back to zero.',
    inputSchema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          description: 'The email identifier of the client whose traffic should be reset.',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'get_online_clients',
    description: 'Get the list of clients currently connected and actively transmitting traffic through the proxy.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'restart_xray',
    description: 'Restart the Xray-core background service to apply configuration updates or recover from errors.',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

/**
 * Tool execution dispatcher.
 */
async function handleToolCall(name, args) {
  switch (name) {
    case 'get_system_status': {
      const data = await xuiFetch('/server/status');
      return {
        cpuPercent: `${data.cpu?.toFixed(1) || 0}%`,
        memory: {
          used: formatBytes(data.mem?.current),
          total: formatBytes(data.mem?.total),
          percent: `${((data.mem?.current / (data.mem?.total || 1)) * 100).toFixed(1)}%`,
        },
        disk: {
          used: formatBytes(data.disk?.current),
          total: formatBytes(data.disk?.total),
          percent: `${((data.disk?.current / (data.disk?.total || 1)) * 100).toFixed(1)}%`,
        },
        network: {
          netIO: {
            up: formatBytes(data.netIO?.up) + '/s',
            down: formatBytes(data.netIO?.down) + '/s',
          },
          netTraffic: {
            sent: formatBytes(data.netTraffic?.sent),
            received: formatBytes(data.netTraffic?.recv),
          },
        },
        uptimeHours: (data.uptime / 3600).toFixed(1),
        xrayStatus: data.xray?.state || 'unknown',
        xrayVersion: data.xray?.version || 'unknown',
        raw: data,
      };
    }

    case 'get_xray_version': {
      const data = await xuiFetch('/server/getXrayVersion');
      return { version: data };
    }

    case 'list_inbounds': {
      const list = await xuiFetch('/inbounds/list');
      return (list || []).map((ib) => ({
        id: ib.id,
        tag: ib.tag,
        port: ib.port,
        protocol: ib.protocol,
        listen: ib.listen || '0.0.0.0',
        enable: ib.enable,
        clientCount: ib.clientStats?.length || 0,
        up: formatBytes(ib.up),
        down: formatBytes(ib.down),
        totalTraffic: formatBytes((ib.up || 0) + (ib.down || 0)),
        expiryTime: ib.expiryTime > 0 ? new Date(ib.expiryTime).toISOString() : 'Never',
      }));
    }

    case 'get_inbound': {
      const data = await xuiFetch(`/inbounds/get/${args.id}`);
      return data;
    }

    case 'list_clients': {
      const inbounds = await xuiFetch('/inbounds/list');
      const results = [];

      for (const ib of inbounds || []) {
        if (args.inboundId && ib.id !== args.inboundId) continue;

        let clients = [];
        try {
          const settings = JSON.parse(ib.settings || '{}');
          clients = settings.clients || [];
        } catch {}

        const statsMap = new Map();
        for (const stat of ib.clientStats || []) {
          statsMap.set(stat.email, stat);
        }

        for (const c of clients) {
          const stat = statsMap.get(c.email) || {};
          results.push({
            inboundId: ib.id,
            inboundTag: ib.tag,
            protocol: ib.protocol,
            inboundPort: ib.port,
            email: c.email,
            idOrUuid: c.id || c.password,
            enable: c.enable !== false,
            up: formatBytes(stat.up),
            down: formatBytes(stat.down),
            totalUsed: formatBytes((stat.up || 0) + (stat.down || 0)),
            quota: c.totalGB > 0 ? `${c.totalGB} GB` : 'Unlimited',
            expiry: c.expiryTime > 0 ? new Date(c.expiryTime).toISOString() : 'Never',
          });
        }
      }
      return results;
    }

    case 'add_client': {
      const uuid = args.uuid || crypto.randomUUID();
      const totalBytes = args.totalGB ? Math.round(args.totalGB * 1024 * 1024 * 1024) : 0;
      const expiryTime = args.expiryDays ? Date.now() + args.expiryDays * 86400 * 1000 : 0;

      const clientPayload = {
        id: uuid,
        email: args.email,
        totalGB: totalBytes,
        expiryTime: expiryTime,
        enable: true,
        flow: args.flow || '',
      };

      const payload = {
        id: args.inboundId,
        settings: JSON.stringify({
          clients: [clientPayload],
        }),
      };

      const res = await xuiFetch('/clients/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: `Client ${args.email} successfully added to inbound ${args.inboundId}`,
        client: {
          inboundId: args.inboundId,
          email: args.email,
          uuid: uuid,
          quota: args.totalGB ? `${args.totalGB} GB` : 'Unlimited',
          expiry: expiryTime > 0 ? new Date(expiryTime).toISOString() : 'Never',
        },
        raw: res,
      };
    }

    case 'delete_client': {
      const res = await xuiFetch(`/clients/del/${encodeURIComponent(args.email)}`, {
        method: 'POST',
      });
      return {
        success: true,
        message: `Client ${args.email} deleted successfully`,
        raw: res,
      };
    }

    case 'reset_client_traffic': {
      const res = await xuiFetch(`/clients/resetTraffic/${encodeURIComponent(args.email)}`, {
        method: 'POST',
      });
      return {
        success: true,
        message: `Traffic counter for ${args.email} has been reset to 0`,
        raw: res,
      };
    }

    case 'get_online_clients': {
      const res = await xuiFetch('/clients/onlines', {
        method: 'POST',
      });
      return {
        onlineEmails: res || [],
        count: Array.isArray(res) ? res.length : 0,
      };
    }

    case 'restart_xray': {
      const res = await xuiFetch('/server/restartXrayService', {
        method: 'POST',
      });
      return {
        success: true,
        message: 'Xray core service restarted successfully',
        raw: res,
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Handle incoming JSON-RPC 2.0 messages.
 */
async function processMessage(msg) {
  if (!msg || typeof msg !== 'object') return null;

  const { id, method, params } = msg;

  // Handle Handshake
  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: '3x-ui-mcp',
          version: '1.0.0',
        },
      },
    };
  }

  // Handle Initialized Notification
  if (method === 'notifications/initialized') {
    return null;
  }

  // Handle Ping
  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  // List available tools
  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: TOOLS,
      },
    };
  }

  // Call a tool
  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      const output = await handleToolCall(name, args || {});
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(output, null, 2),
            },
          ],
        },
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          isError: true,
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${err.message}`,
            },
          ],
        },
      };
    }
  }

  // Unknown method
  if (id !== undefined) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32601,
        message: `Method not found: ${method}`,
      },
    };
  }

  return null;
}

/**
 * Main stdio loop.
 */
function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const msg = JSON.parse(trimmed);
      const res = await processMessage(msg);
      if (res) {
        process.stdout.write(JSON.stringify(res) + '\n');
      }
    } catch (err) {
      console.error('Failed to parse or process line:', err);
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

main();
