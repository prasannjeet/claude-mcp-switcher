import React from "react";
import { X } from "lucide-react";

export default function ConfirmModal({ title, message, confirmLabel = "Confirm", onConfirm, onCancel, dangerous = false }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="px-5 py-4 text-sm text-slate-300 leading-relaxed">
          {message}
        </div>
        <div className="flex justify-end gap-3 px-5 py-4 border-t border-slate-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors ${
              dangerous
                ? "bg-red-600 hover:bg-red-500"
                : "bg-emerald-600 hover:bg-emerald-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
