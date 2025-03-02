import { Loader2 } from 'lucide-react';
import React from 'react';

const Loader = (): React.JSX.Element => {
  return <Loader2 className="w-6 h-6 animate-spin text-gray-500" />;
};

export default Loader;
