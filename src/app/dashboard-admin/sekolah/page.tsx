"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { openBookingPrintReport } from "@/lib/bookingPrint";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import { getSchoolDocumentsForAdmin } from "@/lib/userFlow";
import { formatShortDateID } from "@/lib/userDashboardData";

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

function getApprovalStatusClasses(status: string) {
  switch (status) {
    case "approved":
      return "bg-[#e8f3ee] text-[#2b5f52]";
    case "rejected":
      return "bg-[#fdf0ef] text-[#9b4b45]";
    default:
      return "bg-[#fff6e6] text-[#9b6a1d]";
  }
}

interface SchoolInfo {
  id: string;
  name: string;
  email?: string;
  npsn?: string;
  approvalStatus: string;
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalDocuments: number;
  totalHistories: number;
}

export default function AdminSekolahPage() {
  const { registeredSchools, updateSchoolApprovalStatus } = useAuth();
  const { bookings, documents, histories, addToast } = useDashboard();
  const [detailSchool, setDetailSchool] = useState<string | null>(null);
  const [approvalActionKey, setApprovalActionKey] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<SchoolInfo | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const schools = useMemo<SchoolInfo[]>(() => {
    const registeredById = new Map(registeredSchools.map((school) => [school.id, school]));
    const idByName = new Map(registeredSchools.map((school) => [school.schoolName, school.id]));
    const schoolMap = new Map<string, { id: string; name: string }>();

    for (const school of registeredSchools) {
      schoolMap.set(school.id, { id: school.id, name: school.schoolName });
    }

    for (const booking of bookings) {
      const resolvedId = booking.schoolId ?? idByName.get(booking.school) ?? `legacy:${booking.school}`;
      if (!schoolMap.has(resolvedId)) {
        schoolMap.set(resolvedId, { id: resolvedId, name: booking.school });
      }
    }

    return [...schoolMap.values()].map((school) => {
      const registered = registeredById.get(school.id);
      const schoolBookings = bookings.filter((booking) => {
        if (booking.schoolId) {
          return booking.schoolId === school.id;
        }
        return booking.school === school.name;
      });
      const schoolDocuments = getSchoolDocumentsForAdmin({
        schoolId: school.id,
        schoolName: school.name,
        bookings,
        documents,
        histories,
      });

      return {
        id: school.id,
        name: school.name,
        email: registered?.email,
        npsn: registered?.npsn,
        approvalStatus: registered?.approvalStatus ?? "approved",
        totalBookings: schoolBookings.length,
        pendingBookings: schoolBookings.filter((booking) => booking.status === "Menunggu").length,
        activeBookings: schoolBookings.filter((booking) => booking.status === "Disetujui" || booking.status === "Dalam Proses").length,
        completedBookings: schoolBookings.filter((booking) => booking.status === "Selesai").length,
        totalDocuments: schoolDocuments.length,
        totalHistories: histories.filter((history) => {
          if (history.schoolId) {
            return history.schoolId === school.id;
          }
          return history.school === school.name;
        }).length,
      };
    });
  }, [registeredSchools, bookings, documents, histories]);

  const detailSchoolData = detailSchool
    ? {
        info: schools.find((school) => school.id === detailSchool),
        registered: registeredSchools.find((school) => school.id === detailSchool),
        bookings: bookings.filter((booking) => {
          if (booking.schoolId) {
            return booking.schoolId === detailSchool;
          }
          const school = schools.find((item) => item.id === detailSchool);
          return booking.school === school?.name;
        }),
        histories: histories.filter((history) => {
          if (history.schoolId) {
            return history.schoolId === detailSchool;
          }
          const school = schools.find((item) => item.id === detailSchool);
          return history.school === school?.name;
        }),
        documents: (() => {
          const school = schools.find((item) => item.id === detailSchool);
          if (!school) return [];

          return getSchoolDocumentsForAdmin({
            schoolId: school.id,
            schoolName: school.name,
            bookings,
            documents,
            histories,
          });
        })(),
      }
    : null;

  const summaryCards = [
    {
      label: "Total Sekolah",
      value: schools.length,
      accent: "text-[#25365f]",
      description: "Akun sekolah dan entitas legacy yang terdeteksi.",
    },
    {
      label: "Menunggu Verifikasi",
      value: schools.filter((school) => school.approvalStatus === "pending").length,
      accent: "text-[#9b6a1d]",
      description: "Akun sekolah baru yang belum diaktifkan.",
    },
    {
      label: "Sedang Aktif",
      value: schools.filter((school) => school.activeBookings > 0).length,
      accent: "text-[#35557c]",
      description: "Sekolah dengan sesi berjalan atau sudah disetujui.",
    },
    {
      label: "Arsip Tercatat",
      value: schools.reduce((total, school) => total + school.totalDocuments, 0),
      accent: "text-[#2f5a4b]",
      description: "Dokumen yang sudah masuk ke sistem.",
    },
  ];

  const runApprovalAction = async (schoolId: string, status: "approved" | "rejected", reason?: string) => {
    setApprovalActionKey(`${schoolId}:${status}`);
    setFeedback(null);
    const result = await updateSchoolApprovalStatus(schoolId, status, reason);
    if (result.success) {
      setFeedback(
        status === "approved"
          ? "Akun sekolah berhasil diaktifkan."
          : "Akun sekolah ditandai ditolak.",
      );
    } else {
      setFeedback(result.error ?? "Gagal memperbarui status akun sekolah.");
    }
    setApprovalActionKey(null);
  };

  const confirmReject = async () => {
    if (!rejectTarget) {
      return;
    }
    if (!rejectReason.trim()) {
      setFeedback("Alasan penolakan wajib diisi.");
      return;
    }
    await runApprovalAction(rejectTarget.id, "rejected", rejectReason.trim());
    setRejectTarget(null);
    setRejectReason("");
  };

  const openBookingReport = (bookingId: string) => {
    const booking = bookings.find((item) => item.id === bookingId);
    if (!booking) {
      addToast("Booking tidak ditemukan untuk dicetak.", "error");
      return;
    }

    const opened = openBookingPrintReport({
      booking,
      documents: documents.filter((document) => document.bookingId === bookingId),
      history: histories.find((history) => history.bookingId === bookingId) ?? null,
    });

    if (!opened) {
      addToast("Popup cetak diblokir browser. Izinkan popup lalu coba lagi.", "error");
    }
  };

  return (
    <div className="space-y-6 text-[#25365f]">
      <header className="space-y-2">
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6d7998]">
          Dashboard Admin &rsaquo; Daftar Sekolah
        </p>
        <h2 className="font-[family-name:var(--font-fraunces)] text-[24px] font-bold text-[#25365f]">
          Daftar Sekolah
        </h2>
        <p className="max-w-[700px] text-[14px] leading-7 text-[#5d6780]">
          Pantau sekolah yang aktif, lihat beban antrean mereka, dan buka detail
          aktivitas tanpa harus menggali data dari banyak tabel.
        </p>
      </header>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <article
            key={card.label}
            className="rounded-[24px] border border-[#e2dde8] bg-white px-5 py-4 shadow-[0_18px_40px_-32px_rgba(37,54,95,0.4)]"
          >
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#7b879f]">
              {card.label}
            </p>
            <p className={`mt-3 font-[var(--font-fraunces)] text-[34px] font-medium leading-none ${card.accent}`}>
              {card.value}
            </p>
            <p className="mt-2 text-[13px] leading-6 text-[#6d7998]">{card.description}</p>
          </article>
        ))}
      </section>

      {feedback ? (
        <div className="rounded-2xl border border-[#d7deef] bg-white px-4 py-3 text-[13px] leading-6 text-[#40506e]">
          {feedback}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {schools.map((school) => (
          <article
            key={school.id}
            className="rounded-[28px] border border-[#e2dde8] bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9aa6c4]">
                    {school.npsn ? `NPSN ${school.npsn}` : "Profil Sekolah"}
                  </p>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${getApprovalStatusClasses(school.approvalStatus)}`}>
                    {school.approvalStatus === "approved"
                      ? "Aktif"
                      : school.approvalStatus === "rejected"
                        ? "Ditolak"
                        : "Pending"}
                  </span>
                </div>
                <h3 className="mt-3 font-[var(--font-fraunces)] text-[26px] font-medium leading-[1.08] text-[#121d35]">
                  {school.name}
                </h3>
                <p className="mt-2 text-[13px] leading-6 text-[#6d7998]">
                  Login sekolah memakai NPSN dan password.
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f3f2f8] text-[#35557c]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
                </svg>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-[#fff8ed] p-3 text-center">
                <p className="font-[var(--font-fraunces)] text-[26px] font-medium text-[#9b6a1d]">
                  {school.pendingBookings}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9b6a1d]">
                  Menunggu
                </p>
              </div>
              <div className="rounded-2xl bg-[#eef4fb] p-3 text-center">
                <p className="font-[var(--font-fraunces)] text-[26px] font-medium text-[#35557c]">
                  {school.activeBookings}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#35557c]">
                  Aktif
                </p>
              </div>
              <div className="rounded-2xl bg-[#edf3ef] p-3 text-center">
                <p className="font-[var(--font-fraunces)] text-[26px] font-medium text-[#2f5a4b]">
                  {school.completedBookings}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2f5a4b]">
                  Selesai
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-[#ece6f1] bg-[#faf9fc] p-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa6c4]">Booking</p>
                <p className="mt-2 text-[14px] font-semibold text-[#25365f]">{school.totalBookings}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa6c4]">Dokumen</p>
                <p className="mt-2 text-[14px] font-semibold text-[#25365f]">{school.totalDocuments}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa6c4]">Riwayat</p>
                <p className="mt-2 text-[14px] font-semibold text-[#25365f]">{school.totalHistories}</p>
              </div>
            </div>

            {school.approvalStatus === "pending" ? (
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    void runApprovalAction(school.id, "approved");
                  }}
                  disabled={approvalActionKey !== null}
                  className="rounded-2xl border border-[#d08b17] bg-[#ff9409] py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#ea8608] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approvalActionKey === `${school.id}:approved` ? "Memproses..." : "Setujui Akun"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRejectTarget(school);
                    setRejectReason("");
                  }}
                  disabled={approvalActionKey !== null}
                  className="rounded-2xl border border-[#d9c5c3] bg-[#fff6f5] py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#9b4b45] transition-colors hover:bg-[#fdeeed] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {approvalActionKey === `${school.id}:rejected` ? "Memproses..." : "Tolak Akun"}
                </button>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setDetailSchool(school.id)}
              className="mt-5 w-full rounded-2xl border border-[#d5dbea] bg-[#f9f8fc] py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] transition-colors hover:bg-[#eef1f8] hover:text-[#25365f]"
            >
              Lihat Detail Sekolah
            </button>
          </article>
        ))}

        {schools.length === 0 ? (
          <div className="col-span-full rounded-[28px] border border-[#e2dde8] bg-white p-12 text-center text-[14px] text-[#6d7998]">
            Belum ada sekolah terdaftar.
          </div>
        ) : null}
      </section>

      <Modal
        open={detailSchool !== null}
        onClose={() => setDetailSchool(null)}
        title={detailSchoolData?.info?.name ?? "Detail Sekolah"}
      >
        {detailSchoolData ? (
          <div className="space-y-4 text-[#25365f]">
            {detailSchoolData.registered ? (
              <section className="rounded-2xl border border-[#ece6f1] bg-[#f8f7fb] p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#7b879f]">Info Akun</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <p className="text-[13px] leading-6 text-[#5d6780]">
                    Status Akun
                    <span className="mt-1 block">
                      <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] ${getApprovalStatusClasses(detailSchoolData.registered.approvalStatus)}`}>
                        {detailSchoolData.registered.approvalStatus === "approved"
                          ? "Aktif"
                          : detailSchoolData.registered.approvalStatus === "rejected"
                            ? "Ditolak"
                            : "Pending"}
                      </span>
                    </span>
                  </p>
                  <p className="text-[13px] leading-6 text-[#5d6780]">
                    Akses Login
                    <span className="mt-1 block font-semibold text-[#25365f]">NPSN sekolah + password</span>
                  </p>
                  <p className="text-[13px] leading-6 text-[#5d6780]">
                    Direview
                    <span className="mt-1 block font-semibold text-[#25365f]">
                      {detailSchoolData.registered.approvalReviewedAt
                        ? new Intl.DateTimeFormat("id-ID", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(detailSchoolData.registered.approvalReviewedAt))
                        : "Belum direview"}
                    </span>
                  </p>
                  <p className="text-[13px] leading-6 text-[#5d6780]">
                    Reviewer
                    <span className="mt-1 block font-semibold text-[#25365f]">{detailSchoolData.registered.approvalReviewedBy ?? "-"}</span>
                  </p>
                  <p className="text-[13px] leading-6 text-[#5d6780]">
                    NPSN
                    <span className="mt-1 block font-semibold text-[#25365f]">{detailSchoolData.registered.npsn ?? "-"}</span>
                  </p>
                  <p className="text-[13px] leading-6 text-[#5d6780]">
                    Penanggung Jawab
                    <span className="mt-1 block font-semibold text-[#25365f]">{detailSchoolData.registered.contactName}</span>
                  </p>
                  <p className="text-[13px] leading-6 text-[#5d6780]">
                    Telepon
                    <span className="mt-1 block font-semibold text-[#25365f]">{detailSchoolData.registered.phone}</span>
                  </p>
                </div>
                {detailSchoolData.registered.approvalRejectionReason ? (
                  <div className="mt-4 rounded-2xl border border-[#ead1cf] bg-[#fff6f5] p-3 text-[13px] leading-6 text-[#9b4b45]">
                    <span className="font-bold">Alasan penolakan: </span>
                    {detailSchoolData.registered.approvalRejectionReason}
                  </div>
                ) : null}
              </section>
            ) : null}

            <section className="grid grid-cols-3 gap-3">
              <article className="rounded-2xl border border-[#ece6f1] bg-white p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa6c4]">Booking</p>
                <p className="mt-2 font-[var(--font-fraunces)] text-[30px] font-medium text-[#25365f]">
                  {detailSchoolData.info?.totalBookings ?? 0}
                </p>
              </article>
              <article className="rounded-2xl border border-[#ece6f1] bg-white p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa6c4]">Dokumen</p>
                <p className="mt-2 font-[var(--font-fraunces)] text-[30px] font-medium text-[#25365f]">
                  {detailSchoolData.info?.totalDocuments ?? 0}
                </p>
              </article>
              <article className="rounded-2xl border border-[#ece6f1] bg-white p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9aa6c4]">Riwayat</p>
                <p className="mt-2 font-[var(--font-fraunces)] text-[30px] font-medium text-[#25365f]">
                  {detailSchoolData.info?.totalHistories ?? 0}
                </p>
              </article>
            </section>

            <section>
              <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7b879f]">
                Aktivitas Booking
              </h4>
              <div className="mt-3 max-h-[260px] space-y-2 overflow-y-auto">
                {detailSchoolData.bookings.length > 0 ? (
                  detailSchoolData.bookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between rounded-2xl border border-[#ece6f1] bg-[#faf9fc] p-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#25365f]">{booking.topic}</p>
                        <p className="text-[12px] leading-6 text-[#6d7998]">
                          {booking.id} • {formatShortDateID(booking.dateISO)} • {booking.category ?? "-"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${getStatusClasses(booking.status)}`}>
                          {booking.status}
                        </span>
                        <Link
                          href={`/dashboard-admin/booking/${booking.id}`}
                          className="rounded-xl border border-[#d8deeb] bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] hover:bg-[#eef1f8]"
                        >
                          Detail
                        </Link>
                        <button
                          type="button"
                          onClick={() => openBookingReport(booking.id)}
                          className="rounded-xl border border-[#ffb660] bg-[#fff3e2] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#d96f05] hover:bg-[#ffe7c9]"
                        >
                          Cetak
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-[13px] text-[#6d7998]">Belum ada booking.</p>
                )}
              </div>
            </section>

            {detailSchoolData.histories.length > 0 ? (
              <section>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7b879f]">
                  Riwayat Sesi
                </h4>
                <div className="mt-3 max-h-[220px] space-y-2 overflow-y-auto">
                  {detailSchoolData.histories.map((history) => (
                    <div key={history.id} className="rounded-2xl border border-[#ece6f1] bg-[#faf9fc] p-3">
                      <p className="text-[13px] font-semibold text-[#25365f]">{history.title}</p>
                      <p className="mt-1 text-[12px] leading-6 text-[#6d7998]">
                        {history.id} • {formatShortDateID(history.dateISO)} • {history.status}
                      </p>
                      {history.bookingId ? (
                        <div className="mt-2 flex gap-2">
                          <Link
                            href={`/dashboard-admin/booking/${history.bookingId}`}
                            className="rounded-xl border border-[#d8deeb] bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] hover:bg-[#eef1f8]"
                          >
                            Buka Booking
                          </Link>
                          <button
                            type="button"
                            onClick={() => openBookingReport(history.bookingId!)}
                            className="rounded-xl border border-[#ffb660] bg-[#fff3e2] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#d96f05] hover:bg-[#ffe7c9]"
                          >
                            Cetak Laporan
                          </button>
                        </div>
                      ) : null}
                      {history.supervisorNotes ? (
                        <p className="mt-2 text-[12px] leading-6 text-[#35557c]">
                          Catatan: {history.supervisorNotes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {detailSchoolData.documents.length > 0 ? (
              <section>
                <h4 className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#7b879f]">
                  Dokumen Sekolah
                </h4>
                <div className="mt-3 max-h-[240px] space-y-2 overflow-y-auto">
                  {detailSchoolData.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between rounded-2xl border border-[#ece6f1] bg-[#faf9fc] p-3">
                      <div>
                        <p className="text-[13px] font-semibold text-[#25365f]">{document.fileName}</p>
                        <p className="mt-1 text-[12px] leading-6 text-[#6d7998]">
                          {document.id} • {document.stage} • {document.uploadedAt}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-[#eef1f8] px-3 py-1 text-[10px] font-bold text-[#4f5b77]">
                          {document.reviewStatus ?? "Menunggu Review"}
                        </span>
                        <Link
                          href={`/dashboard-admin/detail-dokumen?documentId=${encodeURIComponent(document.id)}`}
                          className="rounded-xl border border-[#d8deeb] bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] hover:bg-[#eef1f8]"
                        >
                          Buka
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={rejectTarget !== null}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason("");
        }}
        title="Tolak Akun Sekolah"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setRejectTarget(null);
                setRejectReason("");
              }}
              className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => void confirmReject()}
              disabled={!rejectReason.trim() || approvalActionKey !== null}
              className="rounded-xl border border-[#d9c5c3] bg-[#b85b52] px-4 py-2.5 text-[12px] font-bold uppercase text-white hover:bg-[#9b4b45] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {approvalActionKey === `${rejectTarget?.id}:rejected` ? "Memproses..." : "Konfirmasi Tolak"}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-[14px] leading-6 text-[#5d6780]">
            Tuliskan alasan penolakan untuk <strong className="text-[#25365f]">{rejectTarget?.name}</strong>.
            Catatan ini disimpan sebagai audit internal.
          </p>
          <textarea
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            rows={4}
            placeholder="Contoh: NPSN tidak sesuai data sekolah."
            className="w-full rounded-2xl border border-[#d7deef] bg-white px-4 py-3 text-[14px] text-[#25365f] outline-none focus:border-[#b7c4df]"
          />
        </div>
      </Modal>
    </div>
  );
}
