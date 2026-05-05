// NOTE: The automated weekly roster sync runs via GitHub Actions (.github/workflows/sync-roster.yml)
// which uses Puppeteer. This endpoint is a manual trigger stub for future use when a
// non-headless scraping approach is available in serverless environments.

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return Response.json({
    message: 'Roster sync runs via GitHub Actions on a weekly schedule. Trigger the workflow manually from GitHub if needed.',
    workflow: '.github/workflows/sync-roster.yml',
  })
}
