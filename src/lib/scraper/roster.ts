import puppeteer from 'puppeteer'

export interface ScrapedWrestler {
  name: string
  slug: string
  image_url: string | null
  gender: 'male' | 'female'
}

const AEW_ROSTER_URL = 'https://www.allelitewrestling.com/aew-roster'

// Known non-wrestler alt texts to skip
const SKIP_ALTS = new Set([
  'AEW LOGO', 'AEW Logo', 'ALT', 'X   ', 'BE',
  'White Facebook Icon', 'White Instagram Icon', 'White YouTube Icon',
  'TikTok  ', 'Spinner: White decorative',
])

// Skip alts that are clearly not individual wrestlers
function isWrestlerName(alt: string): boolean {
  if (!alt || alt.length < 2) return false
  if (SKIP_ALTS.has(alt)) return false
  // Skip descriptive phrases (contain lowercase words after stripping)
  if (/[a-z]/.test(alt)) return false
  // Skip alts that are clearly faction/team names
  const upper = alt.toUpperCase()
  if (upper === 'FTR') return true // FTR are counted as a tag team entry, but useful to have
  // Skip obvious group names (The X, contains "GANG", "FAMILY", "KINGDOM", etc.)
  if (/\b(GANG|FAMILY|KINGDOM|CONGLOMERATION|DOMINION|ORDER|DYNASTY|FACTION)\b/.test(upper)) return false
  return true
}

function toTitleCase(str: string): string {
  const minorWords = new Set(['del', 'de', 'el', 'la', 'los', 'the', 'of', 'and', 'a', 'an'])
  return str
    .toLowerCase()
    .split(' ')
    .map((word, i) => (i === 0 || !minorWords.has(word))
      ? word.charAt(0).toUpperCase() + word.slice(1)
      : word
    )
    .join(' ')
}

export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function cleanImageUrl(src: string): string | null {
  if (!src?.includes('wixstatic.com')) return null
  const match = src.match(/(https:\/\/static\.wixstatic\.com\/media\/[^/]+~mv2\.[a-z]+)/)
  return match ? match[1] : null
}

export async function scrapeRoster(): Promise<ScrapedWrestler[]> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const page = await browser.newPage()
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    await page.goto(AEW_ROSTER_URL, { waitUntil: 'networkidle2', timeout: 60000 })
    await new Promise(r => setTimeout(r, 2000))

    // Get the full rendered HTML and parse positions in Node (not browser)
    const html = await page.content()

    // Find section boundary positions in the raw HTML string
    const mensIdx = html.indexOf('MENS ROSTER')
    const womensIdx = html.indexOf('WOMENS ROSTER')

    // Find the end of the WOMENS ROSTER section by locating the next h1 heading after it
    // This prevents broadcast team / non-wrestler sections from being included
    const afterWomens = womensIdx !== -1 ? html.slice(womensIdx + 'WOMENS ROSTER'.length) : ''
    const nextH1Match = afterWomens.match(/<h1[\s>]/)
    const womensEndIdx = nextH1Match?.index !== undefined
      ? womensIdx + 'WOMENS ROSTER'.length + nextH1Match.index
      : html.length

    // Extract all img tags with their positions and alt text
    const imgRegex = /<img[^>]+alt="([^"]+)"[^>]*src="([^"]+)"/g
    const imgSrcFirstRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]+)"/g

    const entries: Array<{ alt: string; src: string; pos: number }> = []

    let m: RegExpExecArray | null
    // alt before src
    while ((m = imgRegex.exec(html)) !== null) {
      entries.push({ alt: m[1], src: m[2], pos: m.index })
    }
    // src before alt
    while ((m = imgSrcFirstRegex.exec(html)) !== null) {
      entries.push({ alt: m[2], src: m[1], pos: m.index })
    }

    // Deduplicate by position
    const byPos = new Map<number, { alt: string; src: string }>()
    for (const e of entries) byPos.set(e.pos, { alt: e.alt, src: e.src })

    const seen = new Set<string>()
    const scraped: ScrapedWrestler[] = []

    for (const [pos, { alt, src }] of [...byPos.entries()].sort((a, b) => a[0] - b[0])) {
      if (!isWrestlerName(alt)) continue

      // Only include wrestlers within the MENS ROSTER and WOMENS ROSTER sections
      if (mensIdx !== -1 && pos < mensIdx) continue        // before MENS ROSTER (champions section)
      if (pos >= womensEndIdx) continue                    // after WOMENS ROSTER section ends

      let gender: 'male' | 'female' = 'male'
      if (womensIdx !== -1 && pos > womensIdx) gender = 'female'

      const name = toTitleCase(alt)
      const slug = toSlug(name)
      if (seen.has(slug)) continue
      seen.add(slug)

      scraped.push({
        name,
        slug,
        image_url: cleanImageUrl(src),
        gender,
      })
    }

    return scraped
  } finally {
    await browser.close()
  }
}
