import { CheckIcon } from 'lucide-react';
import { ReactNode } from 'react';

import { cn } from '@/lib/utils';

function Feature({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): React.JSX.Element {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <CheckIcon className="size-4 stroke-accent bg-accent/25 rounded-full p-0.5" />
      <span>{children}</span>
    </div>
  );
}

export default Feature;
