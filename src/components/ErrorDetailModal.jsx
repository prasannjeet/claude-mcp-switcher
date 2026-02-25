import React from "react";
import { X, AlertCircle } from "lucide-react";

export default function ErrorDetailModal({ serverName, error, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-slate-100">
              Test Failed — {serverName}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error content */}
        <div className="px-5 py-4">
          <pre className="text-xs text-red-300 bg-red-950/40 border border-red-500/20 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
            {error}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex justify-end px-5 py-4 border-t border-slate-700">
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
