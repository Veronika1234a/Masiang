"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import { formatShortDateID, getBookingSummary } from "@/lib/userDashboardData";

function getStatusClasses(status: string) {
  switch (status) {
    case "Menunggu": return "bg-[#fef3c7] text-[#92400e]";
    case "Disetujui": return "bg-[#d1fae5] text-[#065f46]";
    case "Dalam Proses": return "bg-[#dbeafe] text-[#1e40af]";
    case "Selesai": return "bg-[#e8e0f0] text-[#5b21b6]";
    case "Ditolak": return "bg-[#fee2e2] text-[#991b1b]";
    case "Dibatalkan": return "bg-[#f3f4f6] text-[#6b7280]";
    default: return "bg-[#f3f4f6] text-[#6b7280]";
  }
}

function getReviewStatusClasses(status: string) {
  switch (status) {
    case "Disetujui": return "bg-[#d1fae5] text-[#065f46]";
    case "Perlu Revisi": return "bg-[#fef3c7] text-[#92400e]";
    default: return "bg-[#dbeafe] text-[#1e40af]";
  }
}

export default function AdminDashboardPage() {
  const { bookings, documents, histories } = useDashboard();
  const { registeredSchools } = useAuth();
  const summary = getBookingSummary(bookings);

  const pendingBookings = bookings.filter((b) => b.status === "Menunggu").slice(0, 5);
  const docsNeedReview = documents.filter((d) => d.reviewStatus === "Menunggu Review").slice(0, 5);

  const stats = [
    { label: "Booking Baru", value: summary.pending, color: "text-[#92400e]", bg: "bg-[#fffbeb]" },
    { label: "Booking Disetujui", value: summary.approved, color: "text-[#065f46]", bg: "bg-[#ecfdf5]" },
    { label: "Total Dokumen", value: documents.length, color: "text-[#1e40af]", bg: "bg-[#eff6ff]" },
    { label: "Total Sekolah", value: registeredSchools.length, color: "text-[#5b21b6]", bg: "bg-[#f5f3ff]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6d7998]">Dashboard Admin</p>
        <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-[22px] font-bold text-[#25365f]">
          Selamat Datang, Admin
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#6d7998]">
          Ringkasan aktivitas sekolah yang mengajukan booking dan mengunggah dokumen.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border border-[#e1dce8] ${s.bg} p-5`}>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d7998]">{s.label}</p>
            <p className={`mt-2 font-[family-name:var(--font-fraunces)] text-[28px] font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Booking Menunggu */}
      <div className="rounded-2xl border border-[#e1dce8] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#25365f]">Booking Menunggu Persetujuan</h3>
          <Link href="/dashboard-admin/booking" className="text-[12px] font-bold text-[#4a6baf] hover:text-[#25365f]">
            Lihat Semua
          </Link>
        </div>
        {pendingBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e1dce8]">
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">ID</th>
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">Sekolah</th>
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">Topik</th>
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">Kategori</th>
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">Tanggal</th>
                  <th className="pb-3 font-bold text-[#6d7998]">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.map((b) => (
                  <tr key={b.id} className="border-b border-[#f3f1f5] last:border-0">
                    <td className="py-3 pr-4 font-semibold text-[#4a6baf]">{b.id}</td>
                    <td className="py-3 pr-4 text-[#4f5b77]">{b.school}</td>
                    <td className="py-3 pr-4 text-[#4f5b77]">{b.topic}</td>
                    <td className="py-3 pr-4 text-[#6d7998]">{b.category ?? "-"}</td>
                    <td className="py-3 pr-4 text-[#6d7998]">{formatShortDateID(b.dateISO)}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${getStatusClasses(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-[13px] text-[#6d7998] py-8">Tidak ada booking yang menunggu persetujuan.</p>
        )}
      </div>

      {/* Dokumen Perlu Review */}
      <div className="rounded-2xl border border-[#e1dce8] bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[15px] font-bold text-[#25365f]">Dokumen Perlu Review</h3>
          <Link href="/dashboard-admin/dokumen" className="text-[12px] font-bold text-[#4a6baf] hover:text-[#25365f]">
            Lihat Semua
          </Link>
        </div>
        {docsNeedReview.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e1dce8]">
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">ID</th>
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">Nama File</th>
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">Tahap</th>
                  <th className="pb-3 pr-4 font-bold text-[#6d7998]">Tanggal Upload</th>
                  <th className="pb-3 font-bold text-[#6d7998]">Status</th>
                </tr>
              </thead>
              <tbody>
                {docsNeedReview.map((d) => (
                  <tr key={d.id} className="border-b border-[#f3f1f5] last:border-0">
                    <td className="py-3 pr-4 font-semibold text-[#4a6baf]">{d.id}</td>
                    <td className="py-3 pr-4 text-[#4f5b77]">{d.fileName}</td>
                    <td className="py-3 pr-4 text-[#6d7998]">{d.stage}</td>
                    <td className="py-3 pr-4 text-[#6d7998]">{d.uploadedAt}</td>
                    <td className="py-3">
                      <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${getReviewStatusClasses(d.reviewStatus ?? "")}`}>
                        {d.reviewStatus ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-[13px] text-[#6d7998] py-8">Semua dokumen sudah di-review.</p>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d7998]">Sesi Berjalan</p>
          <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[24px] font-bold text-[#1e40af]">{summary.progress}</p>
        </div>
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d7998]">Total Selesai</p>
          <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[24px] font-bold text-[#5b21b6]">{summary.completed}</p>
        </div>
        <div className="rounded-2xl border border-[#e1dce8] bg-white p-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#6d7998]">Total Riwayat</p>
          <p className="mt-2 font-[family-name:var(--font-fraunces)] text-[24px] font-bold text-[#065f46]">{histories.length}</p>
        </div>
      </div>
    </div>
  );
}
