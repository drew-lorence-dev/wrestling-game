import { createClient } from "@supabase/supabase-js"
import { Database } from "@/types/database"
import DraftClient from "./DraftClient"

async function getWrestlers() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const { data } = await supabase
    .from("wrestlers")
    .select("*")
    .eq("is_active", true)
    .order("name")
  return data ?? []
}

export default async function DraftPage() {
  const wrestlers = await getWrestlers()
  return <DraftClient wrestlers={wrestlers} />
}
