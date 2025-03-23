import { Loader2 } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

interface LoaderProps {
  className?: string;
}

const Loader = ({ className }: LoaderProps): React.JSX.Element => {
  return <Loader2 className={cn("w-6 h-6 animate-spin text-gray-500", className)} />;
};

export default Loader;
