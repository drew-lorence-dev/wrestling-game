import { createClient } from '@supabase/supabase-js'
import { scrapeRoster } from '../src/lib/scraper/roster'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function run() {
  console.log('Scraping AEW roster...')
  const scraped = await scrapeRoster()

  if (scraped.length === 0) {
    console.error('No wrestlers found — page structure may have changed.')
    process.exit(1)
  }

  console.log(`Found ${scraped.length} wrestlers (${scraped.filter(w => w.gender === 'male').length} men, ${scraped.filter(w => w.gender === 'female').length} women)`)

  const { error: upsertError } = await supabase
    .from('wrestlers')
    .upsert(
      scraped.map(w => ({
        name: w.name,
        slug: w.slug,
        image_url: w.image_url,
        gender: w.gender,
        is_active: true,
        is_custom: false,
      })),
      { onConflict: 'slug' }
    )

  if (upsertError) {
    console.error('Upsert failed:', upsertError.message)
    process.exit(1)
  }

  // Deactivate wrestlers no longer on the page
  const activeSlugs = scraped.map(w => w.slug)
  const { data: deactivated } = await supabase
    .from('wrestlers')
    .update({ is_active: false })
    .eq('is_custom', false)
    .not('slug', 'in', `(${activeSlugs.map(s => `"${s}"`).join(',')})`)
    .select('name')

  console.log(`Synced ${scraped.length} wrestlers.`)
  if (deactivated && deactivated.length > 0) {
    console.log(`Marked inactive (no longer on AEW roster): ${deactivated.map(w => w.name).join(', ')}`)
  }
}

run()
