"use client";

import { useDashboard } from "@/lib/DashboardContext";

function getToastClasses(type: "success" | "error" | "info") {
  if (type === "success") return "border-[#d9e7df] bg-[#eef8f2] text-[#205930]";
  if (type === "error") return "border-[#f0b8b8] bg-[#ffe9e9] text-[#812f2f]";
  return "border-[#d5dff0] bg-[#eef3ff] text-[#2d4a7a]";
}

export function ToastContainer() {
  const { toasts, removeToast } = useDashboard();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 max-w-[380px]">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg transition-all duration-300 ${getToastClasses(toast.type)}`}
        >
          <span className="flex-1 text-[13px] font-semibold leading-[1.5]">
            {toast.message}
          </span>
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="mt-0.5 shrink-0 opacity-60 hover:opacity-100 transition-opacity"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
