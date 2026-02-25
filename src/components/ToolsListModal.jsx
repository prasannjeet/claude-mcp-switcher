import React, { useState } from "react";
import { X, Wrench, Search } from "lucide-react";

export default function ToolsListModal({ serverName, tools, onClose }) {
  const [search, setSearch] = useState("");

  const filtered = tools.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              {serverName}
              <span className="text-sm font-normal text-slate-400 ml-2">
                {tools.length} tool{tools.length !== 1 ? "s" : ""}
              </span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search (only when >5 tools) */}
        {tools.length > 5 && (
          <div className="px-5 pt-4 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tools..."
                className="w-full bg-slate-900/60 border border-slate-600 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}

        {/* Tools list */}
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-4">
              No tools match your search.
            </p>
          ) : (
            <div className="space-y-2">
              {filtered.map((tool) => (
                <div
                  key={tool.name}
                  className="bg-slate-900/60 border border-slate-700/50 rounded-lg px-3 py-2.5"
                >
                  <div className="text-sm font-medium text-slate-200 font-mono">
                    {tool.name}
                  </div>
                  {tool.description && (
                    <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {tool.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t border-slate-700 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
