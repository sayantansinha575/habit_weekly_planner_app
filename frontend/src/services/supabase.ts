import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
// import * as SecureStore from "expo-secure-store";

const supabaseUrl = "https://vzxmrdlkrcjmaiiedxgk.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6eG1yZGxrcmNqbWFpaWVkeGdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODcyMjUsImV4cCI6MjA4NjU2MzIyNX0.EyX78E3lJ8oN6nRaW5qP-5Bl4ZeiNGyhaM4zvf3Cmcc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
