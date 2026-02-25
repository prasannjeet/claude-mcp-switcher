import React from "react";
import { AlertTriangle } from "lucide-react";

const TOOL_LIMIT = 80;

function getBarColor(ratio) {
  if (ratio > 1) return "bg-red-500";
  if (ratio > 0.8) return "bg-amber-500";
  if (ratio > 0.5) return "bg-emerald-500";
  return "bg-blue-500";
}

function getBarGlow(ratio) {
  if (ratio > 1) return "shadow-red-500/30";
  if (ratio > 0.8) return "shadow-amber-500/30";
  return "";
}

export default function ToolsGauge({ totalTools, testedCount, totalServers }) {
  const ratio = totalTools / TOOL_LIMIT;
  const pct = Math.min(ratio * 100, 100);
  const barColor = getBarColor(ratio);
  const glow = getBarGlow(ratio);

  const showWarning = ratio > 0.8;
  const overLimit = ratio > 1;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-slate-400">
          <span
            className={`font-semibold ${
              overLimit
                ? "text-red-400"
                : showWarning
                ? "text-amber-400"
                : "text-slate-200"
            }`}
          >
            {totalTools}
          </span>
          {" / "}
          {TOOL_LIMIT} tools
        </span>
        <span className="text-xs text-slate-500">
          ({testedCount}/{totalServers} servers tested)
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${barColor} ${glow} ${
            glow ? "shadow-lg" : ""
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Warning text */}
      {showWarning && (
        <div className="flex items-center gap-1.5 mt-1.5">
          <AlertTriangle
            className={`w-3 h-3 ${overLimit ? "text-red-400" : "text-amber-400"}`}
          />
          <span
            className={`text-xs ${overLimit ? "text-red-400" : "text-amber-400"}`}
          >
            {overLimit
              ? `Over the ${TOOL_LIMIT}-tool limit — Claude may not see all tools`
              : `Approaching the ${TOOL_LIMIT}-tool limit`}
          </span>
        </div>
      )}
    </div>
  );
}
