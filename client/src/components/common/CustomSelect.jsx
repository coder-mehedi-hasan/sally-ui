import React from "react";

export default function CustomSelect({ value, onChange, children, className = "", ...props }) {
  return (
    <div className={`relative inline-block w-auto ${className}`}>
      <select
        value={value}
        onChange={onChange}
        {...props}
        className={`
          w-full appearance-none rounded px-4 py-1.5 pr-10
          border border-[var(--border)]
          bg-[var(--primary)]
          text-[var(--fg)]
          text-sm font-medium
          focus:outline-none focus:ring-2 focus:ring-[var(--panel)]
          transition-colors
        `}
      >
        {children}
      </select>

      {/* Custom dropdown arrow */}
      <div
        className="
          pointer-events-none absolute inset-y-0 right-3 flex items-center
        "
      >
        <svg
          className="w-4 h-4 text-[var(--fg)]"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5.25 7.5l4.75 4.75 4.75-4.75" />
        </svg>
      </div>
    </div>
  );
}
