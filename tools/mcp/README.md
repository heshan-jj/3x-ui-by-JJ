# 3X-UI by JJ — Model Context Protocol (MCP) Server

Connect **Claude Desktop**, **Claude Code**, **Cursor**, **Windsurf**, or any MCP-compatible AI client directly to your **3X-UI by JJ** server.

With this MCP integration, you can ask Claude to monitor server vitals, manage inbounds, create clients, track bandwidth usage, and troubleshoot Xray logs using natural language.

---

## Quick Start

### 1. Requirements
- Node.js 18.0 or newer on your local machine.
- An API Token from your 3X-UI panel (go to **Settings** → **Security** → **API Tokens** → **+ New token**), or panel administrator username/password.

---

### 2. Configure Claude Desktop

Add the following to your `claude_desktop_config.json`:

- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux:** `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "3x-ui": {
      "command": "node",
      "args": ["/path/to/3x-ui-by-JJ/tools/mcp/index.js"],
      "env": {
        "XUI_BASE_URL": "https://your-panel-domain:2053/panel",
        "XUI_API_TOKEN": "your_api_bearer_token"
      }
    }
  }
}
```

> **Tip:** If running locally on the same server, set `XUI_BASE_URL` to `http://127.0.0.1:2053`.

---

### 3. Configure with Claude Code (CLI)

Run:

```bash
claude mcp add 3x-ui node /path/to/3x-ui-by-JJ/tools/mcp/index.js \
  -e XUI_BASE_URL="https://your-panel-domain:2053/panel" \
  -e XUI_API_TOKEN="your_api_bearer_token"
```

---

## Environment Variables

| Variable | Description | Example |
| :--- | :--- | :--- |
| `XUI_BASE_URL` | Base URL of your 3X-UI panel (with port and base path) | `https://vps.example.com:2053/panel` |
| `XUI_API_TOKEN` | Bearer API token generated in Panel Settings (Recommended) | `9f3c7a...` |
| `XUI_USERNAME` | Administrator username (used if `XUI_API_TOKEN` is not set) | `admin` |
| `XUI_PASSWORD` | Administrator password (used if `XUI_API_TOKEN` is not set) | `admin` |

---

## Available Tools

| Tool | Description |
| :--- | :--- |
| `get_system_status` | Returns CPU%, RAM usage, Disk usage, network up/down rates, uptime, and Xray core state. |
| `get_xray_version` | Returns the currently running version of Xray core. |
| `list_inbounds` | Lists all inbounds with protocols (VLESS, VMess, Trojan, etc.), ports, and traffic stats. |
| `get_inbound` | Returns full stream settings, security (Reality/TLS), and clients for an inbound ID. |
| `list_clients` | Lists clients with emails, traffic used (up/down/total), quotas, and expiration dates. |
| `add_client` | Adds a new client to an inbound with email, traffic quota (GB), and expiration (days). |
| `delete_client` | Removes a client by their email address. |
| `reset_client_traffic` | Resets bandwidth usage counters for a client back to 0. |
| `get_online_clients` | Returns a list of client emails currently online and active. |
| `restart_xray` | Restarts the Xray core service. |

---

## Example Prompts for Claude

- *"Claude, what is the current CPU and RAM usage on my 3X-UI server?"*
- *"Show me all inbounds and how many clients are configured on each."*
- *"List all clients who have used more than 10 GB of data."*
- *"Add a new client named 'WorkLaptop' to inbound #1 with a 100 GB limit expiring in 30 days."*
- *"Are there any clients currently online?"*
- *"Restart the Xray service and verify its status."*
