"use client";

import { Button } from "@/components/ui/Button";
import styles from "./DashboardDataState.module.css";

type DashboardDataStateVariant = "loading" | "empty" | "error";

interface DashboardDataStateProps {
  variant: DashboardDataStateVariant;
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const defaultContent: Record<
  DashboardDataStateVariant,
  { title: string; description: string }
> = {
  loading: {
    title: "Memuat Data",
    description: "Sedang mengambil data terbaru dari dashboard.",
  },
  empty: {
    title: "Data Tidak Ditemukan",
    description:
      "Belum ada data yang sesuai filter. Ubah kata kunci, status, atau tanggal.",
  },
  error: {
    title: "Gagal Memuat Data",
    description: "Terjadi kendala saat mengambil data. Silakan coba lagi.",
  },
};

export function DashboardDataState({
  variant,
  title,
  description,
  onRetry,
}: DashboardDataStateProps) {
  const content = defaultContent[variant];
  const resolvedTitle = title ?? content.title;
  const resolvedDescription = description ?? content.description;

  return (
    <div className={styles.stateBox} role="status" aria-live="polite">
      {variant === "loading" ? (
        <div className={styles.spinnerWrap} aria-hidden="true">
          <span className={styles.spinner} />
        </div>
      ) : null}

      <h4>{resolvedTitle}</h4>
      <p>{resolvedDescription}</p>

      {variant === "error" && onRetry ? (
        <Button variant="dark" size="sm" onClick={onRetry}>
          Coba Lagi
        </Button>
      ) : null}
    </div>
  );
}
