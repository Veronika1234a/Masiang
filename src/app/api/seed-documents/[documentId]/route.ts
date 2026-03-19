import { NextResponse } from "next/server";

const seedDocumentContent: Record<
  string,
  { fileName: string; lines: string[] }
> = {
  "DOC-004": {
    fileName: "Berita Acara Pendampingan.pdf",
    lines: [
      "MASIANG - Berita Acara Pendampingan",
      "Dokumen seed untuk pengujian unduh arsip user.",
      "Topik: Pendampingan Kurikulum Operasional Sekolah",
      "Status: Menunggu Review",
    ],
  },
  "DOC-005": {
    fileName: "Laporan Refleksi Program.pdf",
    lines: [
      "MASIANG - Laporan Refleksi Program",
      "Dokumen seed untuk pengujian unduh arsip user.",
      "Status review: Perlu Revisi",
      "Catatan: Tambahkan data kuantitatif hasil asesmen siswa.",
    ],
  },
};

function escapePdfText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildSimplePdf(lines: string[]): string {
  const encoder = new TextEncoder();
  const streamBody = [
    "BT",
    "/F1 16 Tf",
    "50 790 Td",
    ...lines.flatMap((line, index) =>
      index === 0
        ? [`(${escapePdfText(line)}) Tj`]
        : ["0 -24 Td", `(${escapePdfText(line)}) Tj`],
    ),
    "ET",
  ].join("\n");

  const streamBodyLength = encoder.encode(streamBody).length;
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Count 1 /Kids [3 0 R] >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${streamBodyLength} >>\nstream\n${streamBody}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += object;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ documentId: string }> },
) {
  const { documentId } = await context.params;
  const document = seedDocumentContent[documentId];

  if (!document) {
    return NextResponse.json({ error: "Seed document not found." }, { status: 404 });
  }

  const pdf = buildSimplePdf(document.lines);
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${document.fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
