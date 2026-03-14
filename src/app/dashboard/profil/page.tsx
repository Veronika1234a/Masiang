"use client";

import { useMemo, useState } from "react";
import { useDashboard } from "@/lib/DashboardContext";
import { getBookingSummary, type SchoolProfile } from "@/lib/userDashboardData";

const profileSections: Array<{
  title: string;
  description: string;
  fields: Array<{ key: keyof SchoolProfile; label: string; multiline?: boolean }>;
}> = [
  {
    title: "Identitas Utama",
    description: "Informasi dasar yang menjadi penanda sekolah pada sistem.",
    fields: [
      { key: "schoolName", label: "Nama Sekolah" },
      { key: "npsn", label: "NPSN" },
      { key: "educationLevel", label: "Jenjang" },
      { key: "district", label: "Wilayah" },
    ],
  },
  {
    title: "Kontak dan Operasional",
    description: "Data yang dipakai untuk komunikasi dan koordinasi pendampingan.",
    fields: [
      { key: "officialEmail", label: "Email Resmi" },
      { key: "phone", label: "Nomor Telepon" },
      { key: "principalName", label: "Kepala Sekolah" },
      { key: "operatorName", label: "Operator" },
      { key: "address", label: "Alamat", multiline: true },
    ],
  },
];

function StatCard({ label, value, tone }: { label: string; value: number; tone: "default" | "gold" | "cyan" }) {
  const cls = tone === "gold" ? "bg-[#fff7e8] border-[#f1d9a8]" : tone === "cyan" ? "bg-[#eef8f8] border-[#cfe8ea]" : "bg-white border-[#dde3f0]";
  return (
    <article className={`rounded-2xl border p-4 ${cls}`}>
      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">{label}</p>
      <p className="mt-3 font-[var(--font-fraunces)] text-[34px] font-medium text-[#121d35]">{value}</p>
    </article>
  );
}

export default function DashboardProfilPage() {
  const { profile, updateProfile, bookings, histories, documents } = useDashboard();
  const [draft, setDraft] = useState<SchoolProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [npsnError, setNpsnError] = useState("");

  const [showPasswordInfo, setShowPasswordInfo] = useState(false);

  const bookingSummary = useMemo(() => getBookingSummary(bookings), [bookings]);
  const currentProfile = isEditing ? draft : profile;
  const schoolInitials = profile.schoolName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

  const saveChanges = async () => {
    if (!/^\d{8}$/.test(draft.npsn)) {
      setNpsnError("NPSN harus 8 digit angka.");
      return;
    }
    setNpsnError("");
    try {
      await updateProfile(draft);
      setIsEditing(false);
    } catch {
      // Error toast is handled in context.
    }
  };

  const cancelChanges = () => { setDraft(profile); setIsEditing(false); setNpsnError(""); };

  return (
    <main className="w-full pb-10 text-[#121d35]">
      <div className="mx-auto flex max-w-[1140px] flex-col gap-8">
        <nav className="mb-6 text-[12px] font-bold text-[#6d7998]">
          <span className="text-[#25365f]">Profil</span>
        </nav>
        <header className="flex flex-col gap-5 border-b border-[#e1dce8] pb-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Profil Sekolah</p>
            <h1 className="mt-3 font-[family-name:var(--font-fraunces)] text-[clamp(24px,3vw,36px)] font-bold leading-[1.15] text-[#121d35]">
              Identitas &amp; Data Sekolah
            </h1>
            <p className="mt-3 max-w-xl text-[14px] leading-[1.7] text-[#4f5b77]">
              Identitas sekolah, kontak operasional, dan statistik pendampingan.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <button type="button" onClick={cancelChanges} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Batal</button>
                <button type="button" onClick={saveChanges} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-[12px] font-bold uppercase text-white hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md transition-all">Simpan Profil</button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setDraft(profile); setIsEditing(true); }} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-[12px] font-bold uppercase text-white hover:-translate-y-0.5 hover:bg-[#b8933d] hover:shadow-md transition-all">Edit Profil</button>
                <button type="button" onClick={() => setShowPasswordInfo(!showPasswordInfo)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Info Password</button>
              </>
            )}
          </div>
        </header>

        {/* Password Section */}
        {showPasswordInfo && !isEditing && (
          <section className="rounded-2xl border border-[#e1dce8] bg-[#f9f8fc] p-6 shadow-sm">
            <h2 className="text-[14px] font-bold text-[#2d3e67] mb-4">Informasi Password</h2>
            <div className="max-w-2xl rounded-2xl border border-[#d8deeb] bg-white p-5 text-[14px] leading-[1.75] text-[#4f5b77]">
              Perubahan password belum tersedia langsung dari dashboard ini. Saat fitur reset password sudah tersedia, alurnya akan ditampilkan di sini. Untuk sementara, gunakan akun ini dengan hati-hati dan hubungi pengelola sistem bila perlu bantuan akses.
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowPasswordInfo(false)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Tutup</button>
            </div>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="overflow-hidden rounded-[32px] border border-[#e2dde8] bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="border-b border-[#ece6f1] bg-[linear-gradient(180deg,#f9f8fc_0%,#f4f1f7_100%)] p-6 lg:border-b-0 lg:border-r">
                <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#eef4ff] font-[var(--font-fraunces)] text-[28px] text-[#304878]">{schoolInitials}</div>
                <h2 className="mt-5 font-[var(--font-fraunces)] text-[30px] font-medium leading-[1.05] text-[#121d35]">{profile.schoolName}</h2>
                <p className="mt-3 text-[14px] leading-[1.75] text-[#4f5b77]">Data profil dipakai pada booking, dokumen, dan komunikasi.</p>
                <div className="mt-6 space-y-3 border-t border-[#e5dfeb] pt-5">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Wilayah</p><p className="mt-1 text-[14px] font-medium text-[#25365f]">{profile.district}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Jenjang</p><p className="mt-1 text-[14px] font-medium text-[#25365f]">{profile.educationLevel}</p></div>
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">NPSN</p><p className="mt-1 text-[14px] font-medium text-[#25365f]">{profile.npsn}</p></div>
                </div>
              </div>

              <div className="p-6 md:p-7">
                <div className="grid gap-6">
                  {profileSections.map((section) => (
                    <section key={section.title}>
                      <div className="mb-5 border-b border-[#ece6f1] pb-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">{section.title}</p>
                        <p className="mt-2 text-[14px] leading-[1.7] text-[#4f5b77]">{section.description}</p>
                      </div>
                      <div className="grid gap-4">
                        {section.fields.map((field) => (
                          <div key={field.key} className="grid gap-2 md:grid-cols-[190px_minmax(0,1fr)] md:items-start">
                            <span className="pt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d7998]">{field.label}</span>
                            {isEditing ? (
                              <>
                                {field.multiline ? (
                                  <textarea rows={4} value={draft[field.key]} onChange={(e) => setDraft((c) => ({ ...c, [field.key]: e.target.value }))} className="rounded-2xl border border-[#d8deeb] bg-[#fcfbfd] px-4 py-3 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
                                ) : (
                                  <input type="text" value={draft[field.key]} onChange={(e) => { setDraft((c) => ({ ...c, [field.key]: e.target.value })); if (field.key === "npsn") setNpsnError(""); }} className="min-h-12 rounded-2xl border border-[#d8deeb] bg-[#fcfbfd] px-4 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
                                )}
                                {field.key === "npsn" && npsnError && <small className="text-[12px] font-bold text-[#a13636]">{npsnError}</small>}
                              </>
                            ) : (
                              <div className="rounded-2xl border border-[#ece6f1] bg-[#fcfbfd] px-4 py-3 text-[15px] leading-[1.75] text-[#25365f]">{currentProfile[field.key]}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              </div>
            </div>
          </article>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[28px] border border-[#e2dde8] bg-[#f9f8fc] p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Statistik Pendampingan</p>
              <div className="mt-4 space-y-3">
                <StatCard label="Total Booking" value={bookingSummary.total} tone="default" />
                <StatCard label="Riwayat Arsip" value={histories.length} tone="cyan" />
                <StatCard label="Dokumen Tersimpan" value={documents.length} tone="gold" />
              </div>
            </section>
            <section className="rounded-[28px] border border-[#e2dde8] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Catatan</p>
              <div className="mt-4 space-y-3 text-[14px] leading-[1.75] text-[#4f5b77]">
                <p>Pastikan email resmi dan nomor telepon selalu terbarui agar notifikasi booking tidak terlewat.</p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
