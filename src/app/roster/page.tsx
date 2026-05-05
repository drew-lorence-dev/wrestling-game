import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";
import RosterClient from "./RosterClient";

async function getWrestlers() {
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data } = await supabase
    .from("wrestlers")
    .select("*")
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export default async function RosterPage() {
  const wrestlers = await getWrestlers();
  return <RosterClient wrestlers={wrestlers} />;
}
