import * as React from "react";

export function Switch({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className = "",
  ...props
}) {
  const [internalChecked, setInternalChecked] = React.useState(defaultChecked);

  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  function toggle() {
    if (disabled) return;

    const next = !isChecked;

    if (!isControlled) {
      setInternalChecked(next);
    }

    if (onCheckedChange) {
      onCheckedChange(next);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isChecked}
      disabled={disabled}
      onClick={toggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full border-2 border-transparent transition-colors
        ${isChecked ? "bg-blue-500" : "bg-slate-700"}
        ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background
        ${className}`}
      {...props}
    >
      <span
        className={`pointer-events-none absolute left-0 top-0 h-5 w-5 translate-x-0 rounded-full bg-slate-900 shadow-lg transition-transform
          ${isChecked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
