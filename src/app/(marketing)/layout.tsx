import { ReactNode } from 'react';

import { NavBar } from './_components/navbar';

export default function MarketingLayout({
  children,
}: {
  children: ReactNode;
}): React.JSX.Element {
  return (
    <div className="selection:bg-[hsl(320,65%,52%,20%)]">
      <NavBar />
      {children}
    </div>
  );
}
