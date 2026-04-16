"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ChangeEvent, type FormEvent, Suspense, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useDashboard } from "@/lib/DashboardContext";
import {
  BOOKING_SESSION_OPTIONS,
  normalizeBookingSession,
  SERVICE_CATEGORIES,
} from "@/lib/userDashboardData";

type BookingFormField = "topic" | "category" | "date" | "session" | "goal" | "notes";

interface BookingFormValues {
  topic: string;
  category: string;
  date: string;
  session: string;
  goal: string;
  notes: string;
}

type BookingFormErrors = Partial<Record<BookingFormField, string>>;

function getBookingYearRange() {
  const year = new Date().getFullYear();
  return {
    start: `${year}-01-01`,
    end: `${year}-12-31`,
    label: `Januari sampai Desember ${year}`,
  };
}

function validate(values: BookingFormValues, dateRange = getBookingYearRange()): BookingFormErrors {
  const errors: BookingFormErrors = {};
  if (!values.topic.trim() || values.topic.trim().length < 5) errors.topic = "Topik minimal 5 karakter.";
  if (!values.category) errors.category = "Kategori layanan wajib dipilih.";
  if (!values.date) errors.date = "Tanggal wajib diisi.";
  else if (values.date < dateRange.start || values.date > dateRange.end) errors.date = `Tanggal harus berada dalam rentang ${dateRange.label}.`;
  if (!values.session.trim()) errors.session = "Sesi waktu wajib dipilih.";
  else if (!(BOOKING_SESSION_OPTIONS as readonly string[]).includes(normalizeBookingSession(values.session))) errors.session = "Gunakan pilihan sesi yang tersedia.";
  if (!values.goal.trim() || values.goal.trim().length < 10) errors.goal = "Tujuan minimal 10 karakter.";
  if (!values.notes.trim() || values.notes.trim().length < 10) errors.notes = "Catatan minimal 10 karakter.";
  return errors;
}

export default function DashboardBookingBaruPage() {
  return (
    <Suspense fallback={
      <main className="w-full pb-10 text-[#121d35]">
        <div className="mx-auto max-w-[980px] py-20 text-center">
          <p className="text-[15px] text-[#6d7998]">Memuat formulir booking...</p>
        </div>
      </main>
    }>
      <BookingBaruContent />
    </Suspense>
  );
}

function BookingBaruContent() {
  const { createBooking, checkAvailability, addToast } = useDashboard();
  const searchParams = useSearchParams();
  const prefilledDate = searchParams.get("date") ?? "";
  const bookingDateRange = getBookingYearRange();

  const [values, setValues] = useState<BookingFormValues>({
    topic: "",
    category: "",
    date: prefilledDate,
    session: "",
    goal: "",
    notes: "",
  });
  const [errors, setErrors] = useState<BookingFormErrors>({});
  const [touched, setTouched] = useState<Record<BookingFormField, boolean>>({
    topic: false, category: false, date: false, session: false, goal: false, notes: false,
  });
  const [submitState, setSubmitState] = useState<"idle" | "success">("idle");
  const [submitError, setSubmitError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [availabilityWarning, setAvailabilityWarning] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const availabilityRequestIdRef = useRef(0);

  const onChange = (field: BookingFormField) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const nextValues = { ...values, [field]: event.target.value };
    setValues(nextValues);
    if (touched[field]) setErrors(validate(nextValues));

    if (field === "date" || field === "session") {
      const d = field === "date" ? event.target.value : nextValues.date;
      const s = field === "session" ? normalizeBookingSession(event.target.value) : nextValues.session;
      if (d && s) {
        const requestId = ++availabilityRequestIdRef.current;
        checkAvailability(d, s).then((available) => {
          if (requestId !== availabilityRequestIdRef.current) {
            return;
          }
          setAvailabilityWarning(available ? "" : "Sudah ada booking di tanggal dan sesi yang sama.");
        });
      } else {
        availabilityRequestIdRef.current += 1;
        setAvailabilityWarning("");
      }
    }
  };

  const onBlur = (field: BookingFormField) => () => {
    setTouched((c) => ({ ...c, [field]: true }));
    setErrors(validate(values));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const currentErrors = validate(values);
    setErrors(currentErrors);
    setTouched({ topic: true, category: true, date: true, session: true, goal: true, notes: true });
    if (Object.keys(currentErrors).length > 0) {
      setSubmitError("Periksa kembali data yang bertanda merah sebelum mengirim booking.");
      return;
    }
    if (availabilityWarning) {
      setSubmitError(availabilityWarning);
      return;
    }
    setSubmitError("");
    setConfirmOpen(true);
  };

  const confirmSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const stillAvailable = await checkAvailability(values.date, values.session.trim());
      if (!stillAvailable) {
        const message = "Jadwal sudah dipakai. Pilih tanggal atau sesi lain.";
        setAvailabilityWarning(message);
        setSubmitError(message);
        setConfirmOpen(false);
        addToast(message, "error");
        return;
      }

      const booking = await createBooking({
        topic: values.topic.trim(),
        category: values.category,
        date: values.date,
        session: values.session.trim(),
        goal: values.goal.trim(),
        notes: values.notes.trim(),
      });
      setCreatedId(booking.id);
      setSubmitState("success");
      setConfirmOpen(false);
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Booking gagal dikirim. Coba lagi beberapa saat.";
      setSubmitError(message);
      setConfirmOpen(false);
      addToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="w-full pb-10 text-[#121d35]">
      <div className="mx-auto flex max-w-[980px] flex-col gap-8">
        <div>
          <nav className="mb-6 text-[12px] font-bold text-[#6d7998]">
            <Link href="/dashboard/booking" className="transition-colors hover:text-[#25365f]">Booking</Link>
            <span className="mx-1.5">/</span>
            <span className="text-[#25365f]">Booking Baru</span>
          </nav>
          <h1 className="mt-1 font-[family-name:var(--font-fraunces)] text-[clamp(22px,3vw,32px)] font-bold leading-[1.2] text-[#121d35]">
            Ajukan Sesi Pendampingan
          </h1>
          <p className="mt-2 max-w-[540px] text-[14px] leading-[1.6] text-[#4f5b77]">
            Isi kebutuhan pendampingan dengan lengkap. Tanggal booking aktif untuk {bookingDateRange.label}, termasuk kegiatan yang sudah terlaksana.
          </p>
        </div>

        {submitError ? (
          <section className="rounded-xl border border-[#f0b8b8] bg-[#fff5f5] px-4 py-3 text-[13px] font-semibold text-[#812f2f]">
            {submitError}
          </section>
        ) : null}

        {submitState === "success" ? (
          <section className="rounded-2xl border border-[#d9e7df] bg-[#eef8f2] p-6 shadow-sm">
            <h2 className="font-[var(--font-fraunces)] text-[28px] font-medium text-[#205930]">Booking Berhasil Diajukan</h2>
            <p className="mt-3 text-[15px] leading-[1.6] text-[#2d6a3e]">
              Booking <strong>{createdId}</strong> ({values.topic}) berhasil dibuat dan sedang menunggu verifikasi admin.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link href="/dashboard/booking-jadwal" className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-white no-underline transition-colors hover:bg-[#b8933d]">
                Buka Kalender
              </Link>
              <Link href="/dashboard/booking" className="rounded-xl border border-[#cfd5e6] bg-white px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] no-underline transition-colors hover:bg-[#eef1f8] hover:text-[#25365f]">
                Lihat Daftar Booking
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-[#e1dce8] bg-[#f9f8fc] p-6 shadow-sm">
            <form className="grid gap-5" onSubmit={onSubmit} noValidate>
              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Topik Pendampingan</span>
                <input type="text" value={values.topic} onChange={onChange("topic")} onBlur={onBlur("topic")} placeholder="Contoh: Supervisi Akademik" aria-invalid={Boolean(touched.topic && errors.topic)} className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b7c4df]" />
                {touched.topic && errors.topic && <small className="text-[12px] font-bold text-[#a13636]">{errors.topic}</small>}
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Kategori Layanan</span>
                <select value={values.category} onChange={onChange("category")} onBlur={onBlur("category")} aria-invalid={Boolean(touched.category && errors.category)} className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b7c4df]">
                  <option value="">Pilih kategori...</option>
                  {SERVICE_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {touched.category && errors.category && <small className="text-[12px] font-bold text-[#a13636]">{errors.category}</small>}
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Tanggal</span>
                  <input type="date" value={values.date} min={bookingDateRange.start} max={bookingDateRange.end} onChange={onChange("date")} onBlur={onBlur("date")} aria-invalid={Boolean(touched.date && errors.date)} className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b7c4df]" />
                  <small className="text-[12px] leading-[1.5] text-[#6d7998]">
                    Pilih tanggal kegiatan sebenarnya dalam rentang {bookingDateRange.label}.
                  </small>
                  {touched.date && errors.date && <small className="text-[12px] font-bold text-[#a13636]">{errors.date}</small>}
                </label>
                <label className="grid gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Sesi</span>
                  <select value={values.session} onChange={onChange("session")} onBlur={onBlur("session")} aria-invalid={Boolean(touched.session && errors.session)} className="min-h-11 rounded-xl border border-[#d7deef] bg-white px-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b7c4df]">
                    <option value="">Pilih sesi...</option>
                    {BOOKING_SESSION_OPTIONS.map((sessionOption) => (
                      <option key={sessionOption} value={sessionOption}>{sessionOption}</option>
                    ))}
                  </select>
                  {touched.session && errors.session && <small className="text-[12px] font-bold text-[#a13636]">{errors.session}</small>}
                </label>
              </div>

              {availabilityWarning && (
                <p className="rounded-xl border border-[#f1d9a8] bg-[#fff7e8] px-4 py-3 text-[13px] font-semibold text-[#8a5e1a]">
                  {availabilityWarning}
                </p>
              )}

              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Tujuan Pendampingan</span>
                <textarea rows={4} value={values.goal} onChange={onChange("goal")} onBlur={onBlur("goal")} placeholder="Jelaskan tujuan utama sesi pendampingan" aria-invalid={Boolean(touched.goal && errors.goal)} className="rounded-xl border border-[#d7deef] bg-white px-3 py-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b7c4df]" />
                {touched.goal && errors.goal && <small className="text-[12px] font-bold text-[#a13636]">{errors.goal}</small>}
              </label>

              <label className="grid gap-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#6d7998]">Catatan Tambahan</span>
                <textarea rows={5} value={values.notes} onChange={onChange("notes")} onBlur={onBlur("notes")} placeholder="Kebutuhan khusus, dokumen yang harus disiapkan, atau konteks lain." aria-invalid={Boolean(touched.notes && errors.notes)} className="rounded-xl border border-[#d7deef] bg-white px-3 py-3 text-[14px] text-[#313f61] outline-none transition-colors focus:border-[#b7c4df]" />
                {touched.notes && errors.notes && <small className="text-[12px] font-bold text-[#a13636]">{errors.notes}</small>}
              </label>

              <div className="flex flex-col gap-3 border-t border-[#e1dce8] pt-5 sm:flex-row sm:justify-end">
                <Button href="/dashboard/booking" variant="outline" size="md">Batal</Button>
                <Button type="submit" variant="primary" size="md">Kirim Booking</Button>
              </div>
            </form>
          </section>
        )}
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Konfirmasi Booking"
        footer={
          <>
            <button type="button" onClick={() => setConfirmOpen(false)} className="rounded-xl border border-[#d8deeb] bg-white px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-[#4f5b77] hover:bg-[#eef1f8]">Kembali</button>
            <button type="button" onClick={confirmSubmit} disabled={isSubmitting} className="rounded-xl border border-[#c79a3c] bg-[#d2ac50] px-4 py-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-white hover:bg-[#b8933d] disabled:cursor-not-allowed disabled:opacity-50">
              {isSubmitting ? "Mengirim..." : "Ya, Kirim Booking"}
            </button>
          </>
        }
      >
        <div className="text-[14px] leading-[1.6] text-[#4f5b77]">
          <p className="mb-4">Apakah data berikut sudah benar?</p>
          <div className="space-y-2 rounded-xl bg-[#f9f8fc] border border-[#e1dce8] p-4">
            <div><span className="text-[11px] font-bold uppercase text-[#6d7998]">Topik:</span> <span className="font-semibold text-[#25365f]">{values.topic}</span></div>
            <div><span className="text-[11px] font-bold uppercase text-[#6d7998]">Kategori:</span> <span className="font-semibold text-[#25365f]">{values.category}</span></div>
            <div><span className="text-[11px] font-bold uppercase text-[#6d7998]">Tanggal:</span> <span className="font-semibold text-[#25365f]">{values.date}</span></div>
            <div><span className="text-[11px] font-bold uppercase text-[#6d7998]">Sesi:</span> <span className="font-semibold text-[#25365f]">{values.session}</span></div>
          </div>
        </div>
      </Modal>
    </main>
  );
}
