"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import { resolvePostLoginRedirect } from "@/lib/userFlow";

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
  const hasRedirectTarget = Boolean(searchParams.get("redirectTo"));
  const fieldInputClassName =
    "min-h-14 rounded-2xl border border-[#c6cfdd] bg-white/95 px-4 py-3 text-[15px] font-medium leading-6 text-[#13203b] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#7a869c] hover:border-[#b3bfd3] focus:border-[#c99842] focus:bg-white";

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
    <main className="relative grid min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f2eee5_0%,#ece6da_100%)] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-4 rounded-[28px] border border-[#18274714] sm:inset-6 lg:inset-8" />

      <section className="relative z-10 mx-auto grid w-full max-w-[1120px] overflow-hidden rounded-[30px] border border-[#1c2b491f] bg-[#fcfaf5] shadow-[0_34px_68px_rgba(20,30,50,0.14)] lg:grid-cols-[minmax(0,1.02fr)_minmax(420px,0.98fr)]">
        <div className="relative flex flex-col justify-between gap-9 overflow-hidden bg-[linear-gradient(160deg,#10203d_0%,#18315a_52%,#21436d_100%)] px-5 py-6 text-[#f6f1e7] sm:px-7 sm:py-8 lg:px-11 lg:py-12">
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-[260px] w-[260px] rounded-full border border-white/12" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(300px_240px_at_100%_0%,rgba(255,191,84,0.18),transparent_72%)]" />

          <div className="relative max-w-[480px]">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f6f1e7b8]">
              Platform Pendampingan
            </p>
            <h1 className="mt-4 max-w-[8ch] font-[var(--font-fraunces)] text-[42px] font-medium leading-[0.96] tracking-[-0.05em] text-white sm:text-[52px] lg:text-[68px]">
              Masuk ke ruang kerja MASIANG.
            </h1>
            <p className="mt-5 max-w-[420px] text-[15px] leading-8 text-[#f6f1e7d6] sm:text-[16px]">
              Akses booking, dokumen, tindak lanjut, dan komunikasi pendampingan
              sekolah dalam satu alur kerja yang rapi.
            </p>
          </div>

          <div className="relative grid gap-4">
            <article className="rounded-[20px] border border-white/12 bg-white/8 px-[18px] py-5 backdrop-blur-[8px]">
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f6f1e7a3]">
                Alur Kerja
              </p>
              <strong className="mt-3 block font-[var(--font-fraunces)] text-[28px] font-medium leading-none tracking-[-0.03em] text-white">
                Terstruktur
              </strong>
              <p className="mt-2.5 text-[14px] leading-7 text-[#f6f1e7c2]">
                Booking, arsip, notifikasi, dan progres sesi tersusun dalam satu
                dashboard.
              </p>
            </article>

            <article className="rounded-[20px] border border-white/12 bg-white/8 px-[18px] py-5 backdrop-blur-[8px]">
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f6f1e7a3]">
                Akses Data
              </p>
              <strong className="mt-3 block font-[var(--font-fraunces)] text-[28px] font-medium leading-none tracking-[-0.03em] text-white">
                Aman
              </strong>
              <p className="mt-2.5 text-[14px] leading-7 text-[#f6f1e7c2]">
                Hak akses sekolah dan admin dipisahkan, dengan validasi session
                dan penyimpanan dokumen di Supabase.
              </p>
            </article>
          </div>

          <div className="relative rounded-[20px] border border-white/12 bg-white/8 p-[18px] backdrop-blur-[8px]">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f5c56a]">
              Untuk sekolah dan admin
            </p>
            <p className="mt-2.5 text-[14px] leading-7 text-[#f6f1e7c2]">
              Gunakan email yang sudah terdaftar. Jika akun belum dibuat, daftar
              sekolah terlebih dahulu lalu masuk ke dashboard sesuai peran.
            </p>
          </div>
        </div>

        <section className="flex flex-col justify-center bg-[linear-gradient(180deg,#fcfaf4_0%,#f7f1e6_100%)] px-5 py-6 sm:px-7 sm:py-8 lg:px-11 lg:py-12">
          <div className="max-w-[440px]">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8e6e3d]">
              Login
            </p>
            <h2 className="mt-3 font-[var(--font-fraunces)] text-[34px] font-medium leading-[1.02] tracking-[-0.04em] text-[#14233f] sm:text-[38px] lg:text-[42px]">
              Akses dashboard
            </h2>
            <p className="mt-3.5 text-[15px] leading-7 text-[#44536f]">
              Masukkan kredensial akun untuk melanjutkan ke area kerja Anda.
            </p>
          </div>

          {hasRedirectTarget ? (
            <div className="mt-[22px] rounded-2xl border border-[#d6dded] bg-[#f2f5fb] px-4 py-3.5 text-[13px] leading-6 text-[#40506e]">
              Setelah login, Anda akan diarahkan kembali ke halaman yang tadi
              diminta.
            </div>
          ) : null}

          <form className="mt-6 grid gap-[18px]" onSubmit={onSubmit} noValidate>
            <label className="grid gap-2.5">
              <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                Email
              </span>
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
                className={`${fieldInputClassName} ${touched.identity && errors.identity ? "border-[#bb5555]" : ""}`}
              />
              {touched.identity && errors.identity ? (
                <small id="identity-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                  {errors.identity}
                </small>
              ) : null}
            </label>

            <label className="grid gap-2.5">
              <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                Kata Sandi
              </span>
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
                className={`${fieldInputClassName} ${touched.password && errors.password ? "border-[#bb5555]" : ""}`}
              />
              {touched.password && errors.password ? (
                <small id="password-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
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
              className="mt-1.5 min-h-14 w-full"
            >
              Masuk
            </Button>
          </form>

          {status === "error" ? (
            <p className="mt-4 rounded-2xl border border-[#e4b8b8] bg-[#fff1f1] px-3.5 py-[13px] text-[13px] leading-6 text-[#8c2f2f]">
              Form belum valid. Periksa kembali data yang ditandai.
            </p>
          ) : null}

          {status === "auth_error" ? (
            <div className="mt-4 space-y-3">
              <p className="rounded-2xl border border-[#e4b8b8] bg-[#fff1f1] px-3.5 py-[13px] text-[13px] leading-6 text-[#8c2f2f]">
                {authError}
              </p>
              <div className="rounded-2xl border border-[#ddd5c8] bg-white/80 p-4">
                <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5b4b36]">
                  Verifikasi Operator
                </p>
                <p className="mt-2.5 text-[13px] leading-7 text-[#4f5a70]">
                  Jika akun sekolah belum bisa login, pastikan operator sekolah sudah mengaktifkan akun tersebut.
                </p>
              </div>
            </div>
          ) : null}

          {status === "success" ? (
            <p className="mt-4 rounded-2xl border border-[#bad6c0] bg-[#eff8f1] px-3.5 py-[13px] text-[13px] leading-6 text-[#245535]">
              Login berhasil. Anda sedang diarahkan ke dashboard.
            </p>
          ) : null}

          <div className="mt-[18px] rounded-2xl border border-[#ddd5c8] bg-white/70 p-4">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5b4b36]">
              Informasi login
            </p>
            <p className="mt-2.5 text-[13px] leading-7 text-[#4f5a70]">
              Akses menggunakan email dan password yang sudah terdaftar pada
              sistem. Belum punya akun sekolah? Gunakan halaman pendaftaran.
            </p>
          </div>

          <div className="mt-[22px] flex flex-col gap-[10px] sm:flex-row sm:flex-wrap sm:justify-between sm:gap-x-[18px]">
            <Link
              href="/"
              className="text-[13px] font-bold leading-6 text-[#213150] no-underline hover:underline hover:underline-offset-[0.18em]"
            >
              Kembali ke beranda
            </Link>
            <Link
              href="/daftar-sekolah"
              className="text-[13px] font-bold leading-6 text-[#213150] no-underline hover:underline hover:underline-offset-[0.18em]"
            >
              Belum punya akun sekolah?
            </Link>
          </div>
        </section>
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
