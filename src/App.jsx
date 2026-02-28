import React, { useState, useCallback, useMemo, useEffect } from "react";
import Fuse from "fuse.js";
import { FolderOpen, Plus, RefreshCw, Server, Search, Info, FolderCog, PlayCircle, RotateCcw, X } from "lucide-react";
import ServerCard from "./components/ServerCard.jsx";
import AddServerModal from "./components/AddServerModal.jsx";
import ToolsGauge from "./components/ToolsGauge.jsx";
import ErrorDetailModal from "./components/ErrorDetailModal.jsx";
import ToolsListModal from "./components/ToolsListModal.jsx";
import PathsModal from "./components/PathsModal.jsx";
import Toast from "./components/Toast.jsx";

const TOOL_LIMIT = 80;
const USER_PATHS_KEY = "mcp-switcher-user-paths";

export default function App() {
  const [filePath, setFilePath] = useState("~/.claude.json");
  const [loaded, setLoaded] = useState(false);
  const [servers, setServers] = useState([]); // { name, config, enabled }
  const [loadError, setLoadError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [filter, setFilter] = useState("");

  // Test results: { [serverName]: { status, toolCount, tools, error } }
  const [testResults, setTestResults] = useState({});
  const [batchRunning, setBatchRunning] = useState(false);

  // Modal state
  const [errorModal, setErrorModal] = useState(null); // { serverName, error }
  const [toolsModal, setToolsModal] = useState(null); // { serverName, tools }
  const [showPathsModal, setShowPathsModal] = useState(false);

  // PATH management
  const [systemPaths, setSystemPaths] = useState([]);
  const [userPaths, setUserPaths] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(USER_PATHS_KEY)) || [];
    } catch {
      return [];
    }
  });

  // Load system paths on mount
  useEffect(() => {
    window.electronAPI.getSystemPaths()
      .then(setSystemPaths)
      .catch((err) => console.error("Failed to load system paths:", err));
  }, []);

  // Persist user paths to localStorage
  useEffect(() => {
    localStorage.setItem(USER_PATHS_KEY, JSON.stringify(userPaths));
  }, [userPaths]);

  // Combined extra paths (system + user) to pass to IPC calls
  const allExtraPaths = useMemo(
    () => [...systemPaths, ...userPaths],
    [systemPaths, userPaths]
  );

  const showToast = useCallback((message, type = "success") => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const loadFile = async () => {
    setLoadError("");
    setTestResults({});
    let result;
    try {
      result = await window.electronAPI.loadConfig(filePath);
    } catch (err) {
      setLoadError(`IPC error: ${err.message}`);
      setLoaded(false);
      setServers([]);
      return;
    }
    if (result.error) {
      setLoadError(result.error);
      setLoaded(false);
      setServers([]);
      return;
    }

    const list = [];
    const seen = new Set();
    for (const [name, config] of Object.entries(result.enabled || {})) {
      if (!seen.has(name) && config !== null && typeof config === "object") {
        seen.add(name);
        list.push({ name, config, enabled: true });
      }
    }
    for (const [name, config] of Object.entries(result.disabled || {})) {
      if (!seen.has(name) && config !== null && typeof config === "object") {
        seen.add(name);
        list.push({ name, config, enabled: false });
      }
    }
    list.sort((a, b) => a.name.localeCompare(b.name));

    setServers(list);
    setLoaded(true);
    showToast(`Loaded ${list.length} servers`);
  };

  const handleToggle = async (serverName, currentEnabled) => {
    const newEnabled = !currentEnabled;
    const result = await window.electronAPI.toggleServer(filePath, serverName, newEnabled);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setServers((prev) =>
      prev.map((s) => (s.name === serverName ? { ...s, enabled: newEnabled } : s))
    );
    showToast(`${serverName} ${newEnabled ? "enabled" : "disabled"}`);
  };

  const handleDelete = async (serverName) => {
    const result = await window.electronAPI.deleteServer(filePath, serverName);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setServers((prev) => prev.filter((s) => s.name !== serverName));
    setTestResults((prev) => {
      const next = { ...prev };
      delete next[serverName];
      return next;
    });
    showToast(`${serverName} deleted`);
  };

  const handleUpdateServer = async (serverName, newConfig) => {
    const result = await window.electronAPI.updateServer(filePath, serverName, newConfig);
    if (result.error) {
      showToast(result.error, "error");
      return false;
    }
    setServers((prev) =>
      prev.map((s) => (s.name === serverName ? { ...s, config: newConfig } : s))
    );
    showToast(`${serverName} updated`);
    return true;
  };

  const handleAdd = async (name, config) => {
    const result = await window.electronAPI.addServer(filePath, name, config);
    if (result.error) {
      showToast(result.error, "error");
      return;
    }
    setServers((prev) =>
      [...prev, { name, config, enabled: true }].sort((a, b) =>
        a.name.localeCompare(b.name)
      )
    );
    setShowAddModal(false);
    showToast(`${name} added`);
  };

  // Core test logic — does NOT set "testing" state (caller must do it)
  const handleTestCore = async (serverName) => {
    const server = servers.find((s) => s.name === serverName);
    if (!server) return;

    const serverType = server.config.type || "stdio";

    if (serverType === "http") {
      const url = server.config.url;
      if (!url) {
        setTestResults((prev) => ({
          ...prev,
          [serverName]: { status: "error", error: "No URL configured" },
        }));
        return;
      }
      const result = await window.electronAPI.testServerHttp(server.config);
      if (result.error) {
        setTestResults((prev) => ({
          ...prev,
          [serverName]: { status: "error", error: result.error },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [serverName]: {
            status: "success",
            toolCount: result.toolCount,
            tools: result.tools,
          },
        }));
        showToast(`${serverName}: ${result.toolCount} tools found`);
      }
    } else {
      // stdio
      const command = server.config.command;
      if (!command) {
        setTestResults((prev) => ({
          ...prev,
          [serverName]: { status: "error", error: "No command configured" },
        }));
        return;
      }

      // Quick check: does the command exist?
      const cmdCheck = await window.electronAPI.checkCommandExists(command, allExtraPaths);
      if (!cmdCheck.exists) {
        setTestResults((prev) => ({
          ...prev,
          [serverName]: {
            status: "error",
            error: `Command not found: "${command}"\n\nMake sure it is installed and available in your PATH.\nYou can add custom PATH directories via the PATH Settings button.`,
          },
        }));
        return;
      }

      const result = await window.electronAPI.testServerStdio(server.config, allExtraPaths);
      if (result.error) {
        setTestResults((prev) => ({
          ...prev,
          [serverName]: { status: "error", error: result.error },
        }));
      } else {
        setTestResults((prev) => ({
          ...prev,
          [serverName]: {
            status: "success",
            toolCount: result.toolCount,
            tools: result.tools,
          },
        }));
        showToast(`${serverName}: ${result.toolCount} tools found`);
      }
    }
  };

  const handleTest = async (serverName) => {
    setTestResults((prev) => ({ ...prev, [serverName]: { status: "testing" } }));
    await handleTestCore(serverName);
  };

  const handleTestBatch = async (mode) => {
    if (batchRunning) return;

    // Pick targets based on mode
    const targets = servers.filter((s) => {
      const tested = testResults[s.name]?.status === "success" || testResults[s.name]?.status === "error";
      if (mode === "test-enabled") return s.enabled && !tested;
      if (mode === "retest-enabled") return s.enabled;
      if (mode === "test-all") return !tested;
      if (mode === "retest-all") return true;
      return false;
    });

    if (targets.length === 0) return;

    setBatchRunning(true);

    // Mark all targets as "testing" immediately so spinners show up at once
    setTestResults((prev) => {
      const next = { ...prev };
      for (const s of targets) next[s.name] = { status: "testing" };
      return next;
    });

    // Run with concurrency = 3
    const names = targets.map((s) => s.name);
    let idx = 0;
    const worker = async () => {
      while (idx < names.length) {
        const name = names[idx++];
        await handleTestCore(name);
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(3, names.length) }, () => worker())
    );

    setBatchRunning(false);
  };

  const handleAddPath = (p) => {
    setUserPaths((prev) => [...prev, p]);
  };

  const handleRemovePath = (p) => {
    setUserPaths((prev) => prev.filter((x) => x !== p));
  };

  // Computed values
  const { totalTools, testedCount } = useMemo(() => {
    let total = 0;
    let tested = 0;
    for (const s of servers) {
      const tr = testResults[s.name];
      if (tr && tr.status === "success" && s.enabled) {
        total += tr.toolCount || 0;
        tested++;
      } else if (tr && tr.status === "success" && !s.enabled) {
        tested++;
      } else if (tr && tr.status === "error") {
        tested++;
      }
    }
    return { totalTools: total, testedCount: tested };
  }, [servers, testResults]);

  const fuse = useMemo(
    () =>
      new Fuse(servers, {
        keys: ["name"],
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 1,
        includeScore: true,
      }),
    [servers]
  );

  const filtered = useMemo(() => {
    if (!filter.trim()) return servers;
    return fuse.search(filter).map((r) => r.item);
  }, [filter, fuse, servers]);

  const enabledCount = servers.filter((s) => s.enabled).length;
  const disabledCount = servers.filter((s) => !s.enabled).length;

  const hasAnyTestResult = Object.keys(testResults).length > 0;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Title bar drag region — only this strip drags the window */}
      <div className="drag-region h-8 shrink-0" />

      <div className="flex-1 overflow-y-auto px-6 pb-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            MCP Server Switcher
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Toggle your Claude MCP servers on and off
          </p>
        </div>

        {/* File path input */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={filePath}
              onChange={(e) => setFilePath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && loadFile()}
              placeholder="Path to claude.json (e.g. ~/.claude.json)"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            onClick={() => setShowPathsModal(true)}
            className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-slate-400 hover:text-emerald-400 border border-slate-700 rounded-xl hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors shrink-0"
            title="PATH Settings"
          >
            <FolderCog className="w-4 h-4" />
            <span className="text-xs">PATH</span>
          </button>
          <button
            onClick={loadFile}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 shrink-0"
          >
            {loaded ? <RefreshCw className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />}
            {loaded ? "Reload" : "Load"}
          </button>
        </div>

        {/* Restart notice */}
        <div className="flex items-start gap-2 mb-6 px-3 py-2.5 bg-amber-500/8 border border-amber-500/20 rounded-xl">
          <Info className="w-3.5 h-3.5 text-amber-400/70 mt-0.5 shrink-0" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Changes take effect after restarting Claude — run{" "}
            <code className="text-amber-300/80 bg-slate-800 px-1 py-0.5 rounded">/exit</code>
            {" "}in Claude, then reopen with{" "}
            <code className="text-amber-300/80 bg-slate-800 px-1 py-0.5 rounded">claude --resume</code>.
          </p>
        </div>

        {loadError && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            {loadError}
          </div>
        )}

        {loaded && (
          <>
            {/* Stats bar + actions */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400">
                  <span className="text-emerald-400 font-semibold">{enabledCount}</span> enabled
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  <span className="text-slate-300 font-semibold">{disabledCount}</span> disabled
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400">
                  <span className="text-slate-300 font-semibold">{servers.length}</span> total
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Server
              </button>
            </div>

            {/* Prominent search bar */}
            <div className="relative mb-4 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors pointer-events-none" />
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search servers…"
                className="w-full bg-slate-800/70 border border-slate-700 rounded-xl pl-11 pr-24 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/40 transition-all"
              />
              {filter && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <span className="text-xs text-slate-500 pr-2 border-r border-slate-700">
                    {filtered.length} / {servers.length}
                  </span>
                  <button
                    onClick={() => setFilter("")}
                    className="p-0.5 rounded-md text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Batch test buttons */}
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-slate-600 font-medium uppercase tracking-wider mr-1">Test</span>
              {[
                {
                  mode: "test-enabled",
                  label: "Enabled",
                  icon: <PlayCircle className="w-3.5 h-3.5" />,
                  tooltip: "Test all enabled servers that haven't been tested yet",
                },
                {
                  mode: "retest-enabled",
                  label: "Re-test Enabled",
                  icon: <RotateCcw className="w-3.5 h-3.5" />,
                  tooltip: "Re-run tests for all enabled servers, including previously tested ones",
                },
                {
                  mode: "test-all",
                  label: "All",
                  icon: <PlayCircle className="w-3.5 h-3.5" />,
                  tooltip: "Test all servers (enabled + disabled) that haven't been tested yet",
                },
                {
                  mode: "retest-all",
                  label: "Re-test All",
                  icon: <RotateCcw className="w-3.5 h-3.5" />,
                  tooltip: "Re-run tests for every server regardless of previous results",
                },
              ].map(({ mode, label, icon, tooltip }) => {
                const disabled = batchRunning;
                return (
                  <div key={mode} className="relative group">
                    <button
                      onClick={() => handleTestBatch(mode)}
                      disabled={disabled}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        disabled
                          ? "text-slate-600 border-slate-700/50 cursor-not-allowed"
                          : "text-slate-400 border-slate-700 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5"
                      }`}
                    >
                      {icon}
                      {label}
                    </button>
                    {/* Instant CSS tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 px-3 py-2 text-xs text-slate-200 bg-slate-900 border border-slate-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 text-center leading-relaxed shadow-xl">
                      {tooltip}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tools gauge */}
            {hasAnyTestResult && (
              <ToolsGauge
                totalTools={totalTools}
                testedCount={testedCount}
                totalServers={servers.length}
              />
            )}

            {/* Server list */}
            <div className="space-y-2">
              {filtered.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-sm">
                  {servers.length === 0
                    ? "No MCP servers found in this file."
                    : "No servers match your filter."}
                </div>
              ) : (
                filtered.map((s) => (
                  <ServerCard
                    key={s.name}
                    name={s.name}
                    config={s.config}
                    enabled={s.enabled}
                    onToggle={() => handleToggle(s.name, s.enabled)}
                    onDelete={() => handleDelete(s.name)}
                    onUpdate={(newConfig) => handleUpdateServer(s.name, newConfig)}
                    onTest={() => handleTest(s.name)}
                    testResult={testResults[s.name]}
                    onShowError={() =>
                      setErrorModal({
                        serverName: s.name,
                        error: testResults[s.name]?.error || "Unknown error",
                      })
                    }
                    onShowTools={() =>
                      setToolsModal({
                        serverName: s.name,
                        tools: testResults[s.name]?.tools || [],
                      })
                    }
                  />
                ))
              )}
            </div>
          </>
        )}

        {!loaded && !loadError && (
          <div className="text-center py-20">
            <Server className="w-12 h-12 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">
              Enter the path to your <code className="text-slate-400">claude.json</code> file and click Load
            </p>
          </div>
        )}
      </div>
      </div>

      {/* Modals / Toasts */}
      {showAddModal && (
        <AddServerModal onAdd={handleAdd} onClose={() => setShowAddModal(false)} />
      )}
      {showPathsModal && (
        <PathsModal
          systemPaths={systemPaths}
          userPaths={userPaths}
          onAddPath={handleAddPath}
          onRemovePath={handleRemovePath}
          onClose={() => setShowPathsModal(false)}
        />
      )}
      {errorModal && (
        <ErrorDetailModal
          serverName={errorModal.serverName}
          error={errorModal.error}
          onClose={() => setErrorModal(null)}
        />
      )}
      {toolsModal && (
        <ToolsListModal
          serverName={toolsModal.serverName}
          tools={toolsModal.tools}
          onClose={() => setToolsModal(null)}
        />
      )}
      {toast && (
        <Toast
          key={toast.key}
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
