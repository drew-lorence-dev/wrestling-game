import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) ?? []

  if (ids.length === 0) return Response.json([])

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data } = await supabase
    .from('wrestlers')
    .select('id, name, image_url')
    .in('id', ids)

  return Response.json(data ?? [])
}
