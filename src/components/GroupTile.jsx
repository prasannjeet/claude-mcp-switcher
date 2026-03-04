import React from "react";
import { Play, Pencil, Trash2, CheckCircle } from "lucide-react";

export default function GroupTile({ group, isActive, staleNames, onActivate, onEdit, onDelete }) {
  const serverCount = group.serverNames.length;

  return (
    <div
      className={`group-tile relative rounded-xl border p-4 transition-all ${
        isActive
          ? "border-emerald-500/50 bg-emerald-500/8"
          : "border-slate-700 bg-slate-800/60 hover:border-slate-600"
      }`}
    >
      {/* Active badge */}
      {isActive && (
        <div className="absolute top-3 right-3 flex items-center gap-1 text-xs text-emerald-400 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          Active
        </div>
      )}

      {/* Group name */}
      <h3 className="text-sm font-semibold text-slate-100 mb-1 pr-16">{group.name}</h3>
      <p className="text-xs text-slate-500 mb-3">
        {serverCount} server{serverCount !== 1 ? "s" : ""}
      </p>

      {/* Server chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {group.serverNames.map((name) => {
          const isStale = staleNames.includes(name);
          return (
            <span
              key={name}
              className={`text-xs px-2 py-0.5 rounded-md ${
                isStale
                  ? "bg-slate-700/40 text-slate-600 line-through"
                  : "bg-slate-700/60 text-slate-300"
              }`}
            >
              {name}
            </span>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onActivate}
          disabled={isActive}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            isActive
              ? "text-slate-600 border border-slate-700/50 cursor-not-allowed"
              : "text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10"
          }`}
        >
          <Play className="w-3 h-3" />
          Activate
        </button>
        <button
          onClick={onEdit}
          disabled={isActive}
          className={`p-1.5 rounded-lg border transition-colors ${
            isActive
              ? "text-slate-600 border-slate-700/50 cursor-not-allowed"
              : "text-slate-400 border-slate-700 hover:text-emerald-400 hover:border-emerald-500/30"
          }`}
          title="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onDelete}
          disabled={isActive}
          className={`p-1.5 rounded-lg border transition-colors ${
            isActive
              ? "text-slate-600 border-slate-700/50 cursor-not-allowed"
              : "text-slate-400 border-slate-700 hover:text-red-400 hover:border-red-500/30"
          }`}
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
