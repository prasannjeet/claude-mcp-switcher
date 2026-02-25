const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { spawn, execFile } = require("child_process");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
    backgroundColor: "#0f172a",
  });

  if (process.env.ELECTRON_DEV === "true") {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    mainWindow.loadFile(path.join(__dirname, "..", "dist", "index.html"));
  }
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  app.quit();
});

// Expand ~ to home dir
function expandPath(filePath) {
  if (filePath.startsWith("~")) {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

// Read and parse the claude.json file, extract MCP server blocks
ipcMain.handle("load-config", async (_event, filePath) => {
  try {
    const resolved = expandPath(filePath.trim());
    if (!fs.existsSync(resolved)) {
      return { error: `File not found: ${resolved}` };
    }

    const raw = fs.readFileSync(resolved, "utf-8");
    let config;
    try {
      config = JSON.parse(raw);
    } catch {
      return { error: "File is not valid JSON." };
    }

    if (typeof config !== "object" || config === null || Array.isArray(config)) {
      return { error: "File does not contain a JSON object." };
    }

    // Ensure both blocks exist
    if (!config.mcpServers) config.mcpServers = {};
    if (!config.mcpServers_disabled) config.mcpServers_disabled = {};

    return {
      enabled: config.mcpServers,
      disabled: config.mcpServers_disabled,
      resolvedPath: resolved,
    };
  } catch (err) {
    return { error: err.message };
  }
});

// Toggle a server between enabled and disabled
ipcMain.handle("toggle-server", async (_event, filePath, serverName, enable) => {
  try {
    const resolved = expandPath(filePath.trim());
    const raw = fs.readFileSync(resolved, "utf-8");
    const config = JSON.parse(raw);

    if (!config.mcpServers) config.mcpServers = {};
    if (!config.mcpServers_disabled) config.mcpServers_disabled = {};

    if (enable) {
      // Move from disabled to enabled
      if (config.mcpServers_disabled[serverName]) {
        config.mcpServers[serverName] = config.mcpServers_disabled[serverName];
        delete config.mcpServers_disabled[serverName];
      }
    } else {
      // Move from enabled to disabled
      if (config.mcpServers[serverName]) {
        config.mcpServers_disabled[serverName] = config.mcpServers[serverName];
        delete config.mcpServers[serverName];
      }
    }

    fs.writeFileSync(resolved, JSON.stringify(config, null, 2) + "\n", "utf-8");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// Add a new MCP server
ipcMain.handle("add-server", async (_event, filePath, serverName, serverConfig) => {
  try {
    const resolved = expandPath(filePath.trim());
    const raw = fs.readFileSync(resolved, "utf-8");
    const config = JSON.parse(raw);

    if (!config.mcpServers) config.mcpServers = {};
    if (!config.mcpServers_disabled) config.mcpServers_disabled = {};

    if (config.mcpServers[serverName] || config.mcpServers_disabled[serverName]) {
      return { error: `Server "${serverName}" already exists.` };
    }

    // Add to enabled by default
    config.mcpServers[serverName] = serverConfig;

    fs.writeFileSync(resolved, JSON.stringify(config, null, 2) + "\n", "utf-8");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// Update a server's config
ipcMain.handle("update-server", async (_event, filePath, serverName, newConfig) => {
  try {
    const resolved = expandPath(filePath.trim());
    const raw = fs.readFileSync(resolved, "utf-8");
    const config = JSON.parse(raw);

    if (!config.mcpServers) config.mcpServers = {};
    if (!config.mcpServers_disabled) config.mcpServers_disabled = {};

    if (config.mcpServers[serverName]) {
      config.mcpServers[serverName] = newConfig;
    } else if (config.mcpServers_disabled[serverName]) {
      config.mcpServers_disabled[serverName] = newConfig;
    } else {
      return { error: `Server "${serverName}" not found.` };
    }

    fs.writeFileSync(resolved, JSON.stringify(config, null, 2) + "\n", "utf-8");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// Delete a server
ipcMain.handle("delete-server", async (_event, filePath, serverName) => {
  try {
    const resolved = expandPath(filePath.trim());
    const raw = fs.readFileSync(resolved, "utf-8");
    const config = JSON.parse(raw);

    if (!config.mcpServers) config.mcpServers = {};
    if (!config.mcpServers_disabled) config.mcpServers_disabled = {};

    delete config.mcpServers[serverName];
    delete config.mcpServers_disabled[serverName];

    fs.writeFileSync(resolved, JSON.stringify(config, null, 2) + "\n", "utf-8");
    return { success: true };
  } catch (err) {
    return { error: err.message };
  }
});

// Read system PATH directories (platform-aware)
ipcMain.handle("get-system-paths", async () => {
  const dirs = [];
  if (process.platform === "darwin" || process.platform === "linux") {
    // Read /etc/paths
    try {
      const etcPaths = fs.readFileSync("/etc/paths", "utf-8");
      for (const line of etcPaths.split("\n")) {
        const trimmed = line.trim();
        if (trimmed) dirs.push(expandPath(trimmed));
      }
    } catch {
      // /etc/paths may not exist
    }
    // Read /etc/paths.d/*
    try {
      const pathsD = fs.readdirSync("/etc/paths.d");
      for (const file of pathsD) {
        try {
          const content = fs.readFileSync(path.join("/etc/paths.d", file), "utf-8");
          for (const line of content.split("\n")) {
            const trimmed = line.trim();
            if (trimmed) dirs.push(expandPath(trimmed));
          }
        } catch {
          // skip unreadable files
        }
      }
    } catch {
      // /etc/paths.d may not exist
    }
  } else {
    // Windows: split process.env.PATH
    const envPath = process.env.PATH || "";
    for (const dir of envPath.split(path.delimiter)) {
      const trimmed = dir.trim();
      if (trimmed) dirs.push(trimmed);
    }
  }
  // Deduplicate
  return [...new Set(dirs)];
});

// Build a full PATH string from system + user-provided extra dirs
function buildPath(extraPaths = []) {
  const base = process.env.PATH || "";
  if (extraPaths.length === 0) return base;
  return extraPaths.join(path.delimiter) + path.delimiter + base;
}

// Check if a command exists on PATH
ipcMain.handle("check-command-exists", async (_event, command, extraPaths) => {
  return new Promise((resolve) => {
    const cmd = process.platform === "win32" ? "where" : "which";
    execFile(cmd, [command], { env: { ...process.env, PATH: buildPath(extraPaths) } }, (err) => {
      resolve({ exists: !err });
    });
  });
});

// Test a stdio MCP server: spawn it, do MCP handshake, get tools list
ipcMain.handle("test-server-stdio", async (_event, serverConfig, extraPaths) => {
  return new Promise((resolve) => {
    const { command, args = [], env = {} } = serverConfig;
    const timeout = 60000;
    let settled = false;
    let stdout = "";
    let stderr = "";

    const mergedEnv = { ...process.env, PATH: buildPath(extraPaths), ...env };

    let child;
    try {
      child = spawn(command, args, {
        env: mergedEnv,
        stdio: ["pipe", "pipe", "pipe"],
        shell: process.platform === "win32",
      });
    } catch (err) {
      resolve({ error: `Failed to spawn: ${err.message}` });
      return;
    }

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        child.kill("SIGKILL");
        resolve({ error: `Timed out after ${timeout / 1000}s. Stderr: ${stderr.slice(0, 500)}` });
      }
    }, timeout);

    child.on("error", (err) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ error: `Spawn error: ${err.message}` });
      }
    });

    // Suppress EPIPE errors on stdin — can fire if the child exits
    // before we finish writing (e.g. after child.kill())
    child.stdin.on("error", () => {});

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    // Parse newline-delimited JSON-RPC responses from stdout
    child.stdout.on("data", (data) => {
      stdout += data.toString();
      // Try to parse complete JSON-RPC messages (newline-delimited)
      const lines = stdout.split("\n");
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (!settled && msg.id === 1 && msg.result) {
            // initialize response — send initialized notification + tools/list
            const initialized = JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n";
            const toolsList = JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }) + "\n";
            try { child.stdin.write(initialized); } catch { /* EPIPE: child already gone */ }
            try { child.stdin.write(toolsList); } catch { /* EPIPE: child already gone */ }
          }
          if (msg.id === 2 && msg.result) {
            // tools/list response
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              child.kill();
              const tools = (msg.result.tools || []).map((t) => ({
                name: t.name,
                description: t.description || "",
              }));
              resolve({ tools, toolCount: tools.length });
            }
          }
          if (msg.error) {
            if (!settled) {
              settled = true;
              clearTimeout(timer);
              child.kill();
              resolve({ error: `MCP error: ${msg.error.message || JSON.stringify(msg.error)}` });
            }
          }
        } catch {
          // Not a complete JSON line yet, ignore
        }
      }
    });

    child.on("close", (code) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ error: `Process exited with code ${code}. Stderr: ${stderr.slice(0, 500)}` });
      }
    });

    // Send MCP initialize request
    const initRequest = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "mcp-server-switcher", version: "1.0.0" },
      },
    }) + "\n";

    try {
      child.stdin.write(initRequest);
    } catch (err) {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve({ error: `Failed to write to stdin: ${err.message}` });
      }
    }
  });
});

// Parse MCP response — handles both plain JSON and SSE (text/event-stream)
function parseMcpHttpBody(contentType, body) {
  if (contentType && contentType.includes("text/event-stream")) {
    // SSE: find the last data: line with a jsonrpc payload
    for (const line of body.split("\n").reverse()) {
      const trimmed = line.trim();
      if (trimmed.startsWith("data:")) {
        const json = trimmed.slice(5).trim();
        if (json) {
          try { return JSON.parse(json); } catch { /* skip */ }
        }
      }
    }
    return null;
  }
  try { return JSON.parse(body); } catch { return null; }
}

// Test an HTTP MCP server: do full MCP JSON-RPC handshake to get tools list
ipcMain.handle("test-server-http", async (_event, serverConfig) => {
  const { url, headers: extraHeaders = {} } = serverConfig;
  const timeout = 60000;

  const baseHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/event-stream",
    ...extraHeaders,
  };

  try {
    // Step 1: initialize
    const initCtrl = new AbortController();
    const initTimer = setTimeout(() => initCtrl.abort(), timeout);
    const initRes = await fetch(url, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "mcp-server-switcher", version: "1.0.0" },
        },
      }),
      signal: initCtrl.signal,
    });
    clearTimeout(initTimer);

    if (!initRes.ok) {
      return { error: `Initialize failed: HTTP ${initRes.status}` };
    }

    const initBody = await initRes.text();
    const initMsg = parseMcpHttpBody(initRes.headers.get("content-type"), initBody);
    if (!initMsg || !initMsg.result) {
      return { error: `Unexpected initialize response:\n${initBody.slice(0, 300)}` };
    }

    // Step 2: notifications/initialized (fire and forget, some servers need it)
    fetch(url, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }),
    }).catch(() => {});

    // Step 3: tools/list
    const toolsCtrl = new AbortController();
    const toolsTimer = setTimeout(() => toolsCtrl.abort(), timeout);
    const toolsRes = await fetch(url, {
      method: "POST",
      headers: baseHeaders,
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} }),
      signal: toolsCtrl.signal,
    });
    clearTimeout(toolsTimer);

    if (!toolsRes.ok) {
      return { error: `tools/list failed: HTTP ${toolsRes.status}` };
    }

    const toolsBody = await toolsRes.text();
    const toolsMsg = parseMcpHttpBody(toolsRes.headers.get("content-type"), toolsBody);
    if (!toolsMsg || !toolsMsg.result) {
      return { error: `Unexpected tools/list response:\n${toolsBody.slice(0, 300)}` };
    }

    const tools = (toolsMsg.result.tools || []).map((t) => ({
      name: t.name,
      description: t.description || "",
    }));
    return { tools, toolCount: tools.length };
  } catch (err) {
    return { error: `Connection failed: ${err.message}` };
  }
});
