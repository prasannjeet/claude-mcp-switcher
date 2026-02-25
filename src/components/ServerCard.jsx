import React, { useState } from "react";
import Toggle from "./Toggle.jsx";
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Terminal,
  Globe,
  Play,
  RotateCcw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Check,
  Pencil,
  Save,
  X,
} from "lucide-react";

export default function ServerCard({
  name,
  config,
  enabled,
  onToggle,
  onDelete,
  onUpdate,
  onTest,
  testResult,
  onShowError,
  onShowTools,
}) {
  const [expanded, setExpanded] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [jsonCopied, setJsonCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [jsonValid, setJsonValid] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setJsonCopied(true);
    setTimeout(() => setJsonCopied(false), 1500);
  };

  const validateJson = (text) => {
    const trimmed = text.trim();
    if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return false;
    try {
      const parsed = JSON.parse(trimmed);
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed);
    } catch {
      return false;
    }
  };

  const handleEditStart = () => {
    setEditText(JSON.stringify(config, null, 2));
    setJsonValid(true);
    setEditing(true);
  };

  const handleEditChange = (value) => {
    setEditText(value);
    setJsonValid(validateJson(value));
  };

  const handleEditCancel = () => {
    setEditing(false);
    setEditText("");
    setJsonValid(true);
  };

  const handleEditSave = async () => {
    if (!jsonValid) return;
    setSaving(true);
    const newConfig = JSON.parse(editText.trim());
    const success = await onUpdate(newConfig);
    setSaving(false);
    if (success) {
      setEditing(false);
      setEditText("");
    }
  };

  const serverType = config.type || "stdio";
  const command = config.command || config.url || "-";

  const handleToggle = async () => {
    setToggling(true);
    await onToggle();
    setToggling(false);
  };

  const testStatus = testResult?.status || "idle";

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        enabled
          ? "bg-slate-800/60 border-slate-700 hover:border-emerald-600/50"
          : "bg-slate-800/30 border-slate-700/50 hover:border-slate-600"
      }`}
    >
      <div className="flex items-center gap-4 px-4 py-3">
        {/* Toggle */}
        <Toggle enabled={enabled} onToggle={handleToggle} disabled={toggling} />

        {/* Icon */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-lg ${
            enabled ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-700/50 text-slate-500"
          }`}
        >
          {serverType === "http" ? (
            <Globe className="w-4 h-4" />
          ) : (
            <Terminal className="w-4 h-4" />
          )}
        </div>

        {/* Name + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`font-medium text-sm truncate ${
                enabled ? "text-slate-100" : "text-slate-400"
              }`}
            >
              {name}
            </span>
            <button
              onClick={handleCopy}
              className="p-1 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-700/50 transition-colors flex-shrink-0"
              title="Copy server name"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                enabled
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-slate-700 text-slate-500"
              }`}
            >
              {serverType}
            </span>
          </div>
          <div className="text-xs text-slate-500 truncate mt-0.5">
            {command}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Test button / result */}
          {testStatus === "idle" && (
            <button
              onClick={onTest}
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-700/50 transition-colors"
              title="Test server"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          {testStatus === "testing" && (
            <div className="p-1.5 text-amber-400">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          )}
          {testStatus === "success" && (
            <>
              <button
                onClick={onShowTools}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/20 transition-colors"
                title="View tools"
              >
                <CheckCircle className="w-3 h-3" />
                {testResult.toolCount} tool{testResult.toolCount !== 1 ? "s" : ""}
              </button>
              <button
                onClick={onTest}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-700/50 transition-colors"
                title="Retry test"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {testStatus === "error" && (
            <>
              <button
                onClick={onShowError}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-full hover:bg-red-500/20 transition-colors"
                title="View error"
              >
                <AlertCircle className="w-3 h-3" />
                Failed
              </button>
              <button
                onClick={onTest}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-700/50 transition-colors"
                title="Retry test"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <button
            onClick={() => {
              const next = !expanded;
              setExpanded(next);
              if (!next && editing) handleEditCancel();
            }}
            className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-700/50 transition-colors"
            title="Show details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-slate-500 hover:text-red-400 rounded-md hover:bg-red-500/10 transition-colors"
            title="Delete server"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-3 pt-0 border-t border-slate-700/50">
          <div className="relative mt-3">
            {/* Action buttons row */}
            <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
              {editing && (
                <>
                  <button
                    onClick={handleEditSave}
                    disabled={!jsonValid || saving}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                      jsonValid && !saving
                        ? "text-emerald-400 hover:bg-emerald-500/15 hover:text-emerald-300"
                        : "text-slate-600 cursor-not-allowed"
                    }`}
                    title={jsonValid ? "Save changes" : "Fix JSON errors to save"}
                  >
                    <Save className="w-3.5 h-3.5" />
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 rounded-md transition-colors"
                    title="Cancel editing"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </button>
                </>
              )}
              <button
                onClick={handleCopyJson}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-700/50 transition-colors"
                title="Copy JSON"
              >
                {jsonCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={handleEditStart}
                disabled={editing}
                className={`p-1.5 rounded-md transition-colors ${
                  editing
                    ? "text-slate-600 cursor-not-allowed"
                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-700/50"
                }`}
                title={editing ? "Currently editing" : "Edit JSON"}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* JSON display / editor */}
            {editing ? (
              <div>
                <textarea
                  value={editText}
                  onChange={(e) => handleEditChange(e.target.value)}
                  spellCheck={false}
                  className={`w-full text-xs font-mono bg-slate-900/60 rounded-lg p-3 pr-10 min-h-[12rem] max-h-[24rem] resize-y overflow-auto focus:outline-none border ${
                    jsonValid
                      ? "text-slate-300 border-emerald-500/30 focus:border-emerald-500"
                      : "text-red-300 border-red-500/50 focus:border-red-500"
                  }`}
                />
                {!jsonValid && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Invalid JSON — must be a valid JSON object
                  </p>
                )}
              </div>
            ) : (
              <pre className="text-xs text-slate-400 bg-slate-900/60 rounded-lg p-3 pr-10 overflow-x-auto max-h-48 overflow-y-auto">
                {JSON.stringify(config, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
