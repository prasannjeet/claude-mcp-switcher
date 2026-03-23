import React from "react";
import { ArrowUpCircle } from "lucide-react";

export default function UpdateBadge({ latestVersion, releaseUrl, onNavigate }) {
  return (
    <button
      onClick={() => onNavigate(releaseUrl)}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full
                 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400
                 hover:bg-emerald-500/20 hover:border-emerald-500/50
                 transition-colors cursor-pointer"
      title={`Version ${latestVersion} is available — click to download`}
    >
      <ArrowUpCircle className="w-3.5 h-3.5" />
      <span>v{latestVersion} available</span>
    </button>
  );
}
