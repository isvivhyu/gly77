/**
 * Server-side Supabase client
 * This uses the service role key and should NEVER be exposed to the client
 * Only use this in:
 * - API routes (app/api/*)
 * - Server Components
 * - Server Actions
 * - Middleware
 */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing Supabase environment variables for server-side operations. " +
      "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set.",
  );
}

// Create server-side Supabase client with service role key
// This bypasses Row Level Security (RLS) - use with caution!
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
