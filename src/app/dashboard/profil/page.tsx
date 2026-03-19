"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useDashboard } from "@/lib/DashboardContext";
import * as storageSvc from "@/lib/supabase/services/storage";
import { getBookingSummary, type SchoolProfile } from "@/lib/userDashboardData";

const profileSections: Array<{
  title: string;
  description: string;
  fields: Array<{ key: keyof SchoolProfile; label: string; multiline?: boolean; readOnly?: boolean; helperText?: string }>;
}> = [
  {
    title: "Identitas Utama",
    description: "Informasi dasar yang menjadi penanda sekolah pada sistem.",
    fields: [
      { key: "schoolName", label: "Nama Sekolah" },
      { key: "npsn", label: "NPSN" },
      { key: "contactName", label: "PIC / Kontak Utama" },
      { key: "educationLevel", label: "Jenjang" },
      { key: "district", label: "Wilayah" },
    ],
  },
  {
    title: "Kontak dan Operasional",
    description: "Data yang dipakai untuk komunikasi dan koordinasi pendampingan.",
    fields: [
      {
        key: "officialEmail",
        label: "Email Login",
        readOnly: true,
        helperText: "Untuk menjaga konsistensi session, email login belum diubah langsung dari halaman ini.",
      },
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
  const { user, changePassword, updateAvatarPath } = useAuth();
  const { profile, updateProfile, bookings, histories, documents, addToast } = useDashboard();
  const [draft, setDraft] = useState<SchoolProfile>(profile);
  const [isEditing, setIsEditing] = useState(false);
  const [npsnError, setNpsnError] = useState("");
  const [showPasswordPanel, setShowPasswordPanel] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const bookingSummary = useMemo(() => getBookingSummary(bookings), [bookings]);
  const currentProfile = isEditing ? draft : profile;
  const resolvedAvatarPath = profile.avatarPath ?? user?.avatarPath;
  const schoolInitials = profile.schoolName.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
  const profileRequiredFields: Array<keyof SchoolProfile> = [
    "schoolName",
    "npsn",
    "contactName",
    "educationLevel",
    "officialEmail",
    "phone",
    "principalName",
    "operatorName",
    "address",
    "district",
  ];
  const completedFields = profileRequiredFields.filter((field) => {
    const value = profile[field];
    return typeof value === "string" && value.trim().length > 0;
  }).length;
  const completenessPct = Math.round((completedFields / profileRequiredFields.length) * 100);

  useEffect(() => {
    setDraft(profile);
  }, [profile]);

  useEffect(() => {
    let cancelled = false;

    const loadAvatar = async () => {
      if (!resolvedAvatarPath) {
        setAvatarUrl(null);
        return;
      }

      const seedUrl = storageSvc.getSeedDocumentDownloadUrl("avatar", resolvedAvatarPath);
      if (seedUrl) {
        if (!cancelled) {
          setAvatarUrl(seedUrl);
        }
        return;
      }

      const signedUrl = await storageSvc.getSignedUrl(resolvedAvatarPath);
      if (!cancelled) {
        setAvatarUrl(signedUrl);
      }
    };

    void loadAvatar();

    return () => {
      cancelled = true;
    };
  }, [resolvedAvatarPath]);

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

  const submitPasswordChange = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError("Semua field password wajib diisi.");
      setPasswordSuccess("");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      setPasswordSuccess("");
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError("Password baru harus berbeda dari password saat ini.");
      setPasswordSuccess("");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Konfirmasi password tidak sama.");
      setPasswordSuccess("");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      if (!result.success) {
        setPasswordError(result.error ?? "Gagal mengubah password.");
        return;
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSuccess("Password berhasil diubah.");
      addToast("Password berhasil diubah.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file || !user) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      addToast("Gunakan file gambar untuk foto profil.", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast("Foto profil maksimal 5MB.", "error");
      return;
    }

    setIsUploadingAvatar(true);
    let newPath: string | null = null;

    try {
      const uploadResult = await storageSvc.uploadFile(user.id, file, `profile-avatar-${file.name}`);
      if (uploadResult.error) {
        throw new Error(uploadResult.error);
      }

      newPath = uploadResult.path;
      const oldPath = resolvedAvatarPath;

      const avatarResult = await updateAvatarPath(newPath);
      if (!avatarResult.success) {
        throw new Error(avatarResult.error ?? "Gagal menyimpan foto profil.");
      }

      try {
        await updateProfile({ avatarPath: newPath });
      } catch (error) {
        const message = error instanceof Error ? error.message.toLowerCase() : "";
        if (message.includes("avatar_path")) {
          addToast("Foto profil tersimpan lewat akun login. Jalankan migration database agar kolom avatar ikut tersinkron.", "info");
        } else {
          addToast("Foto profil tersimpan, tetapi sinkronisasi profil database gagal. Coba refresh halaman.", "info");
        }
      }

      if (oldPath && oldPath !== newPath) {
        try {
          if (!storageSvc.getSeedDocumentDownloadUrl("avatar", oldPath)) {
            await storageSvc.deleteFile(oldPath);
          }
        } catch (cleanupError) {
          console.error("profile avatar cleanup error:", cleanupError);
          addToast("Foto profil baru tersimpan, tetapi file lama belum berhasil dibersihkan.", "info");
        }
      }
    } catch (error) {
      if (newPath) {
        try {
          await storageSvc.deleteFile(newPath);
        } catch (cleanupError) {
          console.error("profile avatar rollback error:", cleanupError);
        }
      }

      const message =
        error instanceof Error && error.message
          ? error.message
          : "Gagal memperbarui foto profil.";
      addToast(message, "error");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
                <button type="button" onClick={() => setShowPasswordPanel((current) => !current)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Ganti Password</button>
              </>
            )}
          </div>
        </header>

        {/* Password Section */}
        {showPasswordPanel && !isEditing && (
          <section className="rounded-2xl border border-[#e1dce8] bg-[#f9f8fc] p-6 shadow-sm">
            <h2 className="text-[14px] font-bold text-[#2d3e67] mb-4">Ganti Password</h2>
            <div className="grid max-w-2xl gap-4 rounded-2xl border border-[#d8deeb] bg-white p-5">
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d7998]">Password Saat Ini</span>
                <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="min-h-12 rounded-2xl border border-[#d8deeb] bg-[#fcfbfd] px-4 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d7998]">Password Baru</span>
                <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className="min-h-12 rounded-2xl border border-[#d8deeb] bg-[#fcfbfd] px-4 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
              </label>
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-[#6d7998]">Konfirmasi Password Baru</span>
                <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} className="min-h-12 rounded-2xl border border-[#d8deeb] bg-[#fcfbfd] px-4 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
              </label>
              {passwordError ? <p className="text-[13px] font-semibold text-[#a13636]">{passwordError}</p> : null}
              {passwordSuccess ? <p className="text-[13px] font-semibold text-[#205930]">{passwordSuccess}</p> : null}
              <p className="text-[13px] leading-[1.7] text-[#6d7998]">
                Gunakan minimal 8 karakter dan pastikan password baru berbeda dari password lama.
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setShowPasswordPanel(false)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-3 text-[12px] font-bold uppercase text-[#4f5b77] hover:bg-[#eef1f8]">Tutup</button>
              <button type="button" onClick={() => void submitPasswordChange()} disabled={isChangingPassword} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-[12px] font-bold uppercase text-white hover:bg-[#b8933d] disabled:cursor-not-allowed disabled:opacity-60">
                {isChangingPassword ? "Menyimpan..." : "Simpan Password"}
              </button>
            </div>
          </section>
        )}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <article className="overflow-hidden rounded-[32px] border border-[#e2dde8] bg-white shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[260px_minmax(0,1fr)]">
              <div className="border-b border-[#ece6f1] bg-[linear-gradient(180deg,#f9f8fc_0%,#f4f1f7_100%)] p-6 lg:border-b-0 lg:border-r">
                <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={`Foto profil ${profile.schoolName}`} width={80} height={80} unoptimized className="h-20 w-20 rounded-[24px] object-cover shadow-sm" />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#eef4ff] font-[var(--font-fraunces)] text-[28px] text-[#304878]">{schoolInitials}</div>
                )}
                <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar} className="mt-3 rounded-xl border border-[#d8deeb] bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] hover:bg-[#eef1f8] disabled:cursor-not-allowed disabled:opacity-60">
                  {isUploadingAvatar ? "Mengunggah..." : "Update Foto"}
                </button>
                <h2 className="mt-5 font-[var(--font-fraunces)] text-[30px] font-medium leading-[1.05] text-[#121d35]">{profile.schoolName}</h2>
                <p className="mt-3 text-[14px] leading-[1.75] text-[#4f5b77]">Data profil dipakai pada booking, dokumen, dan komunikasi.</p>
                <div className="mt-6 space-y-3 border-t border-[#e5dfeb] pt-5">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#6d7998]">Kontak Utama</p><p className="mt-1 text-[14px] font-medium text-[#25365f]">{profile.contactName || "Belum diisi"}</p></div>
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
                            {(() => {
                              const draftValue = String(draft[field.key] ?? "");
                              const displayValue = String(currentProfile[field.key] ?? "");

                              return isEditing && !field.readOnly ? (
                              <>
                                {field.multiline ? (
                                  <textarea rows={4} value={draftValue} onChange={(e) => setDraft((c) => ({ ...c, [field.key]: e.target.value }))} className="rounded-2xl border border-[#d8deeb] bg-[#fcfbfd] px-4 py-3 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
                                ) : (
                                  <input type="text" value={draftValue} onChange={(e) => { setDraft((c) => ({ ...c, [field.key]: e.target.value })); if (field.key === "npsn") setNpsnError(""); }} className="min-h-12 rounded-2xl border border-[#d8deeb] bg-[#fcfbfd] px-4 text-[14px] text-[#313f61] outline-none focus:border-[#b9c7de]" />
                                )}
                                {field.key === "npsn" && npsnError && <small className="text-[12px] font-bold text-[#a13636]">{npsnError}</small>}
                              </>
                            ) : (
                              <div className="grid gap-2">
                                <div className={`rounded-2xl border px-4 py-3 text-[15px] leading-[1.75] ${field.readOnly ? "border-[#d8deeb] bg-[#f4f6fb] text-[#4f5b77]" : "border-[#ece6f1] bg-[#fcfbfd] text-[#25365f]"}`}>
                                  {displayValue.trim().length > 0 ? displayValue : "Belum diisi"}
                                </div>
                                {field.helperText ? <small className="text-[12px] text-[#6d7998]">{field.helperText}</small> : null}
                              </div>
                              );
                            })()}
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
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Kelengkapan Profil</p>
              <p className="mt-3 font-[var(--font-fraunces)] text-[34px] font-medium text-[#121d35]">{completenessPct}%</p>
              <div className="mt-3 h-2 rounded-full bg-[#eef1f8]">
                <div className="h-2 rounded-full bg-[#d2ac50]" style={{ width: `${completenessPct}%` }} />
              </div>
              <p className="mt-3 text-[13px] leading-[1.7] text-[#4f5b77]">
                {completedFields} dari {profileRequiredFields.length} field utama sudah terisi.
              </p>
            </section>
            <section className="rounded-[28px] border border-[#e2dde8] bg-white p-5 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6d7998]">Catatan</p>
              <div className="mt-4 space-y-3 text-[14px] leading-[1.75] text-[#4f5b77]">
                <p>Pastikan kontak utama, nomor telepon, dan alamat selalu terbarui agar koordinasi pendampingan tidak terlewat.</p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
