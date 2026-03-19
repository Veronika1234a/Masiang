"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { resolvePostLoginRedirect } from "@/lib/userFlow";
import styles from "./page.module.css";

type LoginField = "identity" | "password";

export interface LoginFormValues {
  identity: string;
  password: string;
}

type LoginFormErrors = Partial<Record<LoginField, string>>;
type SubmitStatus = "idle" | "error" | "success" | "auth_error";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const initialValues: LoginFormValues = {
  identity: "",
  password: "",
};

function validate(values: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};

  if (!emailPattern.test(values.identity.trim())) {
    errors.identity = "Masukkan email yang valid.";
  }

  if (!values.password) {
    errors.password = "Kata sandi wajib diisi.";
  } else if (values.password.length < 6) {
    errors.password = "Kata sandi minimal 6 karakter.";
  }

  return errors;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const [values, setValues] = useState<LoginFormValues>(initialValues);
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<Record<LoginField, boolean>>({
    identity: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [authError, setAuthError] = useState("");

  const isFormValid = useMemo(
    () => Object.keys(validate(values)).length === 0,
    [values],
  );

  const onChange = (field: LoginField) => (event: ChangeEvent<HTMLInputElement>) => {
    const nextValues = { ...values, [field]: event.target.value };
    setValues(nextValues);
    if (touched[field]) {
      setErrors(validate(nextValues));
    }
  };

  const onBlur = (field: LoginField) => () => {
    const nextTouched = { ...touched, [field]: true };
    setTouched(nextTouched);
    setErrors(validate(values));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const currentErrors = validate(values);
    setErrors(currentErrors);
    setTouched({ identity: true, password: true });

    if (Object.keys(currentErrors).length > 0) {
      setStatus("error");
      return;
    }

    setStatus("idle");
    setAuthError("");
    setIsSubmitting(true);

    try {
      const result = await login(values.identity.trim(), values.password);

      if (result.success) {
        setStatus("success");
        const redirectTo = resolvePostLoginRedirect(
          searchParams.get("redirectTo"),
          result.redirectTo,
        );
        router.replace(redirectTo);
      } else {
        setIsSubmitting(false);
        setStatus("auth_error");
        setAuthError(result.error ?? "Login gagal.");
      }
    } catch {
      setIsSubmitting(false);
      setStatus("auth_error");
      setAuthError("Terjadi kesalahan saat login.");
    }
  };

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Login</h1>
        <p className={styles.description}>
          Masuk ke dashboard MASIANG untuk memantau pendampingan sekolah.
        </p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span>Email</span>
            <input
              id="identity"
              type="email"
              value={values.identity}
              onChange={onChange("identity")}
              onBlur={onBlur("identity")}
              autoComplete="username"
              placeholder="contoh: sdn1mappak@gmail.com"
              aria-invalid={Boolean(touched.identity && errors.identity)}
              aria-describedby={errors.identity ? "identity-error" : undefined}
            />
            {touched.identity && errors.identity ? (
              <small id="identity-error" className={styles.error}>
                {errors.identity}
              </small>
            ) : null}
          </label>

          <label className={styles.field}>
            <span>Kata Sandi</span>
            <input
              id="password"
              type="password"
              value={values.password}
              onChange={onChange("password")}
              onBlur={onBlur("password")}
              autoComplete="current-password"
              placeholder="Minimal 6 karakter"
              aria-invalid={Boolean(touched.password && errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {touched.password && errors.password ? (
              <small id="password-error" className={styles.error}>
                {errors.password}
              </small>
            ) : null}
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isSubmitting}
            disabled={!isFormValid || isSubmitting}
            className={styles.submit}
          >
            Masuk
          </Button>
        </form>

        {status === "error" ? (
          <p className={styles.statusError}>
            Form belum valid. Periksa kembali data yang ditandai.
          </p>
        ) : null}

        {status === "auth_error" ? (
          <p className={styles.statusError}>
            {authError}
          </p>
        ) : null}

        {status === "success" ? (
          <p className={styles.statusSuccess}>
            Login berhasil! Mengalihkan ke dashboard...
          </p>
        ) : null}

        {/* Help text */}
        <div style={{ marginTop: 16, padding: "12px 14px", background: "#f0f4ff", borderRadius: 10, border: "1px solid #d4ddf0" }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#3f4e72", margin: 0 }}>Informasi Login</p>
          <p style={{ fontSize: 12, color: "#5a6b8f", margin: "6px 0 0" }}>
            Masuk menggunakan email dan password yang didaftarkan. Belum punya akun? Daftar terlebih dahulu.
          </p>
        </div>

        <div className={styles.links}>
          <Link href="/">Kembali ke beranda</Link>
          <Link href="/daftar-sekolah">Belum punya akun sekolah?</Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
