import React from "react";
import { cn } from "@/lib/utils";

interface AgeRangeInputProps {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  className?: string;
}

export function AgeRangeInput({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = "Min",
  maxPlaceholder = "Max",
  className,
}: AgeRangeInputProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        type="text"
        value={minValue}
        onChange={(e) => onMinChange(e.target.value)}
        placeholder={minPlaceholder}
        className="w-full h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors hover:border-primary/50"
      />
      <div className="flex items-center justify-center text-xs text-muted-foreground font-medium px-1">
        to
      </div>
      <input
        inputMode="numeric"
        pattern="[0-9]*"
        type="text"
        value={maxValue}
        onChange={(e) => onMaxChange(e.target.value)}
        placeholder={maxPlaceholder}
        className="w-full h-9 rounded-md border border-input bg-transparent px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-colors hover:border-primary/50"
      />
    </div>
  );
} 