import React, { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

const EMPTY_ENV = { key: "", value: "" };

export default function AddServerModal({ onAdd, onClose }) {
  const [mode, setMode] = useState("form"); // "form" or "json"
  const [name, setName] = useState("");
  const [type, setType] = useState("stdio");
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [envPairs, setEnvPairs] = useState([{ ...EMPTY_ENV }]);
  const [rawJson, setRawJson] = useState('{\n  "command": "",\n  "args": [],\n  "type": "stdio"\n}');
  const [error, setError] = useState("");

  const addEnvPair = () => setEnvPairs([...envPairs, { ...EMPTY_ENV }]);
  const removeEnvPair = (i) => setEnvPairs(envPairs.filter((_, idx) => idx !== i));
  const updateEnv = (i, field, val) => {
    const updated = [...envPairs];
    updated[i][field] = val;
    setEnvPairs(updated);
  };

  const handleSubmit = () => {
    setError("");

    if (!name.trim()) {
      setError("Server name is required.");
      return;
    }

    if (/\s/.test(name.trim())) {
      setError("Server name cannot contain spaces.");
      return;
    }

    let serverConfig;

    if (mode === "json") {
      try {
        serverConfig = JSON.parse(rawJson);
      } catch {
        setError("Invalid JSON format.");
        return;
      }
      if (typeof serverConfig !== "object" || Array.isArray(serverConfig)) {
        setError("JSON must be an object.");
        return;
      }
    } else {
      if (type === "http") {
        if (!url.trim()) {
          setError("URL is required for HTTP type.");
          return;
        }
        serverConfig = { type: "http", url: url.trim() };
      } else {
        if (!command.trim()) {
          setError("Command is required.");
          return;
        }
        serverConfig = {
          command: command.trim(),
          args: args
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          type: "stdio",
        };
      }

      // Add env vars
      const env = {};
      for (const pair of envPairs) {
        if (pair.key.trim()) {
          env[pair.key.trim()] = pair.value;
        }
      }
      if (Object.keys(env).length > 0) {
        serverConfig.env = env;
      }
    }

    onAdd(name.trim(), serverConfig);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">Add MCP Server</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Mode tabs */}
          <div className="flex gap-1 bg-slate-900/60 p-1 rounded-lg">
            <button
              onClick={() => setMode("form")}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                mode === "form"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Form
            </button>
            <button
              onClick={() => setMode("json")}
              className={`flex-1 text-sm py-1.5 rounded-md transition-colors ${
                mode === "json"
                  ? "bg-slate-700 text-white"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              Raw JSON
            </button>
          </div>

          {/* Server name (always shown) */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Server Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-server"
              className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {mode === "form" ? (
            <>
              {/* Type selector */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Type</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setType("stdio")}
                    className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                      type === "stdio"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    stdio
                  </button>
                  <button
                    onClick={() => setType("http")}
                    className={`flex-1 text-sm py-2 rounded-lg border transition-colors ${
                      type === "http"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-slate-600 text-slate-400 hover:border-slate-500"
                    }`}
                  >
                    http
                  </button>
                </div>
              </div>

              {type === "stdio" ? (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">Command</label>
                    <input
                      type="text"
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      placeholder="uvx, node, docker, etc."
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1.5">
                      Args <span className="text-slate-600">(comma-separated)</span>
                    </label>
                    <input
                      type="text"
                      value={args}
                      onChange={(e) => setArgs(e.target.value)}
                      placeholder="--flag, value, --other"
                      className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">URL</label>
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/mcp/"
                    className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              )}

              {/* Env vars */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs text-slate-400">
                    Environment Variables <span className="text-slate-600">(optional)</span>
                  </label>
                  <button
                    onClick={addEnvPair}
                    className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add
                  </button>
                </div>
                <div className="space-y-2">
                  {envPairs.map((pair, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={pair.key}
                        onChange={(e) => updateEnv(i, "key", e.target.value)}
                        placeholder="KEY"
                        className="w-1/3 bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="text"
                        value={pair.value}
                        onChange={(e) => updateEnv(i, "value", e.target.value)}
                        placeholder="value"
                        className="flex-1 bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                      {envPairs.length > 1 && (
                        <button
                          onClick={() => removeEnvPair(i)}
                          className="p-1 text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Server Configuration JSON</label>
              <textarea
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                rows={8}
                spellCheck={false}
                className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-y"
              />
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
          >
            Add Server
          </button>
        </div>
      </div>
    </div>
  );
}
