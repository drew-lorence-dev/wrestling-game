import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

const wrestlers: { name: string; gender: 'male' | 'female' }[] = [
  // ── Men ──────────────────────────────────────────────────────
  { name: 'Jon Moxley', gender: 'male' },
  { name: 'Bryan Danielson', gender: 'male' },
  { name: 'MJF', gender: 'male' },
  { name: 'Chris Jericho', gender: 'male' },
  { name: 'Kenny Omega', gender: 'male' },
  { name: 'Samoa Joe', gender: 'male' },
  { name: 'Jay White', gender: 'male' },
  { name: 'Adam Page', gender: 'male' },
  { name: 'Darby Allin', gender: 'male' },
  { name: 'Orange Cassidy', gender: 'male' },
  { name: 'Claudio Castagnoli', gender: 'male' },
  { name: 'Wheeler Yuta', gender: 'male' },
  { name: 'Konosuke Takeshita', gender: 'male' },
  { name: 'Will Ospreay', gender: 'male' },
  { name: 'Jack Perry', gender: 'male' },
  { name: 'HOOK', gender: 'male' },
  { name: 'Swerve Strickland', gender: 'male' },
  { name: 'Powerhouse Hobbs', gender: 'male' },
  { name: 'Wardlow', gender: 'male' },
  { name: 'Malakai Black', gender: 'male' },
  { name: 'Brody King', gender: 'male' },
  { name: 'Buddy Matthews', gender: 'male' },
  { name: 'Penta El Zero Miedo', gender: 'male' },
  { name: 'Rey Fenix', gender: 'male' },
  { name: 'Dax Harwood', gender: 'male' },
  { name: 'Cash Wheeler', gender: 'male' },
  { name: 'Matt Jackson', gender: 'male' },
  { name: 'Nick Jackson', gender: 'male' },
  { name: 'Christian Cage', gender: 'male' },
  { name: 'Luchasaurus', gender: 'male' },
  { name: 'Nick Wayne', gender: 'male' },
  { name: 'Lance Archer', gender: 'male' },
  { name: 'Ricky Starks', gender: 'male' },
  { name: 'Big Bill', gender: 'male' },
  { name: 'Rush', gender: 'male' },
  { name: 'Preston Vance', gender: 'male' },
  { name: 'Evil Uno', gender: 'male' },
  { name: 'Jay Lethal', gender: 'male' },
  { name: 'Jeff Jarrett', gender: 'male' },
  { name: 'Daniel Garcia', gender: 'male' },
  { name: 'Roderick Strong', gender: 'male' },
  { name: 'Adam Cole', gender: 'male' },
  { name: 'Kyle OReilly', gender: 'male' },
  { name: 'Matt Taven', gender: 'male' },
  { name: 'Mike Bennett', gender: 'male' },
  { name: 'El Hijo del Vikingo', gender: 'male' },
  { name: 'Komander', gender: 'male' },
  { name: 'AR Fox', gender: 'male' },
  { name: 'Dante Martin', gender: 'male' },
  { name: 'Darius Martin', gender: 'male' },
  { name: 'Action Andretti', gender: 'male' },
  { name: 'Kip Sabian', gender: 'male' },
  { name: 'Lio Rush', gender: 'male' },
  { name: 'Bobby Lashley', gender: 'male' },
  { name: 'Samoa Joe', gender: 'male' },
  { name: 'Andrade El Idolo', gender: 'male' },
  { name: 'Minoru Suzuki', gender: 'male' },
  { name: 'Hirooki Goto', gender: 'male' },
  { name: 'YOSHI-HASHI', gender: 'male' },
  { name: 'Tomohiro Ishii', gender: 'male' },
  { name: 'Zack Sabre Jr', gender: 'male' },

  // ── Women ────────────────────────────────────────────────────
  { name: 'Toni Storm', gender: 'female' },
  { name: 'Saraya', gender: 'female' },
  { name: 'Jamie Hayter', gender: 'female' },
  { name: 'Kris Statlander', gender: 'female' },
  { name: 'Willow Nightingale', gender: 'female' },
  { name: 'Thunder Rosa', gender: 'female' },
  { name: 'Hikaru Shida', gender: 'female' },
  { name: 'Britt Baker', gender: 'female' },
  { name: 'Nyla Rose', gender: 'female' },
  { name: 'Anna Jay', gender: 'female' },
  { name: 'Tay Melo', gender: 'female' },
  { name: 'Penelope Ford', gender: 'female' },
  { name: 'Julia Hart', gender: 'female' },
  { name: 'Skye Blue', gender: 'female' },
  { name: 'Mercedes Mone', gender: 'female' },
  { name: 'Mariah May', gender: 'female' },
  { name: 'Harley Cameron', gender: 'female' },
  { name: 'Red Velvet', gender: 'female' },
  { name: 'Lady Frost', gender: 'female' },
  { name: 'Robyn Renegade', gender: 'female' },
  { name: 'Charlette Renegade', gender: 'female' },
]

// Deduplicate by name (safety net)
const unique = Array.from(new Map(wrestlers.map(w => [w.name, w])).values())

const rows = unique.map(w => ({
  name: w.name,
  slug: toSlug(w.name),
  gender: w.gender,
  is_active: true,
  is_custom: false,
}))

async function seed() {
  console.log(`Seeding ${rows.length} wrestlers...`)

  const { data, error } = await supabase
    .from('wrestlers')
    .upsert(rows, { onConflict: 'slug' })
    .select('id, name, gender')

  if (error) {
    console.error('Seed failed:', error.message)
    process.exit(1)
  }

  const men = data?.filter(w => w.gender === 'male').length ?? 0
  const women = data?.filter(w => w.gender === 'female').length ?? 0
  console.log(`Done — ${men} men, ${women} women seeded.`)
}

seed()
