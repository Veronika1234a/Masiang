import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/AppProviders";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://masiang.id"),
  title: "MASIANG | Sistem Pendampingan Pendidikan",
  description:
    "Platform pendampingan pendidikan berbasis data untuk sekolah dan pengawas.",
  applicationName: "MASIANG",
  openGraph: {
    title: "MASIANG | Sistem Pendampingan Pendidikan",
    description:
      "Platform pendampingan pendidikan berbasis data untuk sekolah dan pengawas.",
    siteName: "MASIANG",
    locale: "id_ID",
    type: "website",
    images: ["/assets/masiang/hero-preview.svg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "MASIANG | Sistem Pendampingan Pendidikan",
    description:
      "Platform pendampingan pendidikan berbasis data untuk sekolah dan pengawas.",
    images: ["/assets/masiang/hero-preview.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${plusJakarta.variable} ${fraunces.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
