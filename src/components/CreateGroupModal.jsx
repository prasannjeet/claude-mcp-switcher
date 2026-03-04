import React, { useState, useMemo } from "react";
import { X, Search, ArrowRight, ArrowLeft } from "lucide-react";

export default function CreateGroupModal({ servers, groups, editGroup, onSave, onClose }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(editGroup?.name || "");
  const [selected, setSelected] = useState(
    () => new Set(editGroup?.serverNames || [])
  );
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const isEdit = !!editGroup;

  const handleNext = () => {
    setError("");
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Group name is required.");
      return;
    }
    const duplicate = groups.some(
      (g) => g.name.toLowerCase() === trimmed.toLowerCase() && g.id !== editGroup?.id
    );
    if (duplicate) {
      setError("A group with this name already exists.");
      return;
    }
    setStep(2);
  };

  const handleSave = () => {
    onSave(name.trim(), [...selected]);
  };

  const toggleServer = (serverName) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(serverName)) next.delete(serverName);
      else next.add(serverName);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return servers;
    const q = search.toLowerCase();
    return servers.filter((s) => s.name.toLowerCase().includes(q));
  }, [servers, search]);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h2 className="text-lg font-semibold text-slate-100">
            {isEdit ? "Edit Group" : "Create Group"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-700/50 shrink-0">
          <span className={`text-xs font-medium ${step === 1 ? "text-emerald-400" : "text-slate-500"}`}>
            1. Name
          </span>
          <span className="text-slate-600 text-xs">/</span>
          <span className={`text-xs font-medium ${step === 2 ? "text-emerald-400" : "text-slate-500"}`}>
            2. Select Servers
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                  placeholder="e.g. Work Set"
                  autoFocus
                  className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter servers…"
                  autoFocus
                  className="w-full bg-slate-900/60 border border-slate-600 rounded-lg pl-10 pr-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <p className="text-xs text-slate-500">
                {selected.size} server{selected.size !== 1 ? "s" : ""} selected
              </p>
              <div className="space-y-1">
                {filtered.map((s) => (
                  <label
                    key={s.name}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-700/40 cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.name)}
                      onChange={() => toggleServer(s.name)}
                      className="w-4 h-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 bg-slate-900/60"
                    />
                    <span className="text-sm text-slate-200">{s.name}</span>
                    <span className={`text-xs ml-auto ${s.enabled ? "text-emerald-400/60" : "text-slate-600"}`}>
                      {s.enabled ? "enabled" : "disabled"}
                    </span>
                  </label>
                ))}
                {filtered.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-4">No servers match.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between gap-3 px-5 py-4 border-t border-slate-700 shrink-0">
          {step === 2 ? (
            <button
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
          {step === 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={selected.size === 0}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isEdit ? "Save Changes" : "Create Group"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
