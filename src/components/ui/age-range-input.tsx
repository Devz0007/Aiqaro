import React from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

// Add specific mobile styles
const ageRangeInputStyles = `
@media (max-width: 640px) {
  .age-input-container {
    gap: 0.25rem !important;
  }

  .age-input {
    padding: 0.25rem 0.5rem !important;
    font-size: 0.75rem !important;
    height: auto !important;
    min-height: 2rem !important;
  }
  
  .age-input-separator {
    font-size: 0.75rem !important;
    padding: 0 0.25rem !important;
  }
}
`;

// Add minimal mobile styling
const mobileStyles = `
@media (max-width: 480px) {
  /* Compact age input for mobile */
  .age-container {
    gap: 0.2rem !important;
  }
  
  .age-input {
    font-size: 0.75rem !important;
    padding: 0.2rem 0.5rem !important;
  }
  
  .age-separator {
    font-size: 0.75rem !important;
    padding: 0 0.2rem !important;
  }
}`;

export interface AgeRangeInputProps {
  minValue: string;
  maxValue: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  className?: string;
  minError?: boolean;
  maxError?: boolean;
}

export function AgeRangeInput({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  className,
  minError,
  maxError,
}: AgeRangeInputProps): React.JSX.Element {
  // Add the styles to the DOM once
  React.useEffect(() => {
    const id = 'age-range-input-styles';
    if (!document.getElementById(id)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = id;
      styleSheet.innerHTML = ageRangeInputStyles;
      document.head.appendChild(styleSheet);
    }
    
    // Clean up on unmount
    return () => {
      const styleSheet = document.getElementById(id);
      if (styleSheet) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  // Add mobile styles on component mount
  React.useEffect(() => {
    const styleId = 'age-range-mobile-styles';
    if (!document.getElementById(styleId)) {
      const styleSheet = document.createElement('style');
      styleSheet.id = styleId;
      styleSheet.innerHTML = mobileStyles;
      document.head.appendChild(styleSheet);
    }
    
    return () => {
      const styleSheet = document.getElementById(styleId);
      if (styleSheet) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMinChange(e.target.value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onMaxChange(e.target.value);
  };

  const handleMinBlur = () => {
    // Handle min blur
  };

  const handleMaxBlur = () => {
    // Handle max blur
  };

  return (
    <div
      className={cn(
        "flex items-center space-x-2 age-container",
        className
      )}
    >
      <Input
        type="text"
        inputMode="numeric"
        placeholder={minPlaceholder}
        value={minValue}
        onChange={handleMinChange}
        onBlur={handleMinBlur}
        onFocus={(e) => e.target.select()}
        className={cn("w-20 p-2 age-input", minError ? "border-red-400" : "")}
      />
      <span className="text-sm text-muted-foreground age-separator">to</span>
      <Input
        type="text"
        inputMode="numeric"
        placeholder={maxPlaceholder}
        value={maxValue}
        onChange={handleMaxChange}
        onBlur={handleMaxBlur}
        onFocus={(e) => e.target.select()}
        className={cn("w-20 p-2 age-input", maxError ? "border-red-400" : "")}
      />
    </div>
  );
} 