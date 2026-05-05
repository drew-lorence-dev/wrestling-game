export interface ParsedMatch {
  matchOrder: number
  isTitleMatch: boolean
  titleName: string | null
  isTitleChange: boolean
  matchType: 'singles' | 'tag' | 'trios' | 'multi'
  winners: string[]
  losers: string[]
  winMethod: string
}

const TITLE_KEYWORDS = [
  'AEW World Championship',
  'AEW TNT Championship',
  'AEW International Championship',
  'AEW Continental Championship',
  'AEW National Championship',
  'AEW Women\'s World Championship',
  'AEW TBS Championship',
  'AEW World Tag Team Championship',
  'AEW Women\'s World Tag Team Championship',
  'AEW World Trios Championship',
  'Ring of Honor World Championship',
  'ROH World Championship',
  'ROH Women\'s World Championship',
  'ROH World Tag Team Championship',
  'ROH World Six-Man Tag Team Championship',
]

const WIN_METHODS: Record<string, string> = {
  'pinfall': 'pinfall',
  'pin': 'pinfall',
  'submission': 'submission',
  'tapout': 'submission',
  'tap out': 'submission',
  'disqualification': 'dq',
  'dq': 'dq',
  'count out': 'countout',
  'countout': 'countout',
  "referee's stoppage": 'referee_stoppage',
  'referee stoppage': 'referee_stoppage',
  'stoppage': 'referee_stoppage',
  'knockout': 'ko',
  'ko': 'ko',
}

function cleanName(name: string): string {
  return name
    .replace(/\(c\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Extract individual names from a participant string
// Handles: "Name", "Name1 & Name2", "Team Name (Name1 & Name2)"
function extractNames(str: string): string[] {
  const cleaned = str.replace(/\(c\)/gi, '').trim()

  // Check for team name with members in parens: "Team Name (Name1 & Name2)"
  const parenMatch = cleaned.match(/^[^(]+\(([^)]+)\)\s*$/)
  if (parenMatch) {
    return parenMatch[1].split(/\s*&\s*/).map(n => n.trim()).filter(Boolean)
  }

  // Simple & list: "Name1 & Name2"
  if (cleaned.includes(' & ')) {
    return cleaned.split(/\s*&\s*/).map(n => n.trim()).filter(Boolean)
  }

  return [cleaned].filter(Boolean)
}

function parseWinMethod(text: string): { method: string; cleanedText: string } {
  const viaMatch = text.match(/\s+via\s+(.+?)(?:\s+to\s+|$)/i)
  if (viaMatch) {
    const rawMethod = viaMatch[1].toLowerCase().trim()
    const method = WIN_METHODS[rawMethod] ?? rawMethod.replace(/\s+/g, '_')
    const cleanedText = text.replace(viaMatch[0], ' ').trim()
    return { method, cleanedText }
  }
  return { method: 'pinfall', cleanedText: text }
}

export function parseMatchResult(line: string, matchOrder: number): ParsedMatch | null {
  const text = line.trim()
  if (!text) return null

  // Detect title match
  let isTitleMatch = false
  let titleName: string | null = null
  let workingText = text

  for (const title of TITLE_KEYWORDS) {
    if (text.startsWith(title + ':')) {
      isTitleMatch = true
      titleName = title
      workingText = text.slice(title.length + 1).trim()
      break
    }
  }

  // Detect title change
  const isTitleChange = /\bto win the title\b/i.test(workingText)
  const isRetain = /\bto retain the title\b/i.test(workingText)

  // Remove outcome phrases
  workingText = workingText
    .replace(/\s+to (win|retain) the titles?/gi, '')
    .trim()

  // Parse win method
  const { method: winMethod, cleanedText } = parseWinMethod(workingText)
  workingText = cleanedText

  // Split on "defeats" (singular) or "defeat" (plural)
  // Use word boundary to avoid matching inside words
  const splitMatch = workingText.match(/^(.+?)\s+defeat(?:s)?\s+(.+)$/)
  if (!splitMatch) return null

  const [, leftRaw, rightRaw] = splitMatch

  const winners = extractNames(leftRaw)
  const losers = extractNames(rightRaw)

  if (winners.length === 0 || losers.length === 0) return null

  const totalWrestlers = winners.length + losers.length
  let matchType: ParsedMatch['matchType'] = 'singles'
  if (winners.length === 3 || losers.length === 3) matchType = 'trios'
  else if (winners.length === 2 || losers.length === 2) matchType = 'tag'
  else if (totalWrestlers > 4) matchType = 'multi'

  return {
    matchOrder,
    isTitleMatch,
    titleName,
    isTitleChange,
    matchType,
    winners: winners.map(cleanName),
    losers: losers.map(cleanName),
    winMethod,
  }
}

export interface ParsedEpisode {
  episodeNumber: number | null
  date: string // YYYY-MM-DD
  matches: ParsedMatch[]
}

// Parse episode heading like "AEW Dynamite #342: April 29, 2026"
function parseEpisodeHeading(heading: string): { number: number | null; date: string } | null {
  const numMatch = heading.match(/#(\d+)/)
  const dateMatch = heading.match(/(\w+ \d+,\s*\d{4})/)

  if (!dateMatch) return null

  const date = new Date(dateMatch[1])
  if (isNaN(date.getTime())) return null

  return {
    number: numMatch ? parseInt(numMatch[1]) : null,
    date: date.toISOString().split('T')[0],
  }
}

export function parseYearPage(html: string): ParsedEpisode[] {
  const episodes: ParsedEpisode[] = []
  const cheerio = require('cheerio')
  const $ = cheerio.load(html)

  $('h3').each((_: number, el: unknown) => {
    const heading = $(el as Parameters<typeof $>[0]).text().trim()
    const parsed = parseEpisodeHeading(heading)
    if (!parsed) return

    const matches: ParsedMatch[] = []
    let matchOrder = 1

    // Collect all li elements until the next h3
    const $el = $(el as Parameters<typeof $>[0])
    let next = $el.next()
    while (next.length && !next.is('h3')) {
      if (next.is('ul')) {
        next.find('li').each((_: number, li: unknown) => {
          const text = $(li as Parameters<typeof $>[0]).text().trim()
          const match = parseMatchResult(text, matchOrder)
          if (match) {
            matches.push(match)
            matchOrder++
          }
        })
      }
      next = next.next()
    }

    if (matches.length > 0) {
      episodes.push({
        episodeNumber: parsed.number,
        date: parsed.date,
        matches,
      })
    }
  })

  return episodes
}
