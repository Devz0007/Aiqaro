// src/components/body-gtm.tsx
'use client';
import Script from 'next/script';

interface BodyGTMProps {
  gtmId: string;
}
const BodyGTM = ({ gtmId }: BodyGTMProps) => {
  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  );
};
export default BodyGTM;

