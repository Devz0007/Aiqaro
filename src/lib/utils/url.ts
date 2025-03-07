// src/lib/utils/url.ts
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '';
  }

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl !== undefined && vercelUrl !== null && vercelUrl !== '') {
    return `https://${vercelUrl}`;
  }

  const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (
    configuredBaseUrl !== undefined &&
    configuredBaseUrl !== null &&
    configuredBaseUrl !== ''
  ) {
    return configuredBaseUrl;
  }

  return 'http://localhost:3000';
}
