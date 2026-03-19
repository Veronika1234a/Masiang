import type { BookingItem, SchoolDocument, RiwayatItem } from "./userDashboardData";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function openBookingPrintReport(input: {
  booking: BookingItem;
  documents: SchoolDocument[];
  history?: RiwayatItem | null;
}): boolean {
  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=960,height=1200");
  if (!printWindow) {
    return false;
  }

  const { booking, documents, history } = input;
  const timelineRows = booking.timeline
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.title)}</td>
          <td>${escapeHtml(item.note)}</td>
          <td>${escapeHtml(item.time)}</td>
          <td>${escapeHtml(item.status)}</td>
        </tr>
      `,
    )
    .join("");

  const documentRows = documents.length
    ? documents
        .map(
          (document) => `
            <tr>
              <td>${escapeHtml(document.id)}</td>
              <td>${escapeHtml(document.fileName)}</td>
              <td>${escapeHtml(document.stage)}</td>
              <td>${escapeHtml(document.reviewStatus ?? "Belum direview")}</td>
            </tr>
          `,
        )
        .join("")
    : `
      <tr>
        <td colspan="4">Belum ada dokumen terkait booking ini.</td>
      </tr>
    `;

  const html = `
    <!doctype html>
    <html lang="id">
      <head>
        <meta charset="utf-8" />
        <title>Laporan Booking ${escapeHtml(booking.id)}</title>
        <style>
          body { font-family: Georgia, serif; color: #1c2743; margin: 40px; }
          h1, h2 { margin: 0; }
          p { margin: 0; }
          .header { border-bottom: 2px solid #d9c59a; padding-bottom: 18px; margin-bottom: 24px; }
          .eyebrow { font-size: 11px; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase; color: #7a849d; }
          .title { font-size: 30px; margin-top: 8px; }
          .meta-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 24px; }
          .card { border: 1px solid #dde3f0; border-radius: 14px; padding: 16px; background: #fbfaf8; }
          .label { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; font-weight: 700; color: #7a849d; margin-bottom: 6px; }
          .value { font-size: 15px; font-weight: 600; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; margin-top: 14px; }
          th, td { border: 1px solid #dde3f0; padding: 10px 12px; font-size: 13px; text-align: left; vertical-align: top; }
          th { background: #f4f1f7; text-transform: uppercase; letter-spacing: 0.08em; font-size: 11px; }
          .section { margin-top: 28px; }
          .section h2 { font-size: 18px; margin-bottom: 10px; }
          .note-box { border: 1px solid #d8deeb; border-radius: 14px; padding: 14px; background: #f8fafc; line-height: 1.7; }
          .footer { margin-top: 32px; font-size: 12px; color: #6d7998; }
          @media print {
            body { margin: 20px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="eyebrow">MASIANG / Laporan Booking</div>
          <h1 class="title">${escapeHtml(booking.topic)}</h1>
          <p style="margin-top: 10px; font-size: 14px; color: #4f5b77;">ID Booking: ${escapeHtml(booking.id)}</p>
        </div>

        <div class="meta-grid">
          <div class="card"><div class="label">Sekolah</div><div class="value">${escapeHtml(booking.school)}</div></div>
          <div class="card"><div class="label">Kategori</div><div class="value">${escapeHtml(booking.category ?? "-")}</div></div>
          <div class="card"><div class="label">Tanggal</div><div class="value">${escapeHtml(booking.dateISO)}</div></div>
          <div class="card"><div class="label">Sesi</div><div class="value">${escapeHtml(booking.session)}</div></div>
          <div class="card"><div class="label">Status</div><div class="value">${escapeHtml(booking.status)}</div></div>
          <div class="card"><div class="label">Riwayat Terkait</div><div class="value">${escapeHtml(history?.id ?? "-")}</div></div>
        </div>

        <div class="section">
          <h2>Tujuan dan Catatan</h2>
          <div class="note-box">
            <p><strong>Tujuan:</strong> ${escapeHtml(booking.goal ?? "-")}</p>
            <p style="margin-top: 10px;"><strong>Catatan:</strong> ${escapeHtml(booking.notes ?? "-")}</p>
            <p style="margin-top: 10px;"><strong>Catatan Pengawas:</strong> ${escapeHtml(booking.supervisorNotes ?? "-")}</p>
          </div>
        </div>

        <div class="section">
          <h2>Timeline Booking</h2>
          <table>
            <thead>
              <tr>
                <th>Tahap</th>
                <th>Catatan</th>
                <th>Waktu</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>${timelineRows}</tbody>
          </table>
        </div>

        <div class="section">
          <h2>Dokumen Terkait</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nama Dokumen</th>
                <th>Tahap</th>
                <th>Status Review</th>
              </tr>
            </thead>
            <tbody>${documentRows}</tbody>
          </table>
        </div>

        <div class="footer">
          Laporan ini dicetak dari dashboard MASIANG pada ${escapeHtml(new Date().toLocaleString("id-ID"))}.
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => {
    printWindow.print();
  }, 150);
  return true;
}
