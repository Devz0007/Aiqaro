import React from "react";
import { cn } from "@/lib/utils";

interface ToggleCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export function ToggleCheckbox({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: ToggleCheckboxProps) {
  return (
    <label className={cn("flex items-center cursor-pointer", className, {
      "opacity-50 cursor-not-allowed": disabled,
    })}>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={cn(
          "block w-8 h-4 rounded-full transition-colors duration-200",
          checked ? "bg-primary" : "bg-gray-300"
        )}></div>
        <div className={cn(
          "absolute left-0.5 top-0.5 bg-white w-3 h-3 rounded-full transition-transform duration-200",
          checked ? "transform translate-x-4" : ""
        )}></div>
      </div>
      {label && (
        <div className="ml-2 text-xs md:text-sm font-medium leading-tight">
          {label}
        </div>
      )}
    </label>
  );
} 