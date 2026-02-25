import React, { useEffect, useState } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(onClose, 300);
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border z-50 ${
        exiting ? "toast-exit" : "toast-enter"
      } ${
        type === "success"
          ? "bg-emerald-900/90 border-emerald-700 text-emerald-100"
          : "bg-red-900/90 border-red-700 text-red-100"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400 shrink-0" />
      )}
      <span className="text-sm">{message}</span>
      <button onClick={() => { setExiting(true); setTimeout(onClose, 300); }} className="ml-2 text-slate-400 hover:text-white">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
