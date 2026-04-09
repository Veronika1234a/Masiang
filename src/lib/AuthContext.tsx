"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  signIn as supaSignIn,
  signUp as supaSignUp,
  signOut as supaSignOut,
  changePassword as supaChangePassword,
  resendSignupVerification as supaResendSignupVerification,
  getProfile,
  updateUserMetadata as supaUpdateUserMetadata,
  type SignUpPayload,
} from "./supabase/services/auth";
import {
  fetchAllSchoolProfiles,
  type RegisteredSchoolProfile,
} from "./supabase/services/profiles";
import { createClient } from "./supabase/client";

export type UserRole = "school" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarPath?: string;
}

export interface RegisterInput {
  schoolName: string;
  npsn: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
}

export interface RegisteredSchool extends RegisterInput {
  id: string;
}

interface ProfileSnapshot {
  role?: string | null;
  school_name?: string | null;
  contact_name?: string | null;
  email?: string | null;
  avatar_path?: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  registeredSchools: RegisteredSchool[];
  login(identity: string, password: string): Promise<{ success: boolean; error?: string; redirectTo: string }>;
  register(data: RegisterInput): Promise<{ success: boolean; error?: string }>;
  resendSignupVerification(email: string): Promise<{ success: boolean; error?: string }>;
  changePassword(currentPassword: string, nextPassword: string): Promise<{ success: boolean; error?: string }>;
  updateAvatarPath(nextPath: string): Promise<{ success: boolean; error?: string }>;
  logout(): Promise<void>;
  refreshSchools(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const E2E_USER_STORAGE_KEY = "masiang-e2e-user";
const isE2EMode = process.env.NEXT_PUBLIC_E2E_TEST_MODE === "1";
const HYDRATION_SNAPSHOT_SUBSCRIBE = () => () => {};

function readE2EUserSnapshot(): string | null {
  if (!isE2EMode || typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(E2E_USER_STORAGE_KEY);
}

function writeE2EUser(nextUser: AuthUser | null) {
  if (!isE2EMode || typeof window === "undefined") {
    return;
  }

  if (nextUser) {
    window.localStorage.setItem(E2E_USER_STORAGE_KEY, JSON.stringify(nextUser));
  } else {
    window.localStorage.removeItem(E2E_USER_STORAGE_KEY);
  }

  window.dispatchEvent(new Event(E2E_USER_STORAGE_KEY));
}

function subscribeToE2EUser(onStoreChange: () => void) {
  if (!isE2EMode || typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === E2E_USER_STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleCustom = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(E2E_USER_STORAGE_KEY, handleCustom);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(E2E_USER_STORAGE_KEY, handleCustom);
  };
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

function buildAuthUser(
  user: User,
  profile?: ProfileSnapshot | null,
): AuthUser {
  const metadata = user.user_metadata as {
    role?: string;
    school_name?: string;
    contact_name?: string;
    avatar_path?: string;
  } | undefined;

  const role = (profile?.role ?? metadata?.role ?? "school") as UserRole;
  const name =
    profile?.school_name ??
    profile?.contact_name ??
    metadata?.school_name ??
    metadata?.contact_name ??
    user.email ??
    "User";

  return {
    id: user.id,
    email: user.email ?? profile?.email ?? "",
    name,
    role,
    avatarPath: profile?.avatar_path ?? metadata?.avatar_path,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!isE2EMode);
  const [registeredSchools, setRegisteredSchools] = useState<RegisteredSchool[]>([]);
  const e2eUserSnapshot = useSyncExternalStore(subscribeToE2EUser, readE2EUserSnapshot, () => null);
  const isHydrated = useSyncExternalStore(HYDRATION_SNAPSHOT_SUBSCRIBE, () => true, () => false);
  const e2eUser = useMemo(() => {
    if (!e2eUserSnapshot) {
      return null;
    }

    try {
      return JSON.parse(e2eUserSnapshot) as AuthUser;
    } catch {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(E2E_USER_STORAGE_KEY);
      }
      return null;
    }
  }, [e2eUserSnapshot]);
  const authUser = isE2EMode ? (isHydrated ? e2eUser : null) : user;
  const authLoading = isE2EMode ? !isHydrated : loading;

  const refreshSchools = useCallback(async () => {
    try {
      const schools = await fetchAllSchoolProfiles();
      setRegisteredSchools(
        schools.map(
          (s: RegisteredSchoolProfile): RegisteredSchool => ({
            id: s.id,
            schoolName: s.schoolName,
            npsn: s.npsn,
            contactName: s.contactName,
            email: s.email,
            phone: s.phone,
            address: s.address,
            password: "",
          }),
        ),
      );
    } catch {
      // Admin may not be logged in yet
    }
  }, []);

  const syncUserProfile = useCallback(
    async (nextUser: User) => {
      const profile = await getProfile(nextUser.id);
      const resolvedUser = buildAuthUser(nextUser, profile);
      setUser(resolvedUser);
      writeE2EUser(resolvedUser);

      if (resolvedUser.role === "admin") {
        await refreshSchools();
      } else {
        setRegisteredSchools([]);
      }

      return resolvedUser;
    },
    [refreshSchools],
  );

  useEffect(() => {
    if (isE2EMode) {
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const optimisticUser = buildAuthUser(session.user);
        setUser(optimisticUser);
        setLoading(false);
        void syncUserProfile(session.user).catch(() => {
          if (optimisticUser.role === "admin") {
            void refreshSchools();
          }
        });
        return;
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setRegisteredSchools([]);
        writeE2EUser(null);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        const optimisticUser = buildAuthUser(session.user);
        setUser(optimisticUser);
        void syncUserProfile(session.user).catch(() => {
          if (optimisticUser.role === "admin") {
            void refreshSchools();
          }
        });
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshSchools, syncUserProfile]);

  const login = useCallback(
    async (
      identity: string,
      password: string,
    ): Promise<{ success: boolean; error?: string; redirectTo: string }> => {
      const result = await supaSignIn(identity, password);
      if (result.error) {
        return { success: false, error: result.error, redirectTo: "" };
      }

      if (result.user) {
        const optimisticUser = buildAuthUser(result.user);
        setUser(optimisticUser);
        writeE2EUser(optimisticUser);
        if (optimisticUser.role !== "admin") {
          setRegisteredSchools([]);
        }
        void syncUserProfile(result.user).catch(() => {
          if (optimisticUser.role === "admin") {
            void refreshSchools();
          }
        });
        const redirectTo = optimisticUser.role === "admin" ? "/dashboard-admin" : "/dashboard/ringkasan";
        return { success: true, redirectTo };
      }

      return { success: false, error: "Terjadi kesalahan.", redirectTo: "" };
    },
    [refreshSchools, syncUserProfile],
  );

  const register = useCallback(
    async (data: RegisterInput): Promise<{ success: boolean; error?: string }> => {
      const payload: SignUpPayload = {
        email: data.email,
        password: data.password,
        schoolName: data.schoolName,
        npsn: data.npsn,
        contactName: data.contactName,
        phone: data.phone,
        address: data.address,
      };

      const result = await supaSignUp(payload);
      if (result.error) {
        return { success: false, error: result.error };
      }
      return { success: true };
    },
    [],
  );

  const resendSignupVerification = useCallback(
    async (email: string): Promise<{ success: boolean; error?: string }> => {
      const result = await supaResendSignupVerification(email.trim());
      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    [],
  );

  const changePassword = useCallback(
    async (
      currentPassword: string,
      nextPassword: string,
    ): Promise<{ success: boolean; error?: string }> => {
      const result = await supaChangePassword(currentPassword, nextPassword);
      if (result.error) {
        return { success: false, error: result.error };
      }

      return { success: true };
    },
    [],
  );

  const updateAvatarPath = useCallback(
    async (nextPath: string): Promise<{ success: boolean; error?: string }> => {
      const result = await supaUpdateUserMetadata({ avatar_path: nextPath });
      if (result.error) {
        return { success: false, error: result.error };
      }

      if (result.user) {
        const nextAuthUser = buildAuthUser(result.user);
        setUser(nextAuthUser);
        writeE2EUser(nextAuthUser);
      }

      return { success: true };
    },
    [],
  );

  const logout = useCallback(async () => {
    const result = await supaSignOut();
    if (result.error) {
      console.error("logout error:", result.error);
      throw new Error(result.error);
    }

    setUser(null);
    setRegisteredSchools([]);
    writeE2EUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: authUser,
      loading: authLoading,
      isAuthenticated: authUser !== null,
      registeredSchools,
      login,
      register,
      resendSignupVerification,
      changePassword,
      updateAvatarPath,
      logout,
      refreshSchools,
    }),
    [authLoading, authUser, registeredSchools, login, register, resendSignupVerification, changePassword, updateAvatarPath, logout, refreshSchools],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
