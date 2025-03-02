import React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface InputWithIconProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export function InputWithIcon({
  icon,
  className,
  ...props
}: InputWithIconProps): React.JSX.Element {
  return (
    <div className="relative">
      {icon !== undefined && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </div>
      )}
      <Input
        className={cn('w-full', icon !== undefined ? 'pl-10' : '', className)}
        {...props}
      />
    </div>
  );
}
