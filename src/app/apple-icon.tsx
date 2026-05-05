import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0d0d',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 36,
        }}
      >
        <div
          style={{
            color: '#c9a84c',
            fontWeight: 900,
            fontSize: 68,
            letterSpacing: '0.05em',
            fontFamily: 'sans-serif',
            lineHeight: 1,
          }}
        >
          AEW
        </div>
        <div
          style={{
            color: '#ffffff',
            fontSize: 24,
            letterSpacing: '0.22em',
            fontFamily: 'sans-serif',
            marginTop: 6,
            opacity: 0.85,
          }}
        >
          FANTASY
        </div>
      </div>
    ),
    { ...size }
  )
}
