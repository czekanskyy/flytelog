import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'flyteLog — Electronic Flight Bag',
    short_name: 'flyteLog',
    description: 'EASA-compliant digital logbook, VFR route planner, and flight management tool for General Aviation pilots.',
    start_url: '/',
    display: 'standalone',
    background_color: '#18181b',
    theme_color: '#18181b',
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
      {
        src: '/icon-192x192.png',
        type: 'image/png',
        sizes: '192x192',
      },
      {
        src: '/icon-512x512.png',
        type: 'image/png',
        sizes: '512x512',
      },
    ],
  };
}
