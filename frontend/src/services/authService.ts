import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "./supabase";
import { api } from "./api";
import * as Linking from "expo-linking";
import { useTaskStore } from "../store/useTaskStore";
console.log("SUPABASE_URL:", "123"); // auth service

WebBrowser.maybeCompleteAuthSession();

export const authService = {
  signInWithOAuth: async (provider: "google" | "apple") => {
    try {
      const redirectUri = makeRedirectUri({
        scheme: "frontend",
        path: "auth-callback",
      });
      console.log(`${provider} Login Redirect URI:`, redirectUri);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUri,
        },
      });

      if (error) throw error;
      if (data?.url) {
        useTaskStore.getState().setIsAuthenticating(true);
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          redirectUri,
        );

        if (result.type === "success") {
          const url = result.url;
          // Extract tokens from hash fragment
          const params: Record<string, string> = {};
          const hash = url.split("#")[1];
          if (hash) {
            hash.split("&").forEach((part) => {
              const [key, value] = part.split("=");
              params[key] = value;
            });
          }

          if (params.access_token && params.refresh_token) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: params.access_token,
                refresh_token: params.refresh_token,
              });

            if (sessionError) throw sessionError;
            return sessionData;
          }
        }
      }
    } catch (error) {
      console.error(`${provider} Sign-In Error:`, error);
      throw error;
    }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};
