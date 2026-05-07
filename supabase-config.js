export const supabaseConfig = {
  url: import.meta.env.VITE_SUPABASE_URL || "PASTE_YOUR_SUPABASE_PROJECT_URL",
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "PASTE_YOUR_SUPABASE_ANON_KEY",
  storageBucket: import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || "app-images",
};

export function isSupabaseConfigured() {
  return Object.values(supabaseConfig).every(
    (value) => value && !value.startsWith("PASTE_YOUR_")
  );
}
