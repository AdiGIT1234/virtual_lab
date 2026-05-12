import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === "your-supabase-url-here") {
  console.warn(
    "⚠️ Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env"
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    auth: {
      // Use localStorage so all tabs share the same token
      storage: window.localStorage,
      // Lock token refresh so only one tab refreshes at a time,
      // preventing the "Already Used" collision across tabs
      lock: async (name, acquireTimeout, fn) => {
        if (typeof navigator !== "undefined" && navigator.locks) {
          const controller = new AbortController();
          const id = setTimeout(() => controller.abort(), acquireTimeout);
          try {
            return await navigator.locks.request(
              name,
              { signal: controller.signal },
              fn
            );
          } catch (e) {
            if (e?.name === "AbortError") return fn();
            throw e;
          } finally {
            clearTimeout(id);
          }
        }
        return fn();
      },
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);
