import { useEffect, useMemo, useState, useCallback } from "react";
import { AuthContext } from "./AuthContextBase";
import { supabase } from "../lib/supabase";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ── Fetch user profile from profiles table ── */
  const fetchProfile = useCallback(async (userId) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
      }
      setProfile(data || null);
    } catch (err) {
      console.error("Profile fetch failed:", err);
    }
  }, []);

  /* ── Listen for auth state changes ── */
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      }
      setLoading(false);
    });

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  /* ── Sign up with email + password ── */
  const signup = useCallback(async ({ email, password, name, institute }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || "",
          institute: institute || "",
        },
      },
    });

    if (error) throw error;

    // If signup is successful and user is confirmed (no email verification),
    // create their profile row
    if (data.user && !data.user.identities?.length === 0) {
      // User already exists
      throw new Error("An account with this email already exists");
    }

    return data;
  }, []);

  /* ── Sign in with email + password ── */
  const login = useCallback(async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }, []);

  /* ── Sign in with Google OAuth ── */
  const loginWithGoogle = useCallback(async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) throw error;
    return data;
  }, []);

  /* ── Sign out ── */
  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
  }, []);

  /* ── Update profile ── */
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return data;
    },
    [user]
  );

  /* ── Save experiment ── */
  const saveExperiment = useCallback(
    async ({ experimentId, title, code, resultJson }) => {
      if (!user) throw new Error("Login required to save experiments");

      const { data, error } = await supabase
        .from("saved_experiments")
        .upsert(
          {
            user_id: user.id,
            experiment_id: experimentId,
            title,
            code,
            result_json: resultJson || null,
          },
          { onConflict: "user_id,experiment_id" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    [user]
  );

  /* ── Get saved experiments ── */
  const getSavedExperiments = useCallback(async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from("saved_experiments")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }, [user]);

  /* ── Delete saved experiment ── */
  const deleteSavedExperiment = useCallback(
    async (id) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("saved_experiments")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
    },
    [user]
  );

  /* ── Context value ── */
  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: !!user,
      // Auth actions
      signup,
      login,
      loginWithGoogle,
      logout,
      // Profile actions
      updateProfile,
      fetchProfile: user ? () => fetchProfile(user.id) : () => {},
      // Experiment actions
      saveExperiment,
      getSavedExperiments,
      deleteSavedExperiment,
    }),
    [
      user,
      profile,
      loading,
      signup,
      login,
      loginWithGoogle,
      logout,
      updateProfile,
      fetchProfile,
      saveExperiment,
      getSavedExperiments,
      deleteSavedExperiment,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
