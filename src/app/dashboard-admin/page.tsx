"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import { formatShortDateID, getBookingSummary } from "@/lib/userDashboardData";

function getStatusClasses(status: string) {
  switch (status) {
    case "Menunggu":
      return "bg-[#fff6e6] text-[#9b6a1d]";
    case "Disetujui":
      return "bg-[#e8f3ee] text-[#2b5f52]";
    case "Dalam Proses":
      return "bg-[#eef4fb] text-[#35557c]";
    case "Selesai":
      return "bg-[#edf3ef] text-[#2f5a4b]";
    case "Ditolak":
      return "bg-[#fdf0ef] text-[#9b4b45]";
    case "Dibatalkan":
      return "bg-[#f0eef2] text-[#6d7998]";
    default:
      return "bg-[#f0eef2] text-[#6d7998]";
  }
}

function getReviewStatusClasses(status: string) {
  switch (status) {
    case "Disetujui":
      return "bg-[#e8f3ee] text-[#2b5f52]";
    case "Perlu Revisi":
      return "bg-[#fff6e6] text-[#9b6a1d]";
    default:
      return "bg-[#eef4fb] text-[#35557c]";
  }
}

export default function AdminDashboardPage() {
  const { bookings, documents, histories } = useDashboard();
  const { registeredSchools } = useAuth();
  const summary = getBookingSummary(bookings);

  const pendingBookings = bookings.filter((booking) => booking.status === "Menunggu").slice(0, 5);
  const docsNeedReview = documents.filter((document) => document.reviewStatus === "Menunggu Review").slice(0, 5);
  const stats = [
    {
      label: "Booking Baru",
      value: summary.pending,
      accent: "text-[#9b6a1d]",
      description: "Perlu keputusan admin.",
    },
    {
      label: "Booking Disetujui",
      value: summary.approved,
      accent: "text-[#35557c]",
      description: "Sudah siap masuk sesi.",
    },
    {
      label: "Dokumen Masuk",
      value: documents.length,
      accent: "text-[#2f5a4b]",
      description: "Total arsip yang tercatat.",
    },
    {
      label: "Sekolah Aktif",
      value: registeredSchools.length,
      accent: "text-[#304878]",
      description: "Akun sekolah terdaftar.",
    },
  ];

  return (
    <main className="w-full pb-12 text-[#121d35]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8">
        <nav className="text-[12px] font-bold text-[#6d7998]">
          <span className="text-[#25365f]">Ringkasan Admin</span>
        </nav>

        <header className="grid gap-8 border-b border-[#e5dfeb] pb-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-end">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Control Desk</p>
            <h1 className="mt-4 font-[var(--font-fraunces)] text-[clamp(36px,4vw,56px)] font-medium leading-[0.98] tracking-[-0.03em] text-[#121d35]">
              Dashboard admin
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.8] text-[#4f5b77]">
              Prioritaskan booking yang butuh keputusan, dokumen yang perlu review,
              dan sekolah yang sedang aktif tanpa harus membuka banyak tabel kecil.
            </p>
          </div>

          <div className="rounded-[28px] border border-[#e2dde8] bg-[#f9f8fc] p-6 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">
              Fokus Hari Ini
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-2xl border border-[#ead7b0] bg-[#fff8ed] px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#9b6a1d]">
                  Booking Menunggu
                </p>
                <p className="mt-2 text-[14px] leading-6 text-[#5d6780]">
                  {summary.pending} booking masih membutuhkan persetujuan atau penolakan.
                </p>
              </div>
              <div className="rounded-2xl border border-[#d6dfef] bg-white px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#35557c]">
                  Dokumen Masuk
                </p>
                <p className="mt-2 text-[14px] leading-6 text-[#5d6780]">
                  {docsNeedReview.length} dokumen terbaru sedang menunggu review pertama.
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-[28px] border border-[#e2dde8] bg-white p-5 shadow-sm"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">
                {stat.label}
              </p>
              <p className={`mt-3 font-[var(--font-fraunces)] text-[38px] font-medium ${stat.accent}`}>
                {stat.value}
              </p>
              <p className="mt-2 text-[13px] leading-6 text-[#6d7998]">{stat.description}</p>
            </article>
          ))}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-[28px] border border-[#e2dde8] bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-[#ece6f1] px-6 py-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">
                  Antrian Prioritas
                </p>
                <h2 className="mt-2 font-[var(--font-fraunces)] text-[30px] font-medium text-[#121d35]">
                  Booking menunggu keputusan.
                </h2>
              </div>
              <Link
                href="/dashboard-admin/booking"
                className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#35557c] transition-colors hover:text-[#25365f]"
              >
                Buka Kelola Booking
              </Link>
            </div>

            {pendingBookings.length > 0 ? (
              <div className="divide-y divide-[#ece6f1]">
                {pendingBookings.map((booking) => (
                  <article key={booking.id} className="px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="max-w-3xl">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9aa6c4]">
                            {booking.id}
                          </span>
                          <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getStatusClasses(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <h3 className="mt-4 font-[var(--font-fraunces)] text-[28px] font-medium leading-[1.08] tracking-[-0.02em] text-[#121d35]">
                          {booking.topic}
                        </h3>
                        <p className="mt-2 text-[15px] leading-[1.75] text-[#4f5b77]">{booking.school}</p>
                        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-[13px] text-[#4f5b77]">
                          <div>
                            <span className="font-bold uppercase tracking-[0.14em] text-[#9aa6c4]">Tanggal</span>
                            <p className="mt-1 font-medium text-[#25365f]">{formatShortDateID(booking.dateISO)}</p>
                          </div>
                          <div>
                            <span className="font-bold uppercase tracking-[0.14em] text-[#9aa6c4]">Sesi</span>
                            <p className="mt-1 font-medium text-[#25365f]">{booking.session}</p>
                          </div>
                          <div>
                            <span className="font-bold uppercase tracking-[0.14em] text-[#9aa6c4]">Kategori</span>
                            <p className="mt-1 font-medium text-[#25365f]">{booking.category ?? "-"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex w-full flex-col gap-2 lg:w-[190px]">
                        <Link
                          href={`/dashboard-admin/booking/${booking.id}`}
                          className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md"
                        >
                          Review Booking
                        </Link>
                        <Link
                          href="/dashboard-admin/booking"
                          className="rounded-xl border border-[#d5dbea] bg-[#f9f8fc] px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.12em] text-[#4f5b77] transition-colors duration-300 hover:bg-[#eef1f8] hover:text-[#25365f]"
                        >
                          Lihat Antrian
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="px-6 py-12 text-center text-[14px] text-[#6d7998]">
                Tidak ada booking yang sedang menunggu keputusan admin.
              </div>
            )}
          </section>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[#e2dde8] bg-[#f9f8fc] p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">
                    Review Dokumen
                  </p>
                  <h2 className="mt-2 font-[var(--font-fraunces)] text-[26px] font-medium text-[#121d35]">
                    Masuk hari ini.
                  </h2>
                </div>
                <Link
                  href="/dashboard-admin/dokumen"
                  className="text-[12px] font-bold uppercase tracking-[0.08em] text-[#35557c] transition-colors hover:text-[#25365f]"
                >
                  Semua
                </Link>
              </div>

              <div className="mt-5 space-y-3">
                {docsNeedReview.length > 0 ? (
                  docsNeedReview.map((document) => (
                    <article key={document.id} className="rounded-2xl border border-[#e5dfeb] bg-white p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9aa6c4]">
                          {document.id}
                        </span>
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getReviewStatusClasses(document.reviewStatus ?? "")}`}>
                          {document.reviewStatus ?? "Menunggu Review"}
                        </span>
                      </div>
                      <p className="mt-3 text-[14px] font-semibold leading-6 text-[#25365f]">{document.fileName}</p>
                      <p className="mt-1 text-[12px] leading-6 text-[#6d7998]">
                        {document.stage} • {document.uploadedAt}
                      </p>
                    </article>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-[#d7deef] bg-white px-4 py-8 text-center text-[13px] text-[#6d7998]">
                    Semua dokumen terbaru sudah direview.
                  </div>
                )}
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
              <article className="rounded-[28px] border border-[#e2dde8] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Sesi Berjalan</p>
                <p className="mt-3 font-[var(--font-fraunces)] text-[34px] font-medium text-[#35557c]">
                  {summary.progress}
                </p>
              </article>
              <article className="rounded-[28px] border border-[#e2dde8] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Riwayat Selesai</p>
                <p className="mt-3 font-[var(--font-fraunces)] text-[34px] font-medium text-[#304878]">
                  {summary.completed}
                </p>
              </article>
              <article className="rounded-[28px] border border-[#e2dde8] bg-white p-5 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Total Arsip</p>
                <p className="mt-3 font-[var(--font-fraunces)] text-[34px] font-medium text-[#2f5a4b]">
                  {histories.length}
                </p>
              </article>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
