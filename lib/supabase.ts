import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  // Falls back to a placeholder so a missing env var can't crash the build
  // (e.g. static prerendering of unrelated pages) — auth/data calls will
  // just fail at runtime with a clear error instead, until the real
  // NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are set.
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — set these in Vercel → Settings → Environment Variables and redeploy.');
}

export const supabase = createClient(url || 'https://placeholder.supabase.co', anonKey || 'placeholder-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true },
});
