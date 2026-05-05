import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export function GET(req: NextRequest) {
  const size = Number(req.nextUrl.searchParams.get('size')) || 192

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
          borderRadius: size * 0.18,
        }}
      >
        <div
          style={{
            color: '#c9a84c',
            fontWeight: 900,
            fontSize: size * 0.38,
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
            fontSize: size * 0.14,
            letterSpacing: '0.22em',
            fontFamily: 'sans-serif',
            marginTop: size * 0.04,
            opacity: 0.85,
          }}
        >
          FANTASY
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
