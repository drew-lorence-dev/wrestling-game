import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AEW Fantasy',
    short_name: 'AEW Fantasy',
    description: 'Fantasy wrestling game built around All Elite Wrestling',
    start_url: '/beta',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0d0d0d',
    theme_color: '#0d0d0d',
    icons: [
      { src: '/api/pwa-icon?size=192', sizes: '192x192', type: 'image/png' },
      { src: '/api/pwa-icon?size=512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
