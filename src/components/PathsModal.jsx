import React, { useState } from "react";
import { X, Plus, Trash2, FolderCog, Lock } from "lucide-react";

export default function PathsModal({ systemPaths, userPaths, onAddPath, onRemovePath, onClose }) {
  const [newPath, setNewPath] = useState("");
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    const trimmed = newPath.trim();
    if (!trimmed) {
      setError("Path cannot be empty.");
      return;
    }
    if (systemPaths.includes(trimmed) || userPaths.includes(trimmed)) {
      setError("This path is already in the list.");
      return;
    }
    onAddPath(trimmed);
    setNewPath("");
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <FolderCog className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-100">PATH Directories</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          {/* System paths */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
                System paths — loaded from your profile
              </span>
            </div>
            <div className="space-y-1">
              {systemPaths.length === 0 ? (
                <p className="text-xs text-slate-600 py-2">No system paths detected.</p>
              ) : (
                systemPaths.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 bg-slate-900/40 border border-slate-700/40 rounded-lg px-3 py-2"
                  >
                    <span className="text-xs text-slate-400 font-mono truncate flex-1">{p}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* User paths */}
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-2 block">
              Custom paths
            </span>
            <div className="space-y-1">
              {userPaths.length === 0 ? (
                <p className="text-xs text-slate-600 py-2">No custom paths added yet.</p>
              ) : (
                userPaths.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2 group"
                  >
                    <span className="text-xs text-slate-300 font-mono truncate flex-1">{p}</span>
                    <button
                      onClick={() => onRemovePath(p)}
                      className="p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add new */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                placeholder="/path/to/directory"
                className="flex-1 bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-xs font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={handleAdd}
                className="flex items-center gap-1 px-3 py-2 text-xs font-medium text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/10 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-2">{error}</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
