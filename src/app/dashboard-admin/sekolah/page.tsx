"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import { getSchoolDocumentsForAdmin } from "@/lib/userFlow";
import { Modal } from "@/components/ui/Modal";
import { formatShortDateID } from "@/lib/userDashboardData";

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

interface SchoolInfo {
  id: string;
  name: string;
  email?: string;
  npsn?: string;
  totalBookings: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalDocuments: number;
  totalHistories: number;
}

export default function AdminSekolahPage() {
  const { registeredSchools } = useAuth();
  const { bookings, documents, histories } = useDashboard();
  const [detailSchool, setDetailSchool] = useState<string | null>(null);

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
        totalBookings: schoolBookings.length,
        pendingBookings: schoolBookings.filter((b) => b.status === "Menunggu").length,
        activeBookings: schoolBookings.filter((b) => b.status === "Disetujui" || b.status === "Dalam Proses").length,
        completedBookings: schoolBookings.filter((b) => b.status === "Selesai").length,
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

  const detailSchoolData = detailSchool ? {
    info: schools.find((s) => s.id === detailSchool),
    registered: registeredSchools.find((s) => s.id === detailSchool),
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
  } : null;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#6d7998]">Dashboard Admin &rsaquo; Daftar Sekolah</p>
        <h2 className="mt-1 font-[family-name:var(--font-fraunces)] text-[22px] font-bold text-[#25365f]">
          Daftar Sekolah
        </h2>
        <p className="mt-1 text-[13px] leading-relaxed text-[#6d7998]">
          Pantau semua sekolah yang terdaftar dan aktivitas booking mereka.
        </p>
      </div>

      {/* School Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {schools.map((school) => (
          <div key={school.id} className="rounded-2xl border border-[#e1dce8] bg-white p-5 transition-shadow hover:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-[#25365f]">{school.name}</h3>
                <p className="mt-1 text-[12px] text-[#6d7998]">
                  {school.email ?? "Belum terdaftar"}
                  {school.npsn ? ` · NPSN ${school.npsn}` : ""}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f3f7]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a6baf" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4M9 9h.01M15 9h.01M9 13h.01M15 13h.01" />
                </svg>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#fffbeb] p-2.5 text-center">
                <p className="text-[18px] font-bold text-[#92400e]">{school.pendingBookings}</p>
                <p className="text-[10px] font-bold text-[#b45309]">Menunggu</p>
              </div>
              <div className="rounded-xl bg-[#ecfdf5] p-2.5 text-center">
                <p className="text-[18px] font-bold text-[#065f46]">{school.activeBookings}</p>
                <p className="text-[10px] font-bold text-[#047857]">Aktif</p>
              </div>
              <div className="rounded-xl bg-[#f5f3ff] p-2.5 text-center">
                <p className="text-[18px] font-bold text-[#5b21b6]">{school.completedBookings}</p>
                <p className="text-[10px] font-bold text-[#6d28d9]">Selesai</p>
              </div>
            </div>

            <button
              type="button"
                onClick={() => setDetailSchool(school.id)}
                className="mt-4 w-full rounded-xl border border-[#d8deeb] py-2.5 text-[12px] font-bold text-[#4a6baf] hover:bg-[#f5f3f7] transition-colors"
              >
                Lihat Detail
            </button>
          </div>
        ))}

        {schools.length === 0 && (
          <div className="col-span-full rounded-2xl border border-[#e1dce8] bg-white p-12 text-center">
            <p className="text-[13px] text-[#6d7998]">Belum ada sekolah terdaftar.</p>
          </div>
        )}
      </div>

      {/* School Detail Modal */}
      <Modal open={detailSchool !== null} onClose={() => setDetailSchool(null)} title={detailSchoolData?.info?.name ?? "Detail Sekolah"}>
        {detailSchoolData && (
          <div className="space-y-4">
            {/* Registered info */}
            {detailSchoolData.registered && (
              <div className="rounded-xl bg-[#f5f3f7] p-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#6d7998]">Info Akun</p>
                <p className="text-[12px] text-[#4f5b77]">Email: <strong className="text-[#25365f]">{detailSchoolData.registered.email}</strong></p>
                <p className="text-[12px] text-[#4f5b77]">NPSN: <strong className="text-[#25365f]">{detailSchoolData.registered.npsn}</strong></p>
                <p className="text-[12px] text-[#4f5b77]">PJ: <strong className="text-[#25365f]">{detailSchoolData.registered.contactName}</strong></p>
                <p className="text-[12px] text-[#4f5b77]">Telepon: <strong className="text-[#25365f]">{detailSchoolData.registered.phone}</strong></p>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-[#f5f3f7] p-3 text-center">
                <p className="text-[18px] font-bold text-[#25365f]">{detailSchoolData.info?.totalBookings ?? 0}</p>
                <p className="text-[10px] font-bold text-[#6d7998]">Booking</p>
              </div>
              <div className="rounded-xl bg-[#f5f3f7] p-3 text-center">
                <p className="text-[18px] font-bold text-[#25365f]">{detailSchoolData.info?.totalDocuments ?? 0}</p>
                <p className="text-[10px] font-bold text-[#6d7998]">Dokumen</p>
              </div>
              <div className="rounded-xl bg-[#f5f3f7] p-3 text-center">
                <p className="text-[18px] font-bold text-[#25365f]">{detailSchoolData.info?.totalHistories ?? 0}</p>
                <p className="text-[10px] font-bold text-[#6d7998]">Riwayat</p>
              </div>
            </div>

            {/* Bookings */}
            <div>
              <h4 className="text-[13px] font-bold text-[#25365f] mb-2">Riwayat Booking</h4>
              <div className="max-h-[280px] space-y-2 overflow-y-auto">
                {detailSchoolData.bookings.length > 0 ? detailSchoolData.bookings.map((b) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl bg-[#faf9fc] p-3">
                    <div>
                      <p className="text-[12px] font-semibold text-[#25365f]">{b.topic}</p>
                      <p className="text-[11px] text-[#6d7998]">{b.id} &bull; {formatShortDateID(b.dateISO)} &bull; {b.category ?? "-"}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${getStatusClasses(b.status)}`}>{b.status}</span>
                  </div>
                )) : (
                  <p className="text-[12px] text-[#6d7998]">Belum ada booking.</p>
                )}
              </div>
            </div>

            {/* Histories */}
            {detailSchoolData.histories.length > 0 && (
              <div>
                <h4 className="text-[13px] font-bold text-[#25365f] mb-2">Riwayat Sesi</h4>
                <div className="max-h-[200px] space-y-2 overflow-y-auto">
                  {detailSchoolData.histories.map((h) => (
                    <div key={h.id} className="rounded-xl bg-[#faf9fc] p-3">
                      <p className="text-[12px] font-semibold text-[#25365f]">{h.title}</p>
                      <p className="text-[11px] text-[#6d7998]">{h.id} &bull; {formatShortDateID(h.dateISO)} &bull; {h.status}</p>
                      {h.supervisorNotes && <p className="mt-1 text-[11px] text-[#4a6baf]">Catatan: {h.supervisorNotes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {detailSchoolData.documents.length > 0 && (
              <div>
                <h4 className="text-[13px] font-bold text-[#25365f] mb-2">Dokumen Sekolah</h4>
                <div className="max-h-[220px] space-y-2 overflow-y-auto">
                  {detailSchoolData.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between rounded-xl bg-[#faf9fc] p-3">
                      <div>
                        <p className="text-[12px] font-semibold text-[#25365f]">{document.fileName}</p>
                        <p className="text-[11px] text-[#6d7998]">{document.id} &bull; {document.stage} &bull; {document.uploadedAt}</p>
                      </div>
                      <span className="rounded-full bg-[#eef1f8] px-3 py-1 text-[10px] font-bold text-[#4f5b77]">
                        {document.reviewStatus ?? "Menunggu Review"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
