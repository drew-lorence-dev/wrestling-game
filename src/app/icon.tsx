import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0d',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
        }}
      >
        <div
          style={{
            color: '#c9a84c',
            fontWeight: 900,
            fontSize: 12,
            letterSpacing: '0.05em',
            fontFamily: 'sans-serif',
          }}
        >
          AEW
        </div>
      </div>
    ),
    { ...size }
  )
}
