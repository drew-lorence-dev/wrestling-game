// Scoring rules — TV base points, PPV multiplied by show.scoring_multiplier

export const SCORING_RULES = {
  win: 10,
  loss: 2,
  draw: 5,
  title_win_bonus: 15,      // added on top of win
  title_defense_bonus: 8,   // added on top of win
  title_match_loss_bonus: 5,// added on top of loss
  submission_bonus: 3,      // added when win method is submission
  // match_10min_bonus: 3   — requires duration data, not yet available
  // match_20min_bonus: 6   — requires duration data, not yet available
  // promo_bonus: 3         — requires segment data, not yet available
}

export interface ScoringAction {
  action: string
  points: number
}

export interface WrestlerScoreBreakdown {
  wrestlerId: string
  wrestlerName: string
  showName: string
  totalPoints: number
  actions: ScoringAction[]
}

interface MatchParticipantRow {
  wrestler_id: string
  outcome: string
  win_method: string | null
  is_title_change: boolean
  matches: {
    title_match: boolean
    shows: {
      name: string
      scoring_multiplier: number
    }
  }
}

export function calculateWrestlerPoints(
  participants: MatchParticipantRow[],
  multiplier: number = 1
): ScoringAction[] {
  const actions: ScoringAction[] = []

  for (const p of participants) {
    const m = p.matches
    const isWin = p.outcome === 'win'
    const isLoss = p.outcome === 'loss'
    const isDraw = p.outcome === 'draw'
    const isTitle = m.title_match

    if (isWin) {
      actions.push({ action: 'Win', points: SCORING_RULES.win * multiplier })

      if (isTitle) {
        if (p.is_title_change) {
          actions.push({ action: 'Title Win', points: SCORING_RULES.title_win_bonus * multiplier })
        } else {
          actions.push({ action: 'Title Defense', points: SCORING_RULES.title_defense_bonus * multiplier })
        }
      }

      if (p.win_method === 'submission') {
        actions.push({ action: 'Submission Win', points: SCORING_RULES.submission_bonus * multiplier })
      }
    } else if (isLoss) {
      actions.push({ action: 'Loss', points: SCORING_RULES.loss * multiplier })

      if (isTitle) {
        actions.push({ action: 'Title Match Appearance', points: SCORING_RULES.title_match_loss_bonus * multiplier })
      }
    } else if (isDraw) {
      actions.push({ action: 'Draw', points: SCORING_RULES.draw * multiplier })
    }
  }

  return actions
}

export function sumActions(actions: ScoringAction[]): number {
  return actions.reduce((sum, a) => sum + a.points, 0)
}
