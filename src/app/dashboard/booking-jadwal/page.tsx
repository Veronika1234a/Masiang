"use client";

import Link from "next/link";
import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { useDashboard } from "@/lib/DashboardContext";
import {
  formatLongDateID,
  type BookingItem,
  type BookingStatus,
} from "@/lib/userDashboardData";

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const WEEKDAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const stageItems = [
  { title: "Melayani", desc: "Penjadwalan awal dan penyusunan rencana pendampingan.", tone: "blue" },
  { title: "Adaptif", desc: "Analisis rapor pendidikan dan kebutuhan sekolah.", tone: "gold" },
  { title: "Pelaksanaan", desc: "Implementasi program dan monitoring kegiatan.", tone: "cyan" },
  { title: "Laporan & Evaluasi", desc: "Penyusunan laporan akhir dan dokumentasi hasil.", tone: "amber" },
] as const;

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function buildCalendarDays(viewMonth: Date): Date[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const startWeekDay = new Date(year, month, 1).getDay();
  const gridStart = new Date(year, month, 1 - startWeekDay);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

function getInitialMonth(bookings: BookingItem[]) {
  const first = bookings.find((b) => b.status !== "Dibatalkan" && b.status !== "Ditolak");
  if (!first) return new Date();
  const d = new Date(`${first.dateISO}T00:00:00`);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function stageToneClass(tone: string) {
  if (tone === "blue") return "bg-[#4f8fdb]";
  if (tone === "gold") return "bg-[#d4a95c]";
  if (tone === "cyan") return "bg-[#3f95a5]";
  return "bg-[#ca9a3d]";
}

function dotColorClass(status: BookingStatus) {
  if (status === "Disetujui") return "bg-[#2d7480]";
  if (status === "Dalam Proses") return "bg-[#ad7a2c]";
  if (status === "Selesai") return "bg-[#205930]";
  if (status === "Ditolak" || status === "Dibatalkan") return "bg-[#a3adc2]";
  return "bg-[#496b9f]";
}

function badgeColorClass(status: BookingStatus) {
  if (status === "Disetujui") return "bg-[#d8eef0] text-[#2d7480]";
  if (status === "Dalam Proses") return "bg-[#fff2de] text-[#ad7a2c]";
  if (status === "Selesai") return "bg-[#d9e7df] text-[#205930]";
  if (status === "Ditolak") return "bg-[#ffe9e9] text-[#812f2f]";
  if (status === "Dibatalkan") return "bg-[#f0eef2] text-[#6d7998]";
  return "bg-[#dce7fb] text-[#496b9f]";
}

const ALL_FILTERS: Array<BookingStatus | "Semua"> = ["Semua", "Disetujui", "Dalam Proses", "Menunggu", "Selesai", "Ditolak", "Dibatalkan"];

export default function BookingJadwalPage() {
  const { bookings, histories } = useDashboard();
  const [viewMonth, setViewMonth] = useState(() => getInitialMonth(bookings));
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "Semua">("Semua");
  const [selectedEvent, setSelectedEvent] = useState<BookingItem | null>(bookings[0] ?? null);
  const [panelPosition, setPanelPosition] = useState({ top: 0, left: 0 });
  const [panelOpen, setPanelOpen] = useState(false);
  const calendarAreaRef = useRef<HTMLDivElement | null>(null);

  const monthLabel = `${MONTH_NAMES[viewMonth.getMonth()]} ${viewMonth.getFullYear()}`;

  const filteredEvents = useMemo(() => {
    if (statusFilter === "Semua") return bookings;
    return bookings.filter((b) => b.status === statusFilter);
  }, [bookings, statusFilter]);

  const days = useMemo(() => buildCalendarDays(viewMonth), [viewMonth]);

  const eventsByDate = useMemo(() => {
    return filteredEvents.reduce<Record<string, BookingItem[]>>((acc, item) => {
      if (!acc[item.dateISO]) acc[item.dateISO] = [];
      acc[item.dateISO].push(item);
      return acc;
    }, {});
  }, [filteredEvents]);

  const followUpDates = useMemo(() => {
    const dates = new Set<string>();
    for (const h of histories) {
      if (h.followUpISO && !h.followUpDone) dates.add(h.followUpISO);
    }
    return dates;
  }, [histories]);

  const visibleSelectedEvent = selectedEvent && filteredEvents.some((b) => b.id === selectedEvent.id) ? selectedEvent : null;

  const prevMonth = () => { setViewMonth((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1)); setPanelOpen(false); };
  const nextMonth = () => { setViewMonth((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1)); setPanelOpen(false); };

  const openEventPanel = (event: BookingItem, clickEvent: MouseEvent<HTMLButtonElement>) => {
    const container = calendarAreaRef.current;
    if (!container) { setSelectedEvent(event); setPanelOpen(true); return; }
    const br = clickEvent.currentTarget.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const pw = 340, gap = 12;
    let left = br.right - cr.left + gap;
    if (left + pw > cr.width) left = br.left - cr.left - pw - gap;
    if (left < 0) left = 16;
    let top = br.top - cr.top - 10;
    if (top < 0) top = 16;
    setPanelPosition({ top, left });
    setSelectedEvent(event);
    setPanelOpen(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setPanelOpen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <main className="text-[#121d35] w-full pb-10">
      <div className="mx-auto max-w-[1280px]">
        <nav className="mb-4 text-[12px] font-bold text-[#6d7998]">
          <span className="text-[#25365f]">Booking Jadwal</span>
        </nav>
        <header className="mb-10 max-w-2xl">
          <h1 className="m-0 font-[var(--font-fraunces)] text-[clamp(28px,3vw,42px)] font-medium leading-[1.2] text-[#121d35]">Booking Jadwal</h1>
          <p className="mt-3 text-[15px] leading-[1.6] text-[#313f61]">Atur dan ajukan jadwal pendampingan sesuai ketersediaan waktu sekolah Anda.</p>
        </header>

        <section className="mb-12">
          <h2 className="mb-5 text-[14px] font-bold text-[#2d3e67]">Tahapan Pendampingan MASIANG</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {stageItems.map((item, idx) => (
              <article key={item.title} className="group rounded-xl border border-[#e1dce8] bg-[#f9f8fc] p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:border-[#cfd5e6] hover:-translate-y-0.5">
                <div className="mb-4"><div className={`flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-bold text-white ${stageToneClass(item.tone)}`}>0{idx + 1}</div></div>
                <h3 className="mb-1.5 font-bold text-[18px] text-[#273a63]">{item.title}</h3>
                <p className="text-[13px] leading-relaxed text-[#4f5b77]">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section ref={calendarAreaRef} className="relative rounded-2xl border border-[#e1dce8] bg-[#f9f8fc] p-5 lg:p-6 shadow-sm">
          <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="flex items-center justify-between md:justify-start gap-4">
              <button type="button" onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#cfd5e6] bg-[#f3f2f8] text-[#4a5f8e] hover:bg-[#e4e9f2]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
              </button>
              <h3 className="min-w-[160px] text-center text-[20px] font-bold text-[#2d3e67]">{monthLabel}</h3>
              <button type="button" onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#cfd5e6] bg-[#f3f2f8] text-[#4a5f8e] hover:bg-[#e4e9f2]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ALL_FILTERS.map((val) => (
                <button key={val} type="button" onClick={() => { setStatusFilter(val); setPanelOpen(false); }} className={`rounded-md border px-3.5 py-1.5 text-[13px] font-bold transition-all duration-200 ${statusFilter === val ? "border-[#b7c4df] bg-[#e9eef9] text-[#254d92] shadow-sm" : "border-[#cfd5e6] bg-white text-[#4f5b77] hover:bg-[#f3f2f8]"}`}>
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[800px] rounded-xl border border-[#e1dce8] bg-white overflow-hidden shadow-[0_2px_10px_rgba(20,30,50,0.03)]">
              <div className="grid grid-cols-7 border-b border-[#e1dce8] bg-[#f4f1f7]">
                {WEEKDAYS.map((day, i) => (
                  <div key={day} className={`px-3 py-3 text-center text-[13px] font-semibold text-[#526084] ${i !== 6 ? "border-r border-[#e1dce8]" : ""}`}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 bg-white">
                {days.map((day, index) => {
                  const inCurrentMonth = day.getMonth() === viewMonth.getMonth();
                  const iso = toISODate(day);
                  const dayEvents = eventsByDate[iso] ?? [];
                  const isSunday = day.getDay() === 0;
                  const hasFollowUp = followUpDates.has(iso);
                  const isLastInRow = (index + 1) % 7 === 0;
                  const isBottomRow = index >= 35;

                  return (
                    <article key={iso} className={`group min-h-[120px] p-2.5 transition-colors ${!inCurrentMonth ? "bg-[#fcfbfe]" : isSunday ? "bg-[#faf8f8]" : ""} ${!isLastInRow ? "border-r border-[#eceaef]" : ""} ${!isBottomRow ? "border-b border-[#eceaef]" : ""} hover:bg-[#f5f3f7]`}>
                      <header className="mb-2 flex items-center justify-between">
                        <span className={`text-[13px] font-bold ${!inCurrentMonth ? "text-[#a3adc2]" : isSunday ? "text-[#c06060]" : "text-[#34466f]"}`}>{day.getDate()}</span>
                        <div className="flex items-center gap-1">
                          {hasFollowUp && <span className="h-1.5 w-1.5 rounded-full bg-[#c44444]" title="Tindak lanjut" />}
                          {dayEvents.length > 0 && <span className="text-[10px] font-semibold text-[#8C847A] opacity-0 group-hover:opacity-100 transition-opacity">{dayEvents.length}</span>}
                        </div>
                      </header>
                      <div className="flex flex-col gap-1.5">
                        {dayEvents.length === 0 && inCurrentMonth && !isSunday && (
                          <Link href={`/dashboard/booking-baru?date=${iso}`} className="hidden group-hover:flex items-center justify-center rounded border border-dashed border-[#cfd5e6] py-1.5 text-[10px] font-bold text-[#6d7998] transition-colors hover:border-[#b7c4df] hover:text-[#4a5f8e]">
                            + Booking
                          </Link>
                        )}
                        {dayEvents.slice(0, 3).map((event) => {
                          const isSelected = selectedEvent?.id === event.id && panelOpen;
                          return (
                            <button key={event.id} type="button" onClick={(e) => openEventPanel(event, e)} className={`flex w-full flex-col gap-0.5 rounded border px-2 py-1.5 text-left transition-all duration-200 ${isSelected ? "bg-white border-[#34466f] shadow-[0_2px_8px_rgba(20,30,50,0.1)]" : "bg-white border-[#e1dce8] hover:border-[#c2cbe0]"}`}>
                              <div className="flex items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColorClass(event.status)}`} />
                                <span className="truncate text-[11px] font-bold text-[#313f61]">{event.session}</span>
                              </div>
                              <span className="w-full truncate text-[10px] text-[#6d7998] font-medium pl-3">{event.school}</span>
                            </button>
                          );
                        })}
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Desktop floating panel */}
          <aside className={`pointer-events-auto absolute z-30 hidden w-[320px] rounded-xl border border-[#dfdbe6] bg-white p-5 shadow-[0_16px_32px_-8px_rgba(20,30,50,0.18)] transition-all duration-300 lg:block ${panelOpen && selectedEvent ? "translate-y-0 scale-100 opacity-100 visible" : "translate-y-2 scale-[0.98] opacity-0 invisible"}`} style={{ top: `${panelPosition.top}px`, left: `${panelPosition.left}px` }}>
            {visibleSelectedEvent && panelOpen && (
              <>
                <header className="mb-4 flex items-start justify-between border-b border-[#eceaef] pb-3">
                  <div>
                    <h4 className="m-0 font-bold text-[18px] text-[#25365f]">{formatLongDateID(visibleSelectedEvent.dateISO)}</h4>
                    <p className="mt-1 text-[13px] text-[#6d7998] font-medium">{visibleSelectedEvent.topic}</p>
                  </div>
                  <button type="button" onClick={() => setPanelOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f3f2f8] text-[#6d7998] hover:bg-[#e4e9f2]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </header>
                <div className="mb-5 flex flex-col gap-3.5">
                  <div><span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Instansi</span><p className="text-[14px] font-semibold text-[#313f61]">{visibleSelectedEvent.school}</p></div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div><span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Waktu</span><p className="text-[13px] font-semibold text-[#313f61]">{visibleSelectedEvent.session}</p></div>
                    <div><span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Tahapan</span><p className="text-[13px] font-semibold text-[#313f61]">{visibleSelectedEvent.timeline.find((t) => t.status === "active")?.title ?? "—"}</p></div>
                  </div>
                  <div className="mt-1"><span className={`inline-flex rounded-md px-3 py-1.5 text-[11px] font-bold ${badgeColorClass(visibleSelectedEvent.status)}`}>{visibleSelectedEvent.status}</span></div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/booking/${visibleSelectedEvent.id}`} className="flex-1 rounded-lg bg-[#d2ac50] px-4 py-2 text-center text-[13px] font-bold text-white hover:bg-[#b8933d]">Detail Penuh</Link>
                  <button type="button" onClick={() => setPanelOpen(false)} className="flex-1 rounded-lg border border-[#cfd5e6] bg-[#f9f8fc] px-4 py-2 text-center text-[13px] font-bold text-[#4f5b77] hover:bg-[#eef1f8]">Tutup</button>
                </div>
              </>
            )}
          </aside>

          {/* Mobile panel */}
          <div className={`mt-5 rounded-xl border border-[#dfdbe6] bg-white p-5 shadow-sm lg:hidden transition-all duration-300 ${panelOpen && selectedEvent ? "block" : "hidden"}`}>
            {visibleSelectedEvent && (
              <>
                <header className="mb-4 flex items-start justify-between border-b border-[#eceaef] pb-3">
                  <div>
                    <h4 className="m-0 font-bold text-[18px] text-[#25365f]">{formatLongDateID(visibleSelectedEvent.dateISO)}</h4>
                    <p className="mt-1 text-[13px] text-[#6d7998]">{visibleSelectedEvent.topic}</p>
                  </div>
                  <button type="button" onClick={() => { setPanelOpen(false); setSelectedEvent(null); }} className="flex h-7 w-7 items-center justify-center rounded-md bg-[#f3f2f8] text-[#6d7998]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </header>
                <div className="mb-5 flex flex-col gap-3.5">
                  <div><span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Instansi</span><p className="text-[14px] font-semibold text-[#313f61]">{visibleSelectedEvent.school}</p></div>
                  <div className="grid grid-cols-2 gap-3.5">
                    <div><span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Waktu</span><p className="text-[13px] font-semibold text-[#313f61]">{visibleSelectedEvent.session}</p></div>
                    <div><span className="text-[11px] font-bold uppercase tracking-wide text-[#6d7998]">Tahapan</span><p className="text-[13px] font-semibold text-[#313f61]">{visibleSelectedEvent.timeline.find((t) => t.status === "active")?.title ?? "—"}</p></div>
                  </div>
                  <div className="mt-1"><span className={`inline-flex rounded-md px-3 py-1.5 text-[11px] font-bold ${badgeColorClass(visibleSelectedEvent.status)}`}>{visibleSelectedEvent.status}</span></div>
                </div>
                <Link href={`/dashboard/booking/${visibleSelectedEvent.id}`} className="block w-full rounded-lg bg-[#d2ac50] px-4 py-2.5 text-center text-[13px] font-bold text-white hover:bg-[#b8933d]">Lihat Detail Penuh</Link>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
