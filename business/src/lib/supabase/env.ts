export function supabaseConfigurato() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function leggiSupabasePubblico() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chiave = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !chiave) {
    throw new Error("Mancano NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }
  return { url, chiave };
}
