"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";

type SchoolField =
  | "schoolName"
  | "npsn"
  | "contactName"
  | "email"
  | "phone"
  | "address"
  | "password"
  | "confirmPassword";

export interface SchoolRegistrationFormValues {
  schoolName: string;
  npsn: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  password: string;
  confirmPassword: string;
}

type SchoolRegistrationErrors = Partial<Record<SchoolField, string>>;
type SubmitStatus = "idle" | "error" | "success" | "auth_error";

const initialValues: SchoolRegistrationFormValues = {
  schoolName: "",
  npsn: "",
  contactName: "",
  email: "",
  phone: "",
  address: "",
  password: "",
  confirmPassword: "",
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: SchoolRegistrationFormValues): SchoolRegistrationErrors {
  const errors: SchoolRegistrationErrors = {};

  if (!values.schoolName.trim() || values.schoolName.trim().length < 3) {
    errors.schoolName = "Nama sekolah minimal 3 karakter.";
  }

  if (!/^\d{8}$/.test(values.npsn.trim())) {
    errors.npsn = "NPSN harus 8 digit angka.";
  }

  if (!values.contactName.trim()) {
    errors.contactName = "Nama penanggung jawab wajib diisi.";
  }

  if (!emailPattern.test(values.email.trim())) {
    errors.email = "Masukkan format email yang valid.";
  }

  if (!/^\+?[\d\s-]{10,15}$/.test(values.phone.trim())) {
    errors.phone = "Nomor telepon harus 10-15 karakter angka.";
  }

  if (!values.address.trim() || values.address.trim().length < 10) {
    errors.address = "Alamat minimal 10 karakter.";
  }

  if (!values.password || values.password.length < 6) {
    errors.password = "Password minimal 6 karakter.";
  }

  if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Konfirmasi password tidak cocok.";
  }

  return errors;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const fieldInputClassName =
    "min-h-14 rounded-2xl border border-[#c6cfdd] bg-white/95 px-4 py-3 text-[15px] font-medium leading-6 text-[#13203b] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-[#7a869c] hover:border-[#b3bfd3] focus:border-[#c99842] focus:bg-white";

  const [values, setValues] = useState<SchoolRegistrationFormValues>(initialValues);
  const [errors, setErrors] = useState<SchoolRegistrationErrors>({});
  const [touched, setTouched] = useState<Record<SchoolField, boolean>>({
    schoolName: false,
    npsn: false,
    contactName: false,
    email: false,
    phone: false,
    address: false,
    password: false,
    confirmPassword: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [authError, setAuthError] = useState("");

  const isFormValid = useMemo(
    () => Object.keys(validate(values)).length === 0,
    [values],
  );

  const onFieldChange =
    (field: SchoolField) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValues = { ...values, [field]: event.target.value };
      setValues(nextValues);
      if (touched[field]) {
        setErrors(validate(nextValues));
      }
    };

  const onFieldBlur = (field: SchoolField) => () => {
    const nextTouched = { ...touched, [field]: true };
    setTouched(nextTouched);
    setErrors(validate(values));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const currentErrors = validate(values);
    setErrors(currentErrors);
    setTouched({
      schoolName: true,
      npsn: true,
      contactName: true,
      email: true,
      phone: true,
      address: true,
      password: true,
      confirmPassword: true,
    });

    if (Object.keys(currentErrors).length > 0) {
      setStatus("error");
      return;
    }

    setStatus("idle");
    setAuthError("");
    setIsSubmitting(true);

    try {
      const result = await register({
        schoolName: values.schoolName.trim(),
        npsn: values.npsn.trim(),
        contactName: values.contactName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim(),
        address: values.address.trim(),
        password: values.password,
      });

      setIsSubmitting(false);

      if (result.success) {
        setStatus("success");
      } else {
        setStatus("auth_error");
        setAuthError(result.error ?? "Registrasi gagal.");
      }
    } catch {
      setIsSubmitting(false);
      setStatus("auth_error");
      setAuthError("Terjadi kesalahan saat registrasi.");
    }
  };

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f2eee5_0%,#ece6da_100%)] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="pointer-events-none absolute inset-4 rounded-[28px] border border-[#18274714] sm:inset-6 lg:inset-8" />

      <section className="relative z-10 mx-auto grid w-full max-w-[1180px] overflow-hidden rounded-[30px] border border-[#1c2b491f] bg-[#fcfaf5] shadow-[0_34px_68px_rgba(20,30,50,0.14)] lg:grid-cols-[minmax(0,0.96fr)_minmax(520px,1.04fr)]">
        <div className="relative flex flex-col justify-between gap-9 overflow-hidden bg-[linear-gradient(160deg,#10203d_0%,#18315a_52%,#21436d_100%)] px-5 py-6 text-[#f6f1e7] sm:px-7 sm:py-8 lg:px-11 lg:py-12">
          <div className="pointer-events-none absolute -bottom-24 -right-20 h-[260px] w-[260px] rounded-full border border-white/12" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(320px_260px_at_100%_0%,rgba(255,191,84,0.18),transparent_72%)]" />

          <div className="relative max-w-[500px]">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f6f1e7b8]">
              Registrasi Sekolah
            </p>
            <h1 className="mt-4 max-w-[10ch] font-[var(--font-fraunces)] text-[40px] font-medium leading-[0.96] tracking-[-0.05em] text-white sm:text-[50px] lg:text-[64px]">
              Bangun akun kerja yang siap dipakai.
            </h1>
            <p className="mt-5 max-w-[440px] text-[15px] leading-8 text-[#f6f1e7d6] sm:text-[16px]">
              Lengkapi identitas sekolah sekali saja untuk mulai mengajukan
              pendampingan, mengelola dokumen, dan memantau progres sesi.
            </p>
          </div>

          <div className="relative grid gap-4">
            <article className="rounded-[20px] border border-white/12 bg-white/8 px-[18px] py-5 backdrop-blur-[8px]">
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f6f1e7a3]">
                Identitas
              </p>
              <strong className="mt-3 block font-[var(--font-fraunces)] text-[28px] font-medium leading-none tracking-[-0.03em] text-white">
                Lengkap
              </strong>
              <p className="mt-2.5 text-[14px] leading-7 text-[#f6f1e7c2]">
                Nama sekolah, NPSN, kontak penanggung jawab, dan alamat menjadi
                dasar seluruh alur pendampingan.
              </p>
            </article>

            <article className="rounded-[20px] border border-white/12 bg-white/8 px-[18px] py-5 backdrop-blur-[8px]">
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f6f1e7a3]">
                Kredensial
              </p>
              <strong className="mt-3 block font-[var(--font-fraunces)] text-[28px] font-medium leading-none tracking-[-0.03em] text-white">
                Aktif
              </strong>
              <p className="mt-2.5 text-[14px] leading-7 text-[#f6f1e7c2]">
                Gunakan email operasional yang benar-benar dipakai sekolah agar
                notifikasi dan akses akun tetap jelas.
              </p>
            </article>
          </div>

          <div className="relative rounded-[20px] border border-white/12 bg-white/8 p-[18px] backdrop-blur-[8px]">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#f5c56a]">
              Catatan
            </p>
            <p className="mt-2.5 text-[14px] leading-7 text-[#f6f1e7c2]">
              Setelah registrasi berhasil, masuk ke dashboard untuk mulai booking
              pendampingan dan unggah dokumen pendukung sesuai kebutuhan sekolah.
            </p>
          </div>
        </div>

        <section className="flex flex-col justify-center bg-[linear-gradient(180deg,#fcfaf4_0%,#f7f1e6_100%)] px-5 py-6 sm:px-7 sm:py-8 lg:px-11 lg:py-12">
          <div className="max-w-[640px]">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#8e6e3d]">
              Form Registrasi
            </p>
            <h2 className="mt-3 font-[var(--font-fraunces)] text-[34px] font-medium leading-[1.02] tracking-[-0.04em] text-[#14233f] sm:text-[38px] lg:text-[42px]">
              Siapkan akun sekolah
            </h2>
            <p className="mt-3.5 max-w-[520px] text-[15px] leading-7 text-[#44536f]">
              Isi data sekolah dengan rapi. Form ini akan dipakai sebagai identitas
              awal pada dashboard dan arsip layanan.
            </p>
          </div>

          <form className="mt-6 grid gap-[18px]" onSubmit={onSubmit} noValidate>
            <label className="grid gap-2.5">
              <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                Nama Sekolah
              </span>
              <input
                id="schoolName"
                type="text"
                value={values.schoolName}
                onChange={onFieldChange("schoolName")}
                onBlur={onFieldBlur("schoolName")}
                placeholder="Contoh: SMP Negeri 1 Makale"
                aria-invalid={Boolean(touched.schoolName && errors.schoolName)}
                aria-describedby={errors.schoolName ? "schoolName-error" : undefined}
                className={`${fieldInputClassName} ${touched.schoolName && errors.schoolName ? "border-[#bb5555]" : ""}`}
              />
              {touched.schoolName && errors.schoolName ? (
                <small id="schoolName-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                  {errors.schoolName}
                </small>
              ) : null}
            </label>

            <div className="grid gap-[18px] lg:grid-cols-2">
              <label className="grid gap-2.5">
                <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                  NPSN
                </span>
                <input
                  id="npsn"
                  type="text"
                  inputMode="numeric"
                  value={values.npsn}
                  onChange={onFieldChange("npsn")}
                  onBlur={onFieldBlur("npsn")}
                  placeholder="8 digit NPSN"
                  aria-invalid={Boolean(touched.npsn && errors.npsn)}
                  aria-describedby={errors.npsn ? "npsn-error" : undefined}
                  className={`${fieldInputClassName} ${touched.npsn && errors.npsn ? "border-[#bb5555]" : ""}`}
                />
                {touched.npsn && errors.npsn ? (
                  <small id="npsn-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                    {errors.npsn}
                  </small>
                ) : null}
              </label>

              <label className="grid gap-2.5">
                <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                  Nama Penanggung Jawab
                </span>
                <input
                  id="contactName"
                  type="text"
                  value={values.contactName}
                  onChange={onFieldChange("contactName")}
                  onBlur={onFieldBlur("contactName")}
                  placeholder="Nama kepala sekolah / operator"
                  aria-invalid={Boolean(touched.contactName && errors.contactName)}
                  aria-describedby={errors.contactName ? "contactName-error" : undefined}
                  className={`${fieldInputClassName} ${touched.contactName && errors.contactName ? "border-[#bb5555]" : ""}`}
                />
                {touched.contactName && errors.contactName ? (
                  <small id="contactName-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                    {errors.contactName}
                  </small>
                ) : null}
              </label>
            </div>

            <div className="grid gap-[18px] lg:grid-cols-2">
              <label className="grid gap-2.5">
                <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                  Email
                </span>
                <input
                  id="email"
                  type="email"
                  value={values.email}
                  onChange={onFieldChange("email")}
                  onBlur={onFieldBlur("email")}
                  placeholder="admin@sekolah.sch.id"
                  aria-invalid={Boolean(touched.email && errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className={`${fieldInputClassName} ${touched.email && errors.email ? "border-[#bb5555]" : ""}`}
                />
                {touched.email && errors.email ? (
                  <small id="email-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                    {errors.email}
                  </small>
                ) : null}
              </label>

              <label className="grid gap-2.5">
                <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                  No. Telepon
                </span>
                <input
                  id="phone"
                  type="tel"
                  value={values.phone}
                  onChange={onFieldChange("phone")}
                  onBlur={onFieldBlur("phone")}
                  placeholder="+62 812 0000 0000"
                  aria-invalid={Boolean(touched.phone && errors.phone)}
                  aria-describedby={errors.phone ? "phone-error" : undefined}
                  className={`${fieldInputClassName} ${touched.phone && errors.phone ? "border-[#bb5555]" : ""}`}
                />
                {touched.phone && errors.phone ? (
                  <small id="phone-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                    {errors.phone}
                  </small>
                ) : null}
              </label>
            </div>

            <label className="grid gap-2.5">
              <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                Alamat Sekolah
              </span>
              <textarea
                id="address"
                rows={4}
                value={values.address}
                onChange={onFieldChange("address")}
                onBlur={onFieldBlur("address")}
                placeholder="Alamat lengkap sekolah"
                aria-invalid={Boolean(touched.address && errors.address)}
                aria-describedby={errors.address ? "address-error" : undefined}
                className={`${fieldInputClassName} min-h-[124px] resize-y ${touched.address && errors.address ? "border-[#bb5555]" : ""}`}
              />
              {touched.address && errors.address ? (
                <small id="address-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                  {errors.address}
                </small>
              ) : null}
            </label>

            <div className="grid gap-[18px] lg:grid-cols-2">
              <label className="grid gap-2.5">
                <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                  Password
                </span>
                <input
                  id="password"
                  type="password"
                  value={values.password}
                  onChange={onFieldChange("password")}
                  onBlur={onFieldBlur("password")}
                  autoComplete="new-password"
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

              <label className="grid gap-2.5">
                <span className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#213150]">
                  Konfirmasi Password
                </span>
                <input
                  id="confirmPassword"
                  type="password"
                  value={values.confirmPassword}
                  onChange={onFieldChange("confirmPassword")}
                  onBlur={onFieldBlur("confirmPassword")}
                  autoComplete="new-password"
                  placeholder="Ulangi password"
                  aria-invalid={Boolean(touched.confirmPassword && errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
                  className={`${fieldInputClassName} ${touched.confirmPassword && errors.confirmPassword ? "border-[#bb5555]" : ""}`}
                />
                {touched.confirmPassword && errors.confirmPassword ? (
                  <small id="confirmPassword-error" className="text-[12px] font-bold leading-[1.5] text-[#9c3535]">
                    {errors.confirmPassword}
                  </small>
                ) : null}
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isSubmitting}
              disabled={!isFormValid || isSubmitting}
              className="mt-1.5 min-h-14 w-full"
            >
              Daftar Sekolah
            </Button>
          </form>

          {status === "error" ? (
            <p className="mt-4 rounded-2xl border border-[#e4b8b8] bg-[#fff1f1] px-3.5 py-[13px] text-[13px] leading-6 text-[#8c2f2f]">
              Data belum lengkap. Lengkapi semua kolom yang bertanda error.
            </p>
          ) : null}

          {status === "auth_error" ? (
            <p className="mt-4 rounded-2xl border border-[#e4b8b8] bg-[#fff1f1] px-3.5 py-[13px] text-[13px] leading-6 text-[#8c2f2f]">
              {authError}
            </p>
          ) : null}

          {status === "success" ? (
            <div className="mt-4 rounded-2xl border border-[#bad6c0] bg-[#eff8f1] px-4 py-3.5 text-[13px] leading-6 text-[#245535]">
              <p className="m-0 font-bold">Registrasi berhasil!</p>
              <p className="mt-1.5">
                Akun sekolah Anda sudah dibuat. Silakan{" "}
                <Link href="/login" className="font-bold underline underline-offset-[0.18em]">
                  login
                </Link>{" "}
                untuk masuk ke dashboard. Jika akses belum tersedia, periksa
                apakah akun masih menunggu verifikasi email.
              </p>
            </div>
          ) : null}

          <div className="mt-[18px] rounded-2xl border border-[#ddd5c8] bg-white/70 p-4">
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#5b4b36]">
              Sebelum kirim
            </p>
            <p className="mt-2.5 text-[13px] leading-7 text-[#4f5a70]">
              Pastikan email dan nomor telepon sekolah aktif. Data ini akan dipakai
              untuk identitas akun dan komunikasi selama proses pendampingan.
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
              href="/login"
              className="text-[13px] font-bold leading-6 text-[#213150] no-underline hover:underline hover:underline-offset-[0.18em]"
            >
              Sudah punya akun?
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
