"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  updateEmail as supaUpdateEmail,
  type SignUpPayload,
} from "./supabase/services/auth";
import {
  fetchAllSchoolProfiles,
  type RegisteredSchoolProfile,
  updateSchoolApprovalStatus as updateSchoolApprovalStatusInProfiles,
  type SchoolApprovalStatus,
} from "./supabase/services/profiles";
import { createClient } from "./supabase/client";

export type UserRole = "school" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarPath?: string;
  approvalStatus?: SchoolApprovalStatus;
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
  approvalStatus: SchoolApprovalStatus;
  approvalReviewedAt?: string;
  approvalReviewedBy?: string;
  approvalRejectionReason?: string;
}

interface ProfileSnapshot {
  role?: string | null;
  approval_status?: string | null;
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
  updateAvatarPath(nextPath: string | null): Promise<{ success: boolean; error?: string }>;
  updateEmail(nextEmail: string): Promise<{ success: boolean; error?: string; emailChanged: boolean }>;
  updateSchoolApprovalStatus(
    schoolId: string,
    status: SchoolApprovalStatus,
    rejectionReason?: string,
  ): Promise<{ success: boolean; error?: string }>;
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
  const appMetadata = user.app_metadata as {
    role?: string;
    approval_status?: string;
  } | undefined;
  const metadata = user.user_metadata as {
    school_name?: string;
    contact_name?: string;
    avatar_path?: string;
  } | undefined;
  const appRole =
    appMetadata?.role === "admin" || appMetadata?.role === "school"
      ? appMetadata.role
      : undefined;
  const appApprovalStatus =
    appMetadata?.approval_status === "pending" ||
    appMetadata?.approval_status === "approved" ||
    appMetadata?.approval_status === "rejected"
      ? appMetadata.approval_status
      : undefined;

  const role = (profile?.role ?? appRole ?? "school") as UserRole;
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
    approvalStatus:
      role === "admin"
        ? "approved"
        : ((profile?.approval_status as SchoolApprovalStatus | null) ?? appApprovalStatus ?? "pending"),
  };
}

function getTrustedProfileSnapshotFromUser(user: User): ProfileSnapshot | null {
  const appMetadata = user.app_metadata as Record<string, unknown> | null;
  const userMetadata = user.user_metadata as Record<string, unknown> | null;
  const role = appMetadata?.role;

  if (role !== "admin" && role !== "school") {
    return null;
  }

  const approvalStatus =
    role === "admin" ? "approved" : appMetadata?.approval_status;

  if (
    role === "school" &&
    approvalStatus !== "pending" &&
    approvalStatus !== "approved" &&
    approvalStatus !== "rejected"
  ) {
    return null;
  }

  return {
    role,
    approval_status: approvalStatus as string,
    school_name: typeof userMetadata?.school_name === "string" ? userMetadata.school_name : null,
    contact_name: typeof userMetadata?.contact_name === "string" ? userMetadata.contact_name : null,
    email: user.email ?? null,
    avatar_path: typeof userMetadata?.avatar_path === "string" ? userMetadata.avatar_path : null,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(!isE2EMode);
  const [registeredSchools, setRegisteredSchools] = useState<RegisteredSchool[]>([]);
  const manualLoginInFlightRef = useRef(false);
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
            approvalStatus: s.approvalStatus,
            approvalReviewedAt: s.approvalReviewedAt,
            approvalReviewedBy: s.approvalReviewedBy,
            approvalRejectionReason: s.approvalRejectionReason,
          }),
        ),
      );
    } catch {
      // Admin may not be logged in yet
    }
  }, []);

  const syncUserProfile = useCallback(
    async (nextUser: User) => {
      const trustedProfile = getTrustedProfileSnapshotFromUser(nextUser);
      const profile = trustedProfile ?? await getProfile(nextUser.id);
      if (!profile) {
        await supaSignOut().catch(() => null);
        setUser(null);
        setRegisteredSchools([]);
        writeE2EUser(null);
        return null;
      }

      const resolvedUser = buildAuthUser(nextUser, profile);

      if (resolvedUser.role === "school" && resolvedUser.approvalStatus !== "approved") {
        await supaSignOut().catch(() => null);
        setUser(null);
        setRegisteredSchools([]);
        writeE2EUser(null);
        return null;
      }

      setUser(resolvedUser);
      writeE2EUser(resolvedUser);

      if (resolvedUser.role !== "admin") {
        setRegisteredSchools([]);
      }

      return resolvedUser;
    },
    [],
  );

  useEffect(() => {
    if (isE2EMode) {
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        await syncUserProfile(session.user).catch(() => null);
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

      if (event === "SIGNED_IN" && manualLoginInFlightRef.current) {
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        await syncUserProfile(session.user).catch(() => null);
      }
    });

    return () => subscription.unsubscribe();
  }, [refreshSchools, syncUserProfile]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (authUser?.role === "admin") {
      const refreshTimer = window.setTimeout(() => {
        void refreshSchools();
      }, 0);

      return () => window.clearTimeout(refreshTimer);
    }

    const clearTimer = window.setTimeout(() => {
      setRegisteredSchools([]);
    }, 0);

    return () => window.clearTimeout(clearTimer);
  }, [authLoading, authUser?.id, authUser?.role, refreshSchools]);

  const login = useCallback(
    async (
      identity: string,
      password: string,
    ): Promise<{ success: boolean; error?: string; redirectTo: string }> => {
      manualLoginInFlightRef.current = true;

      try {
        const result = await supaSignIn(identity, password);
        if (result.error) {
          return { success: false, error: result.error, redirectTo: "" };
        }

        if (result.user && result.profile) {
          const resolvedUser = buildAuthUser(result.user, result.profile);
          setUser(resolvedUser);
          writeE2EUser(resolvedUser);
          if (resolvedUser.role !== "admin") {
            setRegisteredSchools([]);
          }
          const redirectTo = resolvedUser.role === "admin" ? "/dashboard-admin" : "/dashboard/ringkasan";
          return { success: true, redirectTo };
        }

        return { success: false, error: "Terjadi kesalahan.", redirectTo: "" };
      } finally {
        window.setTimeout(() => {
          manualLoginInFlightRef.current = false;
        }, 750);
      }
    },
    [],
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
    async (nextPath: string | null): Promise<{ success: boolean; error?: string }> => {
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

  const updateEmail = useCallback(
    async (nextEmail: string): Promise<{ success: boolean; error?: string; emailChanged: boolean }> => {
      const result = await supaUpdateEmail(nextEmail);
      if (result.error) {
        return { success: false, error: result.error, emailChanged: false };
      }

      if (result.user) {
        const profile = await getProfile(result.user.id).catch(() => null);
        const nextAuthUser = buildAuthUser(result.user, profile);
        setUser(nextAuthUser);
        writeE2EUser(nextAuthUser);
      }

      return { success: true, emailChanged: result.emailChanged };
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

  const updateSchoolApprovalStatus = useCallback(
    async (
      schoolId: string,
      status: SchoolApprovalStatus,
      rejectionReason?: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!authUser?.id || authUser.role !== "admin") {
        return { success: false, error: "Hanya admin yang bisa memperbarui status akun sekolah." };
      }

      if (status === "rejected" && !rejectionReason?.trim()) {
        return { success: false, error: "Alasan penolakan wajib diisi." };
      }

      try {
        await updateSchoolApprovalStatusInProfiles(
          schoolId,
          status,
          authUser.id,
          rejectionReason?.trim(),
        );
        await refreshSchools();
        return { success: true };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Gagal memperbarui status akun sekolah.";
        return { success: false, error: message };
      }
    },
    [authUser, refreshSchools],
  );

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
      updateEmail,
      updateSchoolApprovalStatus,
      logout,
      refreshSchools,
    }),
    [authLoading, authUser, registeredSchools, login, register, resendSignupVerification, changePassword, updateAvatarPath, updateEmail, updateSchoolApprovalStatus, logout, refreshSchools],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
