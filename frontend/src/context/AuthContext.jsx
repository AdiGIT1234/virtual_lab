import { useEffect, useMemo, useState, useCallback } from "react";
import { AuthContext } from "./AuthContextBase";
import { supabase } from "../lib/supabase";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

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
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.id);
      } else {
        setProfile(null);
      }
      if (event === "PASSWORD_RECOVERY") {
        setNeedsPasswordReset(true);
      }
      if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        setNeedsPasswordReset(false);
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
    setNeedsPasswordReset(false);
  }, []);

  /* ── Password Reset Flow ── */
  const resetPassword = useCallback(async (email) => {
    const baseFromEnv = (import.meta.env.VITE_APP_URL || "").trim();
    const hasWindow = typeof window !== "undefined";
    const fallbackBase = hasWindow ? window.location.origin : "https://virtual-lab-zeta-six.vercel.app";
    const isLocalhost = hasWindow && window.location.hostname === "localhost";
    const normalizedBase = (isLocalhost ? fallbackBase : baseFromEnv || fallbackBase).replace(/\/$/, "");
    const redirectTo = `${normalizedBase}/`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw error;
  }, []);

  const updatePassword = useCallback(async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    setNeedsPasswordReset(false);
    return data;
  }, []);

  const clearPasswordRecovery = useCallback(() => {
    setNeedsPasswordReset(false);
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
            updated_at: new Date().toISOString(),
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

  /* ── Save quiz attempt + update saved_experiments scores ── */
  const saveQuizAttempt = useCallback(
    async ({ experimentId, quizType, answers, score, total }) => {
      if (!user) return; // guests can still take quizzes, just not persist

      // Insert attempt row
      await supabase.from("quiz_attempts").insert({
        user_id: user.id,
        experiment_id: experimentId,
        quiz_type: quizType,
        answers,
        score,
        total,
      });

      // Update score columns on saved_experiments so the dashboard query is cheap
      const scoreField = quizType === "pretest" ? "pretest_score" : "posttest_score";
      await supabase
        .from("saved_experiments")
        .upsert(
          {
            user_id: user.id,
            experiment_id: experimentId,
            title: experimentId,
            [scoreField]: score,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,experiment_id" }
        );
    },
    [user]
  );

  /* ── Mark experiment completed + save final tab ── */
  const markExperimentComplete = useCallback(
    async ({ experimentId, title, pretestScore, posttestScore, timeSpentMs }) => {
      if (!user) return;
      await supabase
        .from("saved_experiments")
        .upsert(
          {
            user_id: user.id,
            experiment_id: experimentId,
            title,
            completed: true,
            pretest_score: pretestScore ?? null,
            posttest_score: posttestScore ?? null,
            time_spent_ms: timeSpentMs ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,experiment_id" }
        );
    },
    [user]
  );

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

  /* ── Get quiz attempt history for the current user ── */
  const getQuizHistory = useCallback(async () => {
    if (!user) return [];
    const { data, error } = await supabase
      .from("quiz_attempts")
      .select("id,experiment_id,quiz_type,score,total,passed,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return [];
    return data || [];
  }, [user]);

  /* ── Context value ── */
  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.email === "aditya26047@gmail.com",
      // Auth actions
      signup,
      login,
      loginWithGoogle,
      logout,
      resetPassword,
      updatePassword,
      needsPasswordReset,
      clearPasswordRecovery,
      // Profile actions
      updateProfile,
      fetchProfile: user ? () => fetchProfile(user.id) : () => {},
      // Experiment actions
      saveExperiment,
      getSavedExperiments,
      deleteSavedExperiment,
      saveQuizAttempt,
      markExperimentComplete,
      getQuizHistory,
    }),
    [
      user,
      profile,
      loading,
      signup,
      login,
      loginWithGoogle,
      logout,
      resetPassword,
      updatePassword,
      needsPasswordReset,
      clearPasswordRecovery,
      updateProfile,
      fetchProfile,
      saveExperiment,
      getSavedExperiments,
      deleteSavedExperiment,
      saveQuizAttempt,
      markExperimentComplete,
      getQuizHistory,
    ]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}
