"use client";

import Link from "next/link";
import { type ChangeEvent, type FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/AuthContext";
import styles from "./page.module.css";

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
    <main className={styles.page}>
      <section className={styles.card}>
        <h1>Daftar Sekolah</h1>
        <p className={styles.description}>
          Lengkapi data sekolah untuk mengajukan pendampingan pada sistem MASIANG.
        </p>

        <form className={styles.form} onSubmit={onSubmit} noValidate>
          <label className={styles.field}>
            <span>Nama Sekolah</span>
            <input
              id="schoolName"
              type="text"
              value={values.schoolName}
              onChange={onFieldChange("schoolName")}
              onBlur={onFieldBlur("schoolName")}
              placeholder="Contoh: SMP Negeri 1 Makale"
              aria-invalid={Boolean(touched.schoolName && errors.schoolName)}
              aria-describedby={errors.schoolName ? "schoolName-error" : undefined}
            />
            {touched.schoolName && errors.schoolName ? (
              <small id="schoolName-error" className={styles.error}>
                {errors.schoolName}
              </small>
            ) : null}
          </label>

          <label className={styles.field}>
            <span>NPSN</span>
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
            />
            {touched.npsn && errors.npsn ? (
              <small id="npsn-error" className={styles.error}>
                {errors.npsn}
              </small>
            ) : null}
          </label>

          <label className={styles.field}>
            <span>Nama Penanggung Jawab</span>
            <input
              id="contactName"
              type="text"
              value={values.contactName}
              onChange={onFieldChange("contactName")}
              onBlur={onFieldBlur("contactName")}
              placeholder="Nama kepala sekolah / operator"
              aria-invalid={Boolean(touched.contactName && errors.contactName)}
              aria-describedby={errors.contactName ? "contactName-error" : undefined}
            />
            {touched.contactName && errors.contactName ? (
              <small id="contactName-error" className={styles.error}>
                {errors.contactName}
              </small>
            ) : null}
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Email</span>
              <input
                id="email"
                type="email"
                value={values.email}
                onChange={onFieldChange("email")}
                onBlur={onFieldBlur("email")}
                placeholder="admin@sekolah.sch.id"
                aria-invalid={Boolean(touched.email && errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {touched.email && errors.email ? (
                <small id="email-error" className={styles.error}>
                  {errors.email}
                </small>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>No. Telepon</span>
              <input
                id="phone"
                type="tel"
                value={values.phone}
                onChange={onFieldChange("phone")}
                onBlur={onFieldBlur("phone")}
                placeholder="+62 812 0000 0000"
                aria-invalid={Boolean(touched.phone && errors.phone)}
                aria-describedby={errors.phone ? "phone-error" : undefined}
              />
              {touched.phone && errors.phone ? (
                <small id="phone-error" className={styles.error}>
                  {errors.phone}
                </small>
              ) : null}
            </label>
          </div>

          <label className={styles.field}>
            <span>Alamat Sekolah</span>
            <textarea
              id="address"
              rows={3}
              value={values.address}
              onChange={onFieldChange("address")}
              onBlur={onFieldBlur("address")}
              placeholder="Alamat lengkap sekolah"
              aria-invalid={Boolean(touched.address && errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
            {touched.address && errors.address ? (
              <small id="address-error" className={styles.error}>
                {errors.address}
              </small>
            ) : null}
          </label>

          <div className={styles.row}>
            <label className={styles.field}>
              <span>Password</span>
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
              />
              {touched.password && errors.password ? (
                <small id="password-error" className={styles.error}>
                  {errors.password}
                </small>
              ) : null}
            </label>

            <label className={styles.field}>
              <span>Konfirmasi Password</span>
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
              />
              {touched.confirmPassword && errors.confirmPassword ? (
                <small id="confirmPassword-error" className={styles.error}>
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
            className={styles.submit}
          >
            Daftar Sekolah
          </Button>
        </form>

        {status === "error" ? (
          <p className={styles.statusError}>
            Data belum lengkap. Lengkapi semua kolom yang bertanda error.
          </p>
        ) : null}

        {status === "auth_error" ? (
          <p className={styles.statusError}>
            {authError}
          </p>
        ) : null}

        {status === "success" ? (
          <div className={styles.statusSuccess}>
            <p style={{ margin: 0, fontWeight: 700 }}>Registrasi berhasil!</p>
            <p style={{ margin: "6px 0 0" }}>
              Akun sekolah Anda berhasil dibuat. Silakan{" "}
              <Link href="/login" style={{ fontWeight: 700, textDecoration: "underline" }}>
                login
              </Link>{" "}
              untuk mengakses dashboard. Jika login belum bisa dilakukan, periksa apakah akun memerlukan verifikasi email.
            </p>
          </div>
        ) : null}

        <div className={styles.links}>
          <Link href="/">Kembali ke beranda</Link>
          <Link href="/login">Sudah punya akun?</Link>
        </div>
      </section>
    </main>
  );
}
